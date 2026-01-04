/**
 * Script to load dishes from data/processed/ JSON files into the database
 *
 * Usage:
 *   npx tsx scripts/load-dishes.ts <group_id>
 *
 * Example:
 *   npx tsx scripts/load-dishes.ts 123e4567-e89b-12d3-a456-426614174000
 *
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - Group must exist in database
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import type { Database } from '../types/database';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

type DishInsert = Database['public']['Tables']['dishes']['Insert'];

interface RawDish {
  name: string;
  ingredients: string[];
  process?: string[];
  notes?: string;
  category?: string;
  tags?: string[];
  image?: string;
}

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Missing environment variables');
  console.error(
    'Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
  );
  process.exit(1);
}

// Get group ID from command line
const groupId = process.argv[2];
if (!groupId) {
  console.error('Error: Missing group_id parameter');
  console.error('Usage: npx tsx scripts/load-dishes.ts <group_id>');
  process.exit(1);
}

// Validate UUID format
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(groupId)) {
  console.error('Error: Invalid group_id format. Must be a valid UUID.');
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Normalize category to valid database enum value
 */
function normalizeCategory(
  category?: string
): 'appetizer' | 'main' | 'dessert' {
  if (!category) return 'main';

  const normalized = category.toLowerCase().trim();

  if (normalized === 'appetizer' || normalized === 'starter')
    return 'appetizer';
  if (normalized === 'dessert' || normalized === 'sweet') return 'dessert';
  return 'main';
}

/**
 * Convert process array to recipe string
 */
function processToRecipe(process?: string[], notes?: string): string | null {
  if (!process || process.length === 0) return notes || null;

  const recipeText = process
    .map((step, index) => `${index + 1}. ${step}`)
    .join('\n\n');

  if (notes) {
    return `${recipeText}\n\n备注：${notes}`;
  }

  return recipeText;
}

/**
 * Check if image is a remote URL
 */
function isRemoteUrl(image?: string): boolean {
  if (!image) return false;
  return image.startsWith('http://') || image.startsWith('https://');
}

/**
 * Download image from remote URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Get image buffer from local file or remote URL
 */
async function getImageBuffer(
  imagePath: string
): Promise<{ buffer: Buffer; filename: string }> {
  if (isRemoteUrl(imagePath)) {
    // Download from remote URL
    const buffer = await downloadImage(imagePath);
    // Extract filename from URL or generate one
    const urlPath = new URL(imagePath).pathname;
    const filename = basename(urlPath) || `image-${Date.now()}.jpg`;
    return { buffer, filename };
  } else {
    // Read from local file
    const fullPath = join(process.cwd(), imagePath);
    if (!existsSync(fullPath)) {
      throw new Error(`Local file not found: ${fullPath}`);
    }
    const buffer = readFileSync(fullPath);
    const filename = basename(imagePath);
    return { buffer, filename };
  }
}

/**
 * Upload image to Supabase Storage and return signed URL
 */
async function uploadImageToStorage(
  imagePath: string,
  groupId: string,
  dishName: string
): Promise<string | null> {
  try {
    const { buffer, filename } = await getImageBuffer(imagePath);

    // Generate unique filename
    const ext = extname(filename) || '.jpg';
    const sanitizedDishName = dishName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    const timestamp = Date.now();
    const storagePath = `${groupId}/${sanitizedDishName}_${timestamp}${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('dish-images')
      .upload(storagePath, buffer, {
        contentType: getContentType(ext),
        upsert: false,
      });

    if (uploadError) {
      console.error(`   ⚠️  Image upload failed: ${uploadError.message}`);
      return null;
    }

    // Return storage path (signed URLs are generated on-demand when displaying)
    return storagePath;
  } catch (error) {
    console.error(`   ⚠️  Image processing failed:`, error);
    return null;
  }
}

/**
 * Get MIME type from file extension
 */
function getContentType(ext: string): string {
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return types[ext.toLowerCase()] || 'image/jpeg';
}

/**
 * Transform raw dish data to database insert format
 */
async function transformDish(
  raw: RawDish,
  groupId: string
): Promise<DishInsert> {
  // Handle image upload if present
  let imageUrl: string | null = null;
  if (raw.image) {
    console.log(`   📸 Processing image for "${raw.name}"...`);
    imageUrl = await uploadImageToStorage(raw.image, groupId, raw.name);
    if (imageUrl) {
      console.log(`   ✅ Image uploaded successfully`);
    }
  }

  return {
    group_id: groupId,
    name: raw.name,
    description: raw.notes || null,
    recipe: processToRecipe(raw.process, undefined),
    ingredients: raw.ingredients,
    tags: raw.tags || [],
    category: normalizeCategory(raw.category),
    image_url: imageUrl,
  };
}

/**
 * Load dishes from a JSON file
 */
function loadDishesFromFile(filePath: string): RawDish[] {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as RawDish[];
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🍳 TableMate Dish Loader');
  console.log('========================\n');

  // Verify group exists
  console.log(`Verifying group: ${groupId}`);
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, name, description')
    .eq('id', groupId)
    .single();

  if (groupError || !group) {
    console.error(`❌ Error: Group with ID ${groupId} not found in database`);
    console.error('Please create the group first or use a valid group_id');
    process.exit(1);
  }

  const groupName = (group as any).name || 'Unknown';
  console.log(`✅ Group found: ${groupName}\n`);

  // Load dishes from both files
  const dataDir = join(process.cwd(), 'data', 'processed');
  const notesFile = join(dataDir, 'notes_from_note.json');
  const imageAnalysisFile = join(dataDir, 'image_analysis_results.json');

  console.log('Loading dish data...');
  const dishesFromNotes = loadDishesFromFile(notesFile);
  const dishesFromImages = loadDishesFromFile(imageAnalysisFile);

  console.log(`  📄 notes_from_note.json: ${dishesFromNotes.length} dishes`);
  console.log(
    `  📄 image_analysis_results.json: ${dishesFromImages.length} dishes`
  );

  // Combine dishes
  const allRawDishes = [...dishesFromNotes, ...dishesFromImages];

  console.log(`\n📊 Total dishes to process: ${allRawDishes.length}`);
  console.log(
    `   Appetizers: ${allRawDishes.filter((d) => normalizeCategory(d.category) === 'appetizer').length}`
  );
  console.log(
    `   Mains: ${allRawDishes.filter((d) => normalizeCategory(d.category) === 'main').length}`
  );
  console.log(
    `   Desserts: ${allRawDishes.filter((d) => normalizeCategory(d.category) === 'dessert').length}`
  );
  console.log(`   With images: ${allRawDishes.filter((d) => d.image).length}`);

  // Ask for confirmation
  console.log(
    '\n⚠️  This will upload images and insert all dishes into the database.'
  );
  console.log('   Press Ctrl+C to cancel, or press Enter to continue...');

  // Wait for user input (simple version for Node.js)
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => resolve());
  });

  // Transform and insert dishes one by one (to handle image uploads)
  console.log('\n🔄 Processing dishes...\n');

  let successCount = 0;
  let errorCount = 0;
  let imagesUploaded = 0;

  for (let i = 0; i < allRawDishes.length; i++) {
    const rawDish = allRawDishes[i];
    console.log(
      `[${i + 1}/${allRawDishes.length}] Processing: ${rawDish.name}`
    );

    try {
      // Transform dish (includes image upload)
      const transformedDish = await transformDish(rawDish, groupId);

      if (transformedDish.image_url) {
        imagesUploaded++;
      }

      // Insert into database
      const { error } = await supabase
        .from('dishes')
        .insert(transformedDish as any)
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Database error: ${error.message}\n`);
        errorCount++;
      } else {
        console.log(
          `   ✅ Inserted successfully (${transformedDish.category})\n`
        );
        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ Error processing dish:`, error);
      console.log('');
      errorCount++;
    }
  }

  console.log(`\n📊 Final Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📝 Total: ${allRawDishes.length}`);
  console.log(`   📸 Images uploaded: ${imagesUploaded}`);

  console.log('\n✨ Done!');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
