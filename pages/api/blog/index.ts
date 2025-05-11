import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../app/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const posts = await prisma.BlogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      select: {
        slug: true,
        title: true,
        description: true,
        createdAt: true,
        author: {
          select: {
            username: true,
          },
        },
      },
    });

    return res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
} 