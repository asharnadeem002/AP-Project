import { NextApiRequest, NextApiResponse } from 'next';
import { verifyJwt } from '@/app/lib/jwt';
import prisma from '@/app/lib/db';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const payload = await verifyJwt(token);
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    // Get the gallery item
    const galleryItem = await prisma.galleryItem.findUnique({
      where: { id },
    });

    if (!galleryItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if the user owns this item
    if (galleryItem.userId !== payload.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Delete the file from the filesystem
    const filePath = path.join(process.cwd(), 'public', galleryItem.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete the item from the database
    await prisma.galleryItem.delete({
      where: { id },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 