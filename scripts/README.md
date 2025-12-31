# Scripts

This directory contains utility scripts for TableMate.

## Available Scripts

### load-dishes.ts

Loads dish data from `data/processed/` JSON files into the database.

#### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Ensure environment variables are set in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. Get your host user ID:
   - Sign in to your app at http://localhost:3000
   - Open browser console and run: `(await supabase.auth.getUser()).data.user.id`
   - Or query the `profiles` table in Supabase dashboard

#### Usage

```bash
npm run load-dishes <host_id>
```

**Example:**
```bash
npm run load-dishes 123e4567-e89b-12d3-a456-426614174000
```

#### What It Does

1. **Reads** dish data from:
   - `data/processed/notes_from_note.json`
   - `data/processed/image_analysis_results.json`

2. **Processes images**:
   - **Remote URLs**: Downloads images from http/https URLs
   - **Local files**: Reads images from local file paths
   - Uploads all images to Supabase Storage (`dish-images` bucket)
   - Generates unique filenames: `{host_id}/{dish_name}_{timestamp}.{ext}`
   - Returns public URLs for each uploaded image

3. **Transforms** the data:
   - Maps `process` array → `recipe` field (numbered steps)
   - Maps `notes` → `description` field
   - Normalizes `category` to valid enum values (appetizer/main/dessert)
   - Defaults missing categories to "main"
   - Uploads and includes image URLs

4. **Inserts** all dishes into the database under the specified host

5. **Reports** success/failure for each dish and image upload statistics

#### Data Format

Expected JSON format:
```json
[
  {
    "name": "Dish Name",
    "ingredients": ["ingredient1", "ingredient2"],
    "process": ["Step 1", "Step 2"],
    "notes": "Additional notes",
    "category": "main",
    "tags": ["#tag1", "#tag2"],
    "image": "https://example.com/image.jpg"
  }
]
```

#### Output Example

```
🍳 TableMate Dish Loader
========================

Verifying host: 123e4567-e89b-12d3-a456-426614174000
✅ Host found: user@example.com (User Name)

Loading dish data...
  📄 notes_from_note.json: 13 dishes
  📄 image_analysis_results.json: 58 dishes

📊 Total dishes to process: 71
   Appetizers: 8
   Mains: 51
   Desserts: 12
   With images: 58

⚠️  This will upload images and insert all dishes into the database.
   Press Ctrl+C to cancel, or press Enter to continue...

🔄 Processing dishes...

[1/71] Processing: 碗托
   📸 Processing image for "碗托"...
   ✅ Image uploaded successfully
   ✅ Inserted successfully (main)

[2/71] Processing: 白萝卜猪肉馅饺子
   📸 Processing image for "白萝卜猪肉馅饺子"...
   ✅ Image uploaded successfully
   ✅ Inserted successfully (main)

...

📊 Final Summary:
   ✅ Success: 71
   ❌ Failed: 0
   📝 Total: 71
   📸 Images uploaded: 58

✨ Done!
```

#### Notes

- **Image Handling**:
  - Both remote URLs and local file paths are automatically uploaded
  - Remote images are downloaded first, then uploaded to Supabase Storage
  - Local images are read from disk and uploaded
  - All images are stored in the `dish-images` bucket under `{host_id}/{sanitized_name}_{timestamp}.{ext}`
  - Supported formats: JPG, JPEG, PNG, GIF, WEBP

- **Error Handling**:
  - If an image fails to upload, the dish is still inserted without an image
  - Individual failures don't stop the entire process
  - Detailed error messages are shown for each failure

- **Performance**:
  - Dishes are processed sequentially to manage image uploads properly
  - Expect ~1-2 seconds per dish with images, faster for dishes without images

- **Database**:
  - The script uses the service role key to bypass RLS policies
  - Duplicate dish names will create separate entries (no uniqueness constraint)

## Future Scripts

Other utility scripts can be added here for:
- Bulk image upload
- Data migration
- Database cleanup
- Export/backup operations
