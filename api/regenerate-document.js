const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
    // Set CORS headers
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
        const { filename } = req.body;
        
        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
        }

        // Validate filename to prevent directory traversal
        const cleanFilename = path.basename(filename);
        if (cleanFilename !== filename || !cleanFilename.endsWith('.docx')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        // In a serverless environment, document regeneration would need to:
        // 1. Trigger a separate process/function to run the Python document generator
        // 2. Or integrate the document generation logic into Node.js
        // For now, we'll return a success response indicating the request was received
        
        return res.status(200).json({ 
            success: true,
            message: 'Document regeneration request received',
            filename: cleanFilename,
            note: 'In a production environment, this would trigger the Python document generator script'
        });

    } catch (error) {
        console.error('Error regenerating document:', error);
        res.status(500).json({ error: 'Failed to regenerate document' });
    }
}
