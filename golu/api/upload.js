import { IncomingForm } from "formidable";
import cloudinary from "cloudinary";

// Allow big uploads:
export const config = {
  api: { bodyParser: false }
};

// Cloudinary config, env vars from Vercel dashboard
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default function handler(req, res) {
  // CORS headers (frontend kisi bhi domain/localhost/file se chalega)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Only POST request allowed (file upload)
  if (req.method !== "POST") {
    res.status(405).json({ error: "Only POST allowed" });
    return;
  }

  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: "Form parse error" });
      return;
    }

    const file = files.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded. Field name should be 'file'." });
      return;
    }

    try {
      // Upload file from temp path to Cloudinary
      const uploadResult = await cloudinary.v2.uploader.upload(file.filepath || file.path, {
        folder: "user_uploads",   // Apni marzi ka folder rakh sakte hain
        resource_type: "auto"     // PNG, JPG, GIF, WebP, sab chalega
      });
      res.status(200).json({
        message: "File uploaded!",
        url: uploadResult.secure_url, // Yeh public image URL hai!
        cloudinaryId: uploadResult.public_id, // Agar aage delete ya manage karna ho
        width: uploadResult.width,
        height: uploadResult.height,
        mimetype: uploadResult.format
      });
    } catch (e) {
      res.status(500).json({ error: "Cloudinary upload failed", details: e.message });
    }
  });
    }
    
