import os
import glob
import shutil
from PIL import Image

# Configuration
# Assumes script is run from the project root, or adjusts paths relative to this script
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_DIR = os.path.join(BASE_DIR, "data", "raw", "images")
FILTERED_DIR = os.path.join(BASE_DIR, "data", "raw", "mpo_images")

def filter_mpo_images():
    # Ensure the filtered directory exists
    os.makedirs(FILTERED_DIR, exist_ok=True)

    # Find images (jpg, png, webp, etc.)
    # MPO files often have .jpg extensions
    extensions = ['*.jpg', '*.jpeg', '*.png', '*.webp']
    image_paths = []
    for ext in extensions:
        image_paths.extend(glob.glob(os.path.join(IMAGE_DIR, ext)))
        image_paths.extend(glob.glob(os.path.join(IMAGE_DIR, ext.upper())))

    print(f"Scanning {len(image_paths)} images in {IMAGE_DIR}...")
    
    moved_count = 0
    for img_path in image_paths:
        try:
            # Open image to check format
            # We use a context manager to ensure the file is closed before moving
            with Image.open(img_path) as img:
                img_format = img.format

            # Check if it is MPO (MIME type image/mpo)
            if img_format == 'MPO':
                filename = os.path.basename(img_path)
                dest_path = os.path.join(FILTERED_DIR, filename)
                
                print(f"Found MPO image: {filename}. Moving to {FILTERED_DIR}...")
                shutil.move(img_path, dest_path)
                moved_count += 1
                
        except Exception as e:
            print(f"Failed to check {img_path}: {e}")

    print(f"Filtering complete. Moved {moved_count} MPO images.")

if __name__ == "__main__":
    filter_mpo_images()