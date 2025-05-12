import { NextApiRequest, NextApiResponse } from 'next';
import { verifyJwt } from '../../../../app/lib/jwt';
import prisma from '../../../../app/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies.authToken;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const payload = await verifyJwt(token);
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      prisma.galleryItem.findMany({
        where: { userId: payload.userId as string },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.galleryItem.count({
        where: { userId: payload.userId as string },
      }),
    ]);

    return res.status(200).json({
      success: true,
      items,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    console.error('Gallery fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 