import os
import glob
import json
import google.generativeai as genai
from PIL import Image
import concurrent.futures

# Configuration
# Assumes script is run from the project root, or adjusts paths relative to this script
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_DIR = os.path.join(BASE_DIR, "data", "raw", "images")
OUTPUT_DIR = os.path.join(BASE_DIR, "data", "processed")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "image_analysis_results.json")
MAX_WORKERS = 16

def analyze_single_image(img_path, model):
    relative_path = os.path.relpath(img_path, BASE_DIR)
    print(f"Analyzing {relative_path}...")
    
    try:
        image = Image.open(img_path)
        
        prompt = """
            Analyze this image of a food dish.
            1. Identify the name of the dish.
            2. Infer the ingredients.
            3. Infer the cooking process (step-by-step instructions) based on the visual appearance and general culinary knowledge.
            4. Infer the category (choose from: Appetizer, Main Course, Dessert).
            5. Infer tags (e.g., #xmax, #春节, #西北风格).
            
            All field values should be written in Chinese (tags can be written in English).

            Return the result as a valid JSON object with the following keys:
            - "name": string
            - "ingredients": list of strings
            - "process": list of strings
            - "category": string
            - "tags": list of strings
            """
        
        response = model.generate_content(
            [prompt, image],
            generation_config={"response_mime_type": "application/json"}
        )
        
        # Parse response
        data = json.loads(response.text)
        
        # Add the relative path to the result
        data["image"] = relative_path
        
        return data
    except Exception as e:
        print(f"Failed to process {relative_path}: {e}")
        return None

def analyze_images():
    # Check for API Key
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY environment variable is not set.")
        return

    genai.configure(api_key=api_key)
    
    # Initialize Gemini Flash model
    model = genai.GenerativeModel('gemini-3-flash-preview')

    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    results = []
    
    # Find images (jpg, png, webp, etc.)
    extensions = ['*.jpg', '*.jpeg', '*.png', '*.webp']
    image_paths = []
    for ext in extensions:
        # glob.glob is case-sensitive on Linux, so we might want to check upper case too if needed
        image_paths.extend(glob.glob(os.path.join(IMAGE_DIR, ext)))
        image_paths.extend(glob.glob(os.path.join(IMAGE_DIR, ext.upper())))

    print(f"Found {len(image_paths)} images in {IMAGE_DIR}")

    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(analyze_single_image, path, model) for path in image_paths]
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                results.append(result)

    # Save aggregated results
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"Analysis complete. Results saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    analyze_images()
