// api/add.js
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { file, phone } = req.body;

    // Validate file parameter
    if (!file) {
      return res.status(400).json({ 
        success: false, 
        message: 'File parameter is required' 
      });
    }

    // Validate phone number
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    const trimmedPhone = phone.trim();

    if (trimmedPhone.length !== 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number must be 10 digits' 
      });
    }

    if (!/^\d+$/.test(trimmedPhone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number must contain only digits' 
      });
    }

    // Get existing phones (or empty array if file doesn't exist)
    let phones = await kv.get(file) || [];

    // Check for duplicates
    if (phones.includes(trimmedPhone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number already exists' 
      });
    }

    // Add new phone
    phones.push(trimmedPhone);

    // Save back to KV (creates file if doesn't exist)
    await kv.set(file, phones);

    console.log(`Phone added to ${file}: ${trimmedPhone}, Total: ${phones.length}`);

    return res.status(200).json({ 
      success: true, 
      message: 'Phone number added successfully',
      total: phones.length
    });

  } catch (error) {
    console.error('Error in add.js:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
