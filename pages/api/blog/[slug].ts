import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../app/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { slug } = req.query;

  try {
    const post = await prisma.BlogPost.findFirst({
      where: { 
        slug: String(slug),
        published: true
      },
      select: {
        slug: true,
        title: true,
        description: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return res.status(500).json({ error: 'Failed to fetch blog post' });
  }
} 