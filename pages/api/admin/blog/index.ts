import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../app/lib/db";
import { verifyJwt } from "../../../../app/lib/jwt";
import { JWTPayload } from "jose";

interface CustomJWTPayload extends JWTPayload {
  userId: string;
  role: "USER" | "ADMIN";
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }

  try {
    const payload = await verifyJwt(token);
    if (!payload || (payload as CustomJWTPayload).role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Forbidden - Admin access required" });
    }

    const userId = (payload as CustomJWTPayload).userId;

    if (req.method === "GET") {
      const posts = await prisma.blogPost.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });
      return res.status(200).json(posts);
    }

    if (req.method === "POST") {
      const { title, description, content, slug, published } = req.body;

      if (!title || !description || !content || !slug) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const existingPost = await prisma.blogPost.findUnique({
        where: { slug },
      });

      if (existingPost) {
        return res.status(400).json({ error: "Slug already exists" });
      }

      const post = await prisma.blogPost.create({
        data: {
          title,
          description,
          content,
          slug,
          published: published || false,
          authorId: userId,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      return res.status(201).json(post);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error("Blog API Route Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export default handler;
