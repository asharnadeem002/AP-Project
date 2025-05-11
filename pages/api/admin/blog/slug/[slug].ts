import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../app/lib/db';
import { verifyJwt } from '../../../../../app/lib/jwt';
import { JWTPayload } from 'jose';

interface CustomJWTPayload extends JWTPayload {
  userId: string;
  role: "USER" | "ADMIN";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify admin authentication
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = await verifyJwt(token);
  if (!payload || (payload as CustomJWTPayload).role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { slug } = req.query;

  if (req.method === 'GET') {
    try {
      const post = await prisma.blogPost.findUnique({
        where: { slug: String(slug) },
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.status(200).json(post);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      res.status(500).json({ error: 'Failed to fetch blog post' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 