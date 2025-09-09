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
        // In a serverless environment, we need to handle the documents directory differently
        // For now, we'll return a mock list based on the known documents
        // In a real deployment, you'd need to store document metadata in a database
        // or use a cloud storage service
        
        const mockDocuments = [
            {
                name: "Arroyo Lupine",
                filename: "Arroyo_Lupine.docx",
                size: 37991,
                modified: "2024-01-15T10:30:00Z"
            },
            {
                name: "Blue-eyed Grass",
                filename: "Blue_eyed_Grass.docx",
                size: 37981,
                modified: "2024-01-15T10:32:00Z"
            },
            {
                name: "Brittlebush",
                filename: "Brittlebush.docx",
                size: 38016,
                modified: "2024-01-15T10:34:00Z"
            },
            {
                name: "Bush Monkeyflower",
                filename: "Bush_Monkeyflower.docx",
                size: 38028,
                modified: "2024-01-15T10:36:00Z"
            },
            {
                name: "California Brittlebush",
                filename: "California_brittlebush.docx",
                size: 38078,
                modified: "2024-01-15T10:38:00Z"
            },
            {
                name: "Central Valley Pollinator Mix (Xerces Society)",
                filename: "Central_Valley_Pollinator_Mix_Xerces_Society.docx",
                size: 38314,
                modified: "2024-01-15T10:40:00Z"
            },
            {
                name: "Golden Yarrow",
                filename: "Golden_yarrow.docx",
                size: 38045,
                modified: "2024-01-15T10:42:00Z"
            },
            {
                name: "Miniature Lupine",
                filename: "Miniature_Lupine.docx",
                size: 37941,
                modified: "2024-01-15T10:44:00Z"
            },
            {
                name: "Purple Needlegrass",
                filename: "Purple_Needlegrass.docx",
                size: 38079,
                modified: "2024-01-15T10:46:00Z"
            },
            {
                name: "Western Yarrow",
                filename: "Western_yarrow.docx",
                size: 38161,
                modified: "2024-01-15T10:48:00Z"
            },
            {
                name: "White Sage",
                filename: "White_Sage.docx",
                size: 38019,
                modified: "2024-01-15T10:50:00Z"
            },
            {
                name: "Yellow Lupine",
                filename: "Yellow_Lupine.docx",
                size: 38051,
                modified: "2024-01-15T10:52:00Z"
            }
        ];

        res.status(200).json(mockDocuments);

    } catch (error) {
        console.error('Error listing documents:', error);
        res.status(500).json({ error: 'Failed to list documents' });
    }
}
