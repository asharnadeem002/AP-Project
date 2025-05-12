import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../app/lib/db";
import { verifyJwt } from "../../../../app/lib/jwt";
import { JWTPayload } from "jose";

interface CustomJWTPayload extends JWTPayload {
  userId: string;
  role: "USER" | "ADMIN";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payload = await verifyJwt(token);
  if (!payload || (payload as CustomJWTPayload).role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { id } = req.query;

  switch (req.method) {
    case "GET":
      try {
        const post = await prisma.blogPost.findUnique({
          where: { id: String(id) },
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
          return res.status(404).json({ error: "Post not found" });
        }

        res.status(200).json(post);
      } catch (error) {
        console.error("Error fetching blog post:", error);
        res.status(500).json({ error: "Failed to fetch blog post" });
      }
      break;

    case "PUT":
      try {
        const { title, description, content, slug, published } = req.body;

        if (!title || !description || !content || !slug) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        const existingPost = await prisma.blogPost.findFirst({
          where: {
            slug,
            NOT: {
              id: String(id),
            },
          },
        });

        if (existingPost) {
          return res.status(400).json({ error: "Slug already exists" });
        }

        const updatedPost = await prisma.blogPost.update({
          where: { id: String(id) },
          data: {
            title,
            description,
            content,
            slug,
            published,
            updatedAt: new Date(),
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

        res.status(200).json(updatedPost);
      } catch (error) {
        console.error("Error updating blog post:", error);
        res.status(500).json({ error: "Failed to update blog post" });
      }
      break;

    case "PATCH":
      try {
        const { published } = req.body;

        if (typeof published !== "boolean") {
          return res.status(400).json({ error: "Invalid published status" });
        }

        const updatedPost = await prisma.blogPost.update({
          where: { id: String(id) },
          data: {
            published,
            updatedAt: new Date(),
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

        res.status(200).json(updatedPost);
      } catch (error) {
        console.error("Error updating blog post status:", error);
        res.status(500).json({ error: "Failed to update blog post status" });
      }
      break;

    case "DELETE":
      try {
        await prisma.blogPost.delete({
          where: { id: String(id) },
        });

        res.status(204).end();
      } catch (error) {
        console.error("Error deleting blog post:", error);
        res.status(500).json({ error: "Failed to delete blog post" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "PUT", "PATCH", "DELETE"]);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
