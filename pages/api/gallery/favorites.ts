import { NextApiRequest, NextApiResponse } from 'next';
import { verifyJwt } from '@/app/lib/jwt';
import prisma from '@/app/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
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
        where: {
          userId: payload.userId as string,
          isFavorite: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip,
      }),
      prisma.galleryItem.count({
        where: {
          userId: payload.userId as string,
          isFavorite: true,
        },
      }),
    ]);

    return res.status(200).json({
      items,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    console.error('Favorites API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 