// Vercel serverless function for generating product information
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { title, scientificName, mixComponents, productType, apiKey } = req.body;

        if (!title || !apiKey) {
            return res.status(400).json({ error: 'Title and API key are required' });
        }

        if (productType === 'single' && !scientificName) {
            return res.status(400).json({ error: 'Scientific name is required for single species' });
        }

        if (productType === 'mix' && (!mixComponents || mixComponents.length === 0)) {
            return res.status(400).json({ error: 'Mix components are required for seed mixes' });
        }

        // Import OpenAI (note: you'll need to install this in your deployment)
        const { OpenAI } = await import('openai');
        const client = new OpenAI({ apiKey });

        const prompt = createPrompt(title, scientificName, mixComponents, productType);

        const response = await client.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a botanical expert who creates detailed, accurate plant product information. Always respond with valid JSON only."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        const responseText = response.choices[0].message.content.strip();
        
        // Try to parse the JSON response
        let productData;
        try {
            productData = JSON.parse(responseText);
        } catch (parseError) {
            // Try to extract JSON from response if direct parsing fails
            const jsonMatch = responseText.match(/\{.*\}/s);
            if (jsonMatch) {
                productData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Could not parse JSON from OpenAI response');
            }
        }

        return res.status(200).json({ success: true, data: productData });

    } catch (error) {
        console.error('Error generating product:', error);
        return res.status(500).json({ 
            error: 'Failed to generate product information', 
            details: error.message 
        });
    }
}

function createPrompt(title, scientificName, mixComponents, productType) {
    if (productType === 'mix' && mixComponents) {
        const componentsText = mixComponents.map(comp => `- ${comp}`).join('\n');
        
        return `You are a botanical expert creating detailed product information for native plant seed mixes. 
Generate comprehensive information for this seed mix:

Title: ${title}
Mix Components: 
${componentsText}

IMPORTANT: This is a SEED MIX containing multiple plant species. You need to:
1. Research the scientific names for each component plant
2. Create mix percentages that total 100%
3. Base all growing information on the combined characteristics of ALL components
4. Highlight the benefits of having multiple species together

Please provide a complete JSON object with the following fields:

Required fields:
- "Title": "${title}"
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

Return ONLY the JSON object, no additional text. Ensure all information accounts for the diversity of species in the mix.`;
    } else {
        return `You are a botanical expert creating detailed product information for native plant seeds. 
Generate comprehensive information for this plant:

Title: ${title}
Scientific Name: ${scientificName}

Please provide a complete JSON object with the following fields. Base your information on real botanical knowledge about this plant species:

Required fields:
- "Title": "${title}"
- "SKU": Generate appropriate SKU
- "Scientific Name / mix %": "${scientificName}"
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

Return ONLY the JSON object, no additional text. Ensure all information is botanically accurate and follows the format of existing products.`;
    }
}
