import os
import shutil
from PIL import Image
from pathlib import Path

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_DIR = os.path.join(BASE_DIR, "data", "raw", "images")
OUTPUT_DIR = os.path.join(BASE_DIR, "data", "raw", "small_images")
MAX_FILE_SIZE = 1 * 1024 * 1024  # 1MB in bytes

def get_file_size(filepath):
    """Get file size in bytes."""
    return os.path.getsize(filepath)

def compress_image(input_path, output_path, max_size_bytes):
    """
    Compress an image to be under max_size_bytes.
    If image is already smaller, copy it as-is.
    """
    input_size = get_file_size(input_path)

    # If file is already under the limit, just copy it
    if input_size < max_size_bytes:
        shutil.copy2(input_path, output_path)
        print(f"✓ Copied {os.path.basename(input_path)} ({input_size / 1024:.1f}KB) - already under 1MB")
        return True

    try:
        # Open image
        img = Image.open(input_path)

        # Convert RGBA to RGB if necessary (for JPEG)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background

        # Determine output format
        output_ext = os.path.splitext(output_path)[1].lower()
        if output_ext == '.png':
            format_type = 'PNG'
        else:
            format_type = 'JPEG'

        # Try progressively reducing quality
        quality = 95
        while quality > 10:
            img.save(output_path, format=format_type, quality=quality, optimize=True)
            output_size = get_file_size(output_path)

            if output_size < max_size_bytes:
                print(f"✓ Compressed {os.path.basename(input_path)} "
                      f"({input_size / (1024*1024):.2f}MB → {output_size / 1024:.1f}KB) "
                      f"at quality {quality}")
                return True

            quality -= 5

        # If still too large, try resizing
        print(f"⚠ Quality reduction insufficient for {os.path.basename(input_path)}, trying resize...")
        scale_factor = 0.9
        original_size = img.size

        while scale_factor > 0.3:
            new_size = (int(original_size[0] * scale_factor), int(original_size[1] * scale_factor))
            resized_img = img.resize(new_size, Image.Resampling.LANCZOS)
            resized_img.save(output_path, format=format_type, quality=85, optimize=True)
            output_size = get_file_size(output_path)

            if output_size < max_size_bytes:
                print(f"✓ Compressed {os.path.basename(input_path)} "
                      f"({input_size / (1024*1024):.2f}MB → {output_size / 1024:.1f}KB) "
                      f"by resizing to {new_size[0]}x{new_size[1]}")
                return True

            scale_factor -= 0.1

        print(f"✗ Failed to compress {os.path.basename(input_path)} below 1MB")
        return False

    except Exception as e:
        print(f"✗ Error processing {os.path.basename(input_path)}: {e}")
        return False

def compress_all_images():
    """Process all images in the input directory."""
    # Create output directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Find all image files
    extensions = ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']
    image_paths = []

    for ext in extensions:
        image_paths.extend(Path(INPUT_DIR).glob(ext))

    if not image_paths:
        print(f"No images found in {INPUT_DIR}")
        return

    print(f"Found {len(image_paths)} images in {INPUT_DIR}")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Target size: < {MAX_FILE_SIZE / (1024*1024):.1f}MB\n")

    success_count = 0
    fail_count = 0

    for img_path in sorted(image_paths):
        output_path = os.path.join(OUTPUT_DIR, img_path.name)

        if compress_image(str(img_path), output_path, MAX_FILE_SIZE):
            success_count += 1
        else:
            fail_count += 1

    print(f"\n{'='*60}")
    print(f"Processing complete!")
    print(f"✓ Successful: {success_count}")
    print(f"✗ Failed: {fail_count}")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"{'='*60}")

if __name__ == "__main__":
    compress_all_images()
