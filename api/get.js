// api/get.js
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { file } = req.query;

    // Validate file parameter
    if (!file) {
      return res.status(400).json({ 
        success: false, 
        message: 'File parameter is required' 
      });
    }

    // Get phones from KV (returns null if doesn't exist)
    const phones = await kv.get(file) || [];

    console.log(`GET request for file: ${file}, Total phones: ${phones.length}`);

    return res.status(200).json({
      phones: phones
    });

  } catch (error) {
    console.error('Error in get.js:', error);
    return res.status(500).json({
      phones: []
    });
  }
}
