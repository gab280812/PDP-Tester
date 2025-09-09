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

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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

        // In a serverless environment, we can't directly serve files from the file system
        // This would need to be adapted to serve from cloud storage (S3, etc.)
        // For now, we'll return an error with instructions
        
        return res.status(501).json({ 
            error: 'Document download not implemented in serverless environment',
            message: 'To enable document downloads, files need to be stored in cloud storage (S3, etc.) and served from there.',
            filename: filename
        });

    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ error: 'Failed to download document' });
    }
}
