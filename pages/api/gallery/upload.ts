import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import path from 'path';
import fs from 'fs';
import { verifyJwt } from '../../../app/lib/jwt';
import prisma from '../../../app/lib/db';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check for token in both cookies and Authorization header
    const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    const payload = await verifyJwt(token);
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }

    const userId = payload.userId as string;

    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: ({ mimetype }) => {
        return mimetype?.startsWith('image/') || mimetype?.startsWith('video/') || false;
      },
    });

    // Using the correct type definition for formidable's parse result
    const [fields, filesObj] = await new Promise<[formidable.Fields<string>, formidable.Files<string>]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // Extract file using the correct formidable typing
    const fileField = filesObj.file;
    if (!fileField) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Handle both single file and array cases
    const file = Array.isArray(fileField) ? fileField[0] : fileField;

    console.log("FIELDS ARE:", fields);
    console.log("FILE IS: ", file);
    
    // Safely extract field values
    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description || '';
    const mediaType = Array.isArray(fields.mediaType) ? fields.mediaType[0] : fields.mediaType;

    if (!title || !mediaType) {
      return res.status(400).json({ message: 'Invalid title or media type' });
    }

    // Create gallery item in database
    const galleryItem = await prisma.galleryItem.create({
      data: {
        userId,
        title,
        description: description || '',
        fileUrl: `/uploads/${path.basename(file.filepath)}`,
        mediaType: mediaType as 'IMAGE' | 'VIDEO',
      },
    });

    res.status(200).json({ success: true, item: galleryItem });
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}