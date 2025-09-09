const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// API Routes

// List documents
app.get('/api/list-documents', (req, res) => {
    try {
        const documentsDir = path.join(__dirname, 'Product_Documents');
        
        if (!fs.existsSync(documentsDir)) {
            return res.json([]);
        }

        const files = fs.readdirSync(documentsDir)
            .filter(file => file.endsWith('.docx') && !file.startsWith('.'))
            .map(file => {
                const filePath = path.join(documentsDir, file);
                const stats = fs.statSync(filePath);
                
                return {
                    name: file.replace('.docx', '').replace(/_/g, ' '),
                    filename: file,
                    size: stats.size,
                    modified: stats.mtime.toISOString()
                };
            })
            .sort((a, b) => new Date(b.modified) - new Date(a.modified));

        res.json(files);
    } catch (error) {
        console.error('Error listing documents:', error);
        res.status(500).json({ error: 'Failed to list documents' });
    }
});

// Download document
app.get('/api/download-document', (req, res) => {
    try {
        const { file } = req.query;
        
        if (!file) {
            return res.status(400).json({ error: 'File parameter is required' });
        }

        // Validate filename to prevent directory traversal
        const filename = path.basename(file);
        if (filename !== file || !filename.endsWith('.docx')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        const filePath = path.join(__dirname, 'Product_Documents', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ error: 'Failed to download document' });
    }
});

// Regenerate document
app.post('/api/regenerate-document', (req, res) => {
    try {
        const { filename } = req.body;
        
        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
        }

        // Validate filename
        const cleanFilename = path.basename(filename);
        if (cleanFilename !== filename || !cleanFilename.endsWith('.docx')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        // Extract product name from filename
        const productName = cleanFilename.replace('.docx', '').replace(/_/g, ' ');
        
        // Run the Python document generator for this specific product
        const pythonProcess = spawn('python3', ['generate_product_docs.py', '--product', productName], {
            cwd: __dirname
        });

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                res.json({ 
                    success: true,
                    message: `Document "${productName}" regenerated successfully`,
                    filename: cleanFilename
                });
            } else {
                console.error('Python script error:', errorOutput);
                res.status(500).json({ 
                    error: 'Failed to regenerate document',
                    details: errorOutput
                });
            }
        });

        pythonProcess.on('error', (error) => {
            console.error('Failed to start Python process:', error);
            res.status(500).json({ 
                error: 'Failed to start document generation process',
                details: error.message
            });
        });

    } catch (error) {
        console.error('Error regenerating document:', error);
        res.status(500).json({ error: 'Failed to regenerate document' });
    }
});

// Generate product with automatic injection and document generation
app.post('/api/generate-product', async (req, res) => {
    try {
        const { title, scientificName, mixComponents, productType, apiKey } = req.body;

        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required' });
        }

        // Import OpenAI here to avoid issues if not installed
        const { OpenAI } = require('openai');
        
        const openai = new OpenAI({
            apiKey: apiKey
        });

        // Use existing product as exact template for format consistency
        const templateExample = {
            "Title": "Central Valley Pollinator Mix (Xerces Society)",
            "SKU": "WB-XCVP-0.5-LB",
            "Scientific Name / mix %": "Yarrow 08%; Elegant clarkia 10%; California poppy 11%; Gumplant 10%; Common sunflower 03%; Baby blue eyes 09%; California phacelia 10%; Tansy phacelia 11%; Alkali sacaton 06%; Purple needlegrass 06%; Vinegarweed 16%",
            "What is the? ( SEO Description 100-200 words) ": "The Central Valley Pollinator Mix is a curated blend of native California wildflowers and grasses designed to create a haven for pollinators. Developed with Xerces Society guidance for California's Central Valley, the mix features a diverse array of blooms that provide nectar and pollen across the seasons. Colorful annuals like California Poppy, Baby Blue Eyes, and Phacelia complement hardy perennials and bunchgrasses such as Yarrow and Purple Needlegrass. Selected to thrive in the Valley's climate, the mix is drought-tolerant once established and supports native bees, honeybees, butterflies, and other beneficial insects. Deep-rooted grasses contribute to soil health and erosion control—ideal for farms, large gardens, or habitat restoration.",
            "Sun Requirements (Full Sun, Full Sun to Partial Shade, Shade)": "Full Sun",
            "Soil Preference": "Adaptable—loam to clay with good drainage",
            "Soil pH": "Approx. 6.0–8.0 (slightly acidic to moderately alkaline)",
            "Days to Maturity": "Varies by species (annuals 60–90 days; perennials bloom year 2)",
            "Height when mature": "Varies: most 1–3 ft; tallest ~5–6 ft",
            "Seeding rate": "~8–10 lbs per acre (~0.2 lb per 1,000 sq ft)",
            "Planting Depth": "Shallow: most seeds ~1/8 inch; tiny seeds surface-sown",
            "Why chose this product Title 1": "Pollinator Paradise",
            "Why chose this product 1": "Continuous nectar/pollen supply supports bees, butterflies, and more.",
            "Why chose this product Title 2": "Native Diversity",
            "Why chose this product 2": "Balanced mix of native annuals, perennials, and grasses for resilience.",
            "Why chose this product Title 3": "Year-Round Bloom",
            "Why chose this product 3": "Successional blooms keep color and pollinator activity for months.",
            "Why chose this product Title 4": "Easy & Effective",
            "Why chose this product 4": "Field-tested guidance; simple site prep and sowing; self-sustaining with reseed.",
            "Why chose this product Title 5": "Environmental Benefits",
            "Why chose this product 5": "Deep roots improve soil, retain moisture, and prevent erosion.",
            "Sun/Shade": "Full Sun",
            "Height when Mature": "1–3 ft typical; up to ~5–6 ft for tallest species",
            "Seeding Rate": "~8–10 lbs/acre",
            "Uses": "Pollinator habitat (farms/orchards), wildflower meadows, restoration areas",
            "Color": "Mix of golds, oranges, blues, purples, and whites",
            "Water": "Low to Moderate—rely on winter rains; minimal extra water after establishment",
            "Native/Introduced": "Native California wildflower and grass species",
            "Life Form": "Mix of annual/perennial forbs and perennial bunchgrasses",
            "Main category": "Wildflower Seed"
        };

        let prompt;
        if (productType === 'mix' && mixComponents) {
            const componentsText = mixComponents.map(comp => `- ${comp}`).join('\n');
            
            prompt = `You are a botanical expert. Create product information for this seed mix:

Title: ${title}
Mix Components: 
${componentsText}

IMPORTANT: Follow this EXACT JSON format. Copy the structure exactly, only change the values:

${JSON.stringify(templateExample, null, 2)}

For seed mixes:
- "Scientific Name / mix %": List each component with percentage (must total 100%)
- Generate appropriate SKU following pattern: "W-[INITIALS]-0.25-LB"
- Base all information on the combined characteristics of ALL components

Return ONLY the JSON object with no additional text or markdown formatting.`;
        } else {
            prompt = `You are a botanical expert. Create product information for this plant:

Title: ${title}
Scientific Name: ${scientificName}

IMPORTANT: Follow this EXACT JSON format. Copy the structure exactly, only change the values:

${JSON.stringify(templateExample, null, 2)}

For single species:
- "Scientific Name / mix %": Use the provided scientific name
- Generate appropriate SKU following pattern: "W-[INITIALS]-0.25-LB"
- Base all information on this specific plant species

Return ONLY the JSON object with no additional text or markdown formatting.`;
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 3000,
            temperature: 0.3
        });

        const content = response.choices[0].message.content;
        
        // Try to parse JSON from the response
        let productData;
        try {
            // Extract JSON from the response if it's wrapped in markdown
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/) || [null, content];
            productData = JSON.parse(jsonMatch[1] || content);
        } catch (parseError) {
            console.error('Failed to parse OpenAI response as JSON:', parseError);
            return res.status(500).json({ error: 'Failed to parse AI response' });
        }

        // Inject into products_data.json
        try {
            const productsPath = path.join(__dirname, 'products_data.json');
            let existingProducts = [];
            
            if (fs.existsSync(productsPath)) {
                const fileContent = fs.readFileSync(productsPath, 'utf8');
                existingProducts = JSON.parse(fileContent);
            }
            
            // Add new product
            existingProducts.push(productData);
            
            // Write back to file
            fs.writeFileSync(productsPath, JSON.stringify(existingProducts, null, 4));
            
        } catch (injectionError) {
            console.error('Failed to inject product into database:', injectionError);
            return res.status(500).json({ error: 'Failed to save product to database' });
        }

        // Generate Word document
        const pythonProcess = spawn('python3', ['generate_product_docs.py', '--product', title], {
            cwd: __dirname
        });

        let documentGenerated = false;
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('Document regenerated') || output.includes('Saved:')) {
                documentGenerated = true;
            }
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code === 0 && documentGenerated) {
                console.log(`Document generated for: ${title}`);
            } else {
                console.error('Document generation failed:', errorOutput);
            }
        });

        res.json({
            success: true,
            data: productData,
            message: 'Product generated, saved to database, and document creation initiated'
        });

    } catch (error) {
        console.error('Error generating product:', error);
        res.status(500).json({ 
            error: 'Failed to generate product information',
            details: error.message 
        });
    }
});

// Delete document and product from database
app.delete('/api/delete-document', (req, res) => {
    try {
        const { filename } = req.body;
        
        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
        }

        // Validate filename to prevent directory traversal
        const cleanFilename = path.basename(filename);
        if (cleanFilename !== filename || !cleanFilename.endsWith('.docx')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        // Extract product title from filename for JSON deletion
        const productTitle = cleanFilename.replace('.docx', '').replace(/_/g, ' ');
        
        // Delete the Word document file
        const filePath = path.join(__dirname, 'Product_Documents', cleanFilename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Remove from products_data.json
        try {
            const productsPath = path.join(__dirname, 'products_data.json');
            if (fs.existsSync(productsPath)) {
                const fileContent = fs.readFileSync(productsPath, 'utf8');
                let products = JSON.parse(fileContent);
                
                // Filter out the product with matching title
                const originalLength = products.length;
                products = products.filter(product => 
                    product.Title && product.Title.toLowerCase() !== productTitle.toLowerCase()
                );
                
                // Write back to file
                fs.writeFileSync(productsPath, JSON.stringify(products, null, 4));
                
                const removedFromJson = products.length < originalLength;
                
                res.json({ 
                    success: true,
                    message: `Document deleted successfully${removedFromJson ? ' and removed from database' : ''}`,
                    filename: cleanFilename,
                    removedFromDatabase: removedFromJson
                });
            } else {
                res.json({ 
                    success: true,
                    message: 'Document deleted successfully',
                    filename: cleanFilename,
                    removedFromDatabase: false
                });
            }
        } catch (jsonError) {
            console.error('Error updating JSON database:', jsonError);
            res.json({ 
                success: true,
                message: 'Document deleted successfully, but failed to update database',
                filename: cleanFilename,
                removedFromDatabase: false
            });
        }

    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

// Generate all documents
app.post('/api/generate-all-documents', (req, res) => {
    try {
        // Run the Python document generator for all products
        const pythonProcess = spawn('python3', ['generate_product_docs.py'], {
            cwd: __dirname
        });

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                res.json({ 
                    success: true,
                    message: 'All documents generated successfully',
                    output: output
                });
            } else {
                console.error('Document generation failed:', errorOutput);
                res.status(500).json({ 
                    error: 'Failed to generate documents',
                    details: errorOutput
                });
            }
        });

        pythonProcess.on('error', (error) => {
            console.error('Failed to start Python process:', error);
            res.status(500).json({ 
                error: 'Failed to start document generation process',
                details: error.message
            });
        });

    } catch (error) {
        console.error('Error generating all documents:', error);
        res.status(500).json({ error: 'Failed to generate documents' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌱 Product Information Generator running on http://localhost:${PORT}`);
    console.log(`📄 Documents API available at http://localhost:${PORT}/api/list-documents`);
    console.log(`🤖 Auto-generation: JSON injection + Word docs enabled`);
});
