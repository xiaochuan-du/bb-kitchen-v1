import os
import glob
from PIL import Image

# Configuration
# Assumes script is run from the project root, or adjusts paths relative to this script
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MPO_DIR = os.path.join(BASE_DIR, "data", "raw", "mpo_images")
OUTPUT_DIR = os.path.join(BASE_DIR, "data", "raw", "images")

def convert_mpo_to_png():
    if not os.path.exists(MPO_DIR):
        print(f"Directory not found: {MPO_DIR}")
        return

    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Find images in MPO directory
    # We look for common extensions that MPO files might be hiding under, plus .mpo
    extensions = ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.mpo']
    image_paths = []
    for ext in extensions:
        image_paths.extend(glob.glob(os.path.join(MPO_DIR, ext)))
        image_paths.extend(glob.glob(os.path.join(MPO_DIR, ext.upper())))

    print(f"Found {len(image_paths)} images in {MPO_DIR}...")

    converted_count = 0
    for img_path in image_paths:
        try:
            filename = os.path.basename(img_path)
            name_without_ext = os.path.splitext(filename)[0]
            output_filename = f"{name_without_ext}.png"
            output_path = os.path.join(OUTPUT_DIR, output_filename)

            print(f"Converting {filename} to {output_filename}...")
            
            with Image.open(img_path) as img:
                # MPO files are multi-frame. We take the first frame (default behavior).
                # Convert to RGB to ensure compatibility and save as PNG
                img.convert("RGB").save(output_path, "PNG")
            
            converted_count += 1

        except Exception as e:
            print(f"Failed to convert {img_path}: {e}")

    print(f"Conversion complete. Converted {converted_count} images.")

if __name__ == "__main__":
    convert_mpo_to_png()