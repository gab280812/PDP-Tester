#!/usr/bin/env python3
"""
Product Information Requester
Uses OpenAI API to generate complete product information from just title and scientific name.
"""

import json
import os
import re
from openai import OpenAI

def load_existing_products():
    """Load existing products from JSON file"""
    try:
        with open('products_data.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_products(products):
    """Save products to JSON file"""
    with open('products_data.json', 'w') as f:
        json.dump(products, f, indent=4)

def generate_sku(title):
    """Generate a SKU based on the product title"""
    # Extract first letters of each word, limit to 4 characters
    words = re.findall(r'\b\w+', title)
    sku_letters = ''.join([word[0].upper() for word in words[:4]])
    return f"W-{sku_letters}-0.25-LB"

def create_openai_prompt(title, scientific_name_or_mix, is_mix=False, mix_components=None):
    """Create the OpenAI prompt for generating product information"""
    
    if is_mix and mix_components:
        # For mix products, create a detailed prompt about the components
        components_text = "\n".join([f"- {comp}" for comp in mix_components])
        
        prompt = f"""
You are a botanical expert creating detailed product information for native plant seed mixes. 
Generate comprehensive information for this seed mix:

Title: {title}
Mix Components: 
{components_text}

IMPORTANT: This is a SEED MIX containing multiple plant species. You need to:
1. Research the scientific names for each component plant
2. Create mix percentages that total 100%
3. Base all growing information on the combined characteristics of ALL components
4. Highlight the benefits of having multiple species together

Please provide a complete JSON object with the following fields:

Required fields:
- "Title": "{title}"
- "SKU": Generate appropriate SKU for seed mix
- "Scientific Name / mix %": Create a detailed mix breakdown with scientific names and percentages (e.g., "Yarrow 15%; California poppy 20%; Blue-eyed grass 10%; etc.")
- "What is the? ( SEO Description 100-200 words) ": Write a compelling 100-200 word description highlighting the mix's diversity, ecological benefits, and combined characteristics
- "Sun Requirements (Full Sun, Full Sun to Partial Shade, Shade)": Consider requirements of all components
- "Soil Preference": Describe soil preferences that work for all components
- "Soil pH": Specify pH range suitable for the mix
- "Days to Maturity": Bloom timing considering different species
- "Height when mature": Height range covering all components
- "Seeding rate": Recommended seeding rate for the mix
- "Planting Depth": Planting depth instructions for mixed seeds
- "Why chose this product Title 1" through "Why chose this product Title 5": Create 5 compelling benefit titles focusing on mix advantages
- "Why chose this product 1" through "Why chose this product 5": Corresponding benefit descriptions emphasizing diversity and ecological benefits
- "Sun/Shade": Sun/shade requirements for the mix
- "Height when Mature": Mature height range
- "Seeding Rate": Seeding rate for mix
- "Uses": Primary uses emphasizing mix benefits
- "Color": Describe the variety of colors from different species
- "Water": Water requirements suitable for all components
- "Native/Introduced": Native range covering all species
- "Life Form": Describe the mix composition (annual/perennial forbs, grasses, etc.)
- "Planting Guide Step 1" through "Planting Guide Step 4": 4-step planting guide for seed mixes
- "FAQ 1" through "FAQ 6": 6 frequently asked questions about seed mixes with answers
- "Main category": "Wildflower Seed"

Return ONLY the JSON object, no additional text. Ensure all information accounts for the diversity of species in the mix.
"""
    else:
        # Single species prompt (existing logic)
        prompt = f"""
You are a botanical expert creating detailed product information for native plant seeds. 
Generate comprehensive information for this plant:

Title: {title}
Scientific Name: {scientific_name_or_mix}

Please provide a complete JSON object with the following fields. Base your information on real botanical knowledge about this plant species:

Required fields:
- "Title": "{title}"
- "SKU": Generate appropriate SKU
- "Scientific Name / mix %": "{scientific_name_or_mix}"
- "What is the? ( SEO Description 100-200 words) ": Write a compelling 100-200 word description highlighting the plant's characteristics, benefits, and uses
- "Sun Requirements (Full Sun, Full Sun to Partial Shade, Shade)": Specify sun requirements
- "Soil Preference": Describe soil preferences
- "Soil pH": Specify pH range
- "Days to Maturity": Time to maturity/bloom
- "Height when mature": Mature height range
- "Seeding rate": Recommended seeding rate
- "Planting Depth": Planting depth instructions
- "Why chose this product Title 1" through "Why chose this product Title 5": Create 5 compelling benefit titles
- "Why chose this product 1" through "Why chose this product 5": Corresponding benefit descriptions
- "Sun/Shade": Sun/shade requirements
- "Height when Mature": Mature height
- "Seeding Rate": Seeding rate
- "Uses": Primary uses
- "Color": Flower/foliage colors
- "Water": Water requirements
- "Native/Introduced": Native range
- "Life Form": Plant life form (annual, perennial, etc.)
- "Planting Guide Step 1" through "Planting Guide Step 4": 4-step planting guide
- "FAQ 1" through "FAQ 6": 6 frequently asked questions with answers
- "Main category": "Wildflower Seed"

Return ONLY the JSON object, no additional text. Ensure all information is botanically accurate and follows the format of existing products.
"""
    
    return prompt

def get_product_info_from_openai(title, scientific_name_or_mix, api_key, is_mix=False, mix_components=None):
    """Get product information from OpenAI API"""
    
    client = OpenAI(api_key=api_key)
    
    prompt = create_openai_prompt(title, scientific_name_or_mix, is_mix, mix_components)
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a botanical expert who creates detailed, accurate plant product information. Always respond with valid JSON only."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        # Extract the JSON from the response
        response_text = response.choices[0].message.content.strip()
        
        # Try to parse as JSON
        try:
            product_data = json.loads(response_text)
            return product_data
        except json.JSONDecodeError:
            # If direct parsing fails, try to extract JSON from the response
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                product_data = json.loads(json_match.group())
                return product_data
            else:
                raise ValueError("Could not extract valid JSON from OpenAI response")
                
    except Exception as e:
        print(f"Error getting information from OpenAI: {e}")
        return None

def add_new_product(title, scientific_name_or_mix, api_key=None, is_mix=False, mix_components=None):
    """Add a new product to the products database"""
    
    # Get API key from environment or parameter
    if not api_key:
        api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        print("Error: OpenAI API key not found. Please set OPENAI_API_KEY environment variable or provide it as parameter.")
        return False
    
    if is_mix:
        print(f"Generating product information for mix: {title}")
        print(f"Mix components: {', '.join(mix_components)}")
    else:
        print(f"Generating product information for: {title} ({scientific_name_or_mix})")
    
    print("Requesting information from OpenAI...")
    
    # Get product information from OpenAI
    product_data = get_product_info_from_openai(title, scientific_name_or_mix, api_key, is_mix, mix_components)
    
    if not product_data:
        print("Failed to generate product information.")
        return False
    
    # Load existing products
    existing_products = load_existing_products()
    
    # Check if product already exists
    for existing in existing_products:
        if existing.get('Title', '').lower() == title.lower():
            print(f"Product '{title}' already exists. Skipping.")
            return False
    
    # Add the new product
    existing_products.append(product_data)
    
    # Save updated products
    save_products(existing_products)
    
    print(f"Successfully added '{title}' to products database!")
    print(f"Total products: {len(existing_products)}")
    
    return True

def main():
    """Main function for interactive product addition"""
    print("=== Product Information Requester ===")
    print("This tool generates complete product information using OpenAI API")
    print("Options:")
    print("1. Single Species: Product Title + Scientific Name")
    print("2. Seed Mix: Product Title + List of Plant Components")
    print()
    
    # Check for API key
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("OpenAI API Key not found in environment variables.")
        api_key = input("Please enter your OpenAI API key: ").strip()
        if not api_key:
            print("API key is required. Exiting.")
            return
    
    while True:
        print("\n" + "="*50)
        title = input("Enter Product Title (or 'quit' to exit): ").strip()
        
        if title.lower() in ['quit', 'exit', 'q']:
            break
            
        if not title:
            print("Please enter a valid product title.")
            continue
        
        # Ask if this is a mix or single species
        product_type = input("Is this a (1) Single Species or (2) Seed Mix? Enter 1 or 2: ").strip()
        
        if product_type == "2":
            # Handle seed mix
            print("\nEnter the plant components for this mix (one per line).")
            print("Press Enter on an empty line when finished:")
            
            mix_components = []
            while True:
                component = input(f"Component {len(mix_components) + 1}: ").strip()
                if not component:
                    break
                mix_components.append(component)
            
            if not mix_components:
                print("No components entered. Skipping this product.")
                continue
            
            print(f"\nTitle: {title}")
            print("Mix Components:")
            for i, comp in enumerate(mix_components, 1):
                print(f"  {i}. {comp}")
            
            confirm = input("Generate product information for this mix? (y/n): ").strip().lower()
            
            if confirm in ['y', 'yes']:
                success = add_new_product(title, None, api_key, is_mix=True, mix_components=mix_components)
                if success:
                    print(f"\n✅ Mix product '{title}' added successfully!")
                    
                    # Ask if user wants to generate Word document
                    generate_doc = input("Generate Word document for this product? (y/n): ").strip().lower()
                    if generate_doc in ['y', 'yes']:
                        try:
                            import subprocess
                            result = subprocess.run(['python3', 'generate_product_docs.py'], 
                                                  capture_output=True, text=True)
                            if result.returncode == 0:
                                print("✅ Word document generated successfully!")
                            else:
                                print(f"Error generating document: {result.stderr}")
                        except Exception as e:
                            print(f"Error running document generator: {e}")
                else:
                    print("❌ Failed to add product.")
            else:
                print("Cancelled.")
                
        elif product_type == "1":
            # Handle single species (existing logic)
            scientific_name = input("Enter Scientific Name: ").strip()
            
            if not scientific_name:
                print("Please enter a valid scientific name.")
                continue
            
            # Confirm before proceeding
            print(f"\nTitle: {title}")
            print(f"Scientific Name: {scientific_name}")
            confirm = input("Generate product information? (y/n): ").strip().lower()
            
            if confirm in ['y', 'yes']:
                success = add_new_product(title, scientific_name, api_key)
                if success:
                    print(f"\n✅ Product '{title}' added successfully!")
                    
                    # Ask if user wants to generate Word document
                    generate_doc = input("Generate Word document for this product? (y/n): ").strip().lower()
                    if generate_doc in ['y', 'yes']:
                        try:
                            import subprocess
                            result = subprocess.run(['python3', 'generate_product_docs.py'], 
                                                  capture_output=True, text=True)
                            if result.returncode == 0:
                                print("✅ Word document generated successfully!")
                            else:
                                print(f"Error generating document: {result.stderr}")
                        except Exception as e:
                            print(f"Error running document generator: {e}")
                else:
                    print("❌ Failed to add product.")
            else:
                print("Cancelled.")
        else:
            print("Please enter 1 or 2.")
    
    print("\nGoodbye!")

if __name__ == "__main__":
    main()
