// File: api/upload.js

import { IncomingForm } from "formidable";
import cloudinary from "cloudinary";

// Vercel config: allow big file uploads
export const config = {
  api: { bodyParser: false },
};

// Cloudinary config (env variables should be set in Vercel!)
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default function handler(req, res) {
  // CORS support for all origins
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    res.status(405).json({ error: "Only POST allowed" });
    return;
  }

  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: "Form parse error", debug: err });
      return;
    }

    const file = files.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded. Field name should be 'file'." });
      return;
    }

    try {
      // Upload to Cloudinary from file path
      const uploadResult = await cloudinary.v2.uploader.upload(
        file.filepath || file.path,
        {
          folder: "user_uploads",
          resource_type: "auto",
        }
      );
      res.status(200).json({
        message: "File uploaded!",
        url: uploadResult.secure_url,
        cloudinaryId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        mimetype: uploadResult.format,
      });
    } catch (e) {
      // Most important: return actual error info to frontend!
      res.status(500).json({
        error: "Cloudinary upload failed",
        details: e.message,
        cloudinaryError: e, // pure error object for debug
      });
    }
  });
  }
        
