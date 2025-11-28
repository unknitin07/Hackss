// api/admin/bulk-add.js
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
    const { file, phones } = req.body;

    // Validate file parameter
    if (!file) {
      return res.status(400).json({ 
        success: false, 
        message: 'File parameter is required' 
      });
    }

    // Validate phones array
    if (!phones || !Array.isArray(phones)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phones must be an array' 
      });
    }

    if (phones.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phones array cannot be empty' 
      });
    }

    // Validate each phone number
    const invalidPhones = [];
    const validPhones = [];

    for (let phone of phones) {
      const trimmedPhone = String(phone).trim();
      
      if (trimmedPhone.length !== 10 || !/^\d+$/.test(trimmedPhone)) {
        invalidPhones.push(phone);
      } else {
        validPhones.push(trimmedPhone);
      }
    }

    if (invalidPhones.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Some phone numbers are invalid',
        invalid: invalidPhones
      });
    }

    // Get existing phones (or empty array if file doesn't exist)
    let existingPhones = await kv.get(file) || [];

    // Track duplicates and new phones
    const duplicates = [];
    const newPhones = [];

    for (let phone of validPhones) {
      if (existingPhones.includes(phone)) {
        duplicates.push(phone);
      } else {
        newPhones.push(phone);
        existingPhones.push(phone);
      }
    }

    // Save updated list to KV
    await kv.set(file, existingPhones);

    console.log(`Bulk add to ${file}: ${newPhones.length} new, ${duplicates.length} duplicates`);

    return res.status(200).json({ 
      success: true, 
      message: 'Bulk add completed',
      added: newPhones.length,
      duplicates: duplicates.length,
      total: existingPhones.length,
      duplicatePhones: duplicates
    });

  } catch (error) {
    console.error('Error in bulk-add.js:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
