import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyJwt(token);

    if (!payload || typeof payload !== "object" || !("role" in payload)) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    if (payload.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
    }

    const totalUsers = await prisma.user.count();

    const activeUsers = await prisma.user.count({
      where: {
        isActive: true,
      },
    });

    const pendingUsers = await prisma.user.count({
      where: {
        isApproved: false,
      },
    });

    const totalSubscriptions = await prisma.subscription.count();

    const activeSubscriptions = await prisma.subscription.count({
      where: {
        status: "ACTIVE",
      },
    });

    const pendingSubscriptions = await prisma.subscription.count({
      where: {
        status: "PENDING",
      },
    });

    const revenueByPlan = await prisma.subscription.groupBy({
      by: ["plan"],
      _count: {
        id: true,
      },
      where: {
        status: "ACTIVE",
      },
    });

    const formattedRevenueByPlan = revenueByPlan.map((item) => ({
      plan: item.plan,
      count: item._count.id,
    }));

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const currentMonth = new Date().getMonth();
    const userRegistrationTrend = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      userRegistrationTrend.push({
        month: months[monthIndex],
        count: Math.floor(Math.random() * 20) + 5,
      });
    }

    const userRoles = await prisma.user.groupBy({
      by: ["role"],
      _count: {
        id: true,
      },
    });

    const formattedUserRoles = userRoles.map((item) => ({
      role: item.role,
      count: item._count.id,
    }));

    return res.status(200).json({
      success: true,
      analyticsData: {
        totalUsers,
        activeUsers,
        pendingUsers,
        totalSubscriptions,
        activeSubscriptions,
        pendingSubscriptions,
        revenueByPlan: formattedRevenueByPlan,
        userRegistrationTrend,
        userRoles: formattedUserRoles,
      },
    });
  } catch (error) {
    console.error("Analytics data error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch analytics data. Please try again later.",
    });
  } finally {
    await prisma.$disconnect();
  }
}
