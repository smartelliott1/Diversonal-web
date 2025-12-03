import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

// GET - Fetch user's portfolios
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const portfolios = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        age: true,
        risk: true,
        horizon: true,
        capital: true,
        goal: true,
        sectors: true,
        portfolioData: true,
        detailedRecommendations: true,
      },
    });

    return NextResponse.json({ portfolios });
  } catch (error) {
    console.error("Error fetching portfolios:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolios" },
      { status: 500 }
    );
  }
}

// POST - Save a new portfolio
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: session.user.id,
        name: data.name || `Portfolio ${new Date().toLocaleDateString()}`,
        age: data.age,
        risk: data.risk,
        horizon: data.horizon,
        capital: data.capital,
        goal: data.goal,
        sectors: data.sectors,
        portfolioData: data.portfolioData,
        detailedRecommendations: data.detailedRecommendations || null,
      },
    });

    return NextResponse.json({ success: true, portfolio });
  } catch (error) {
    console.error("Error saving portfolio:", error);
    return NextResponse.json(
      { error: "Failed to save portfolio" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a portfolio
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get("id");

    if (!portfolioId) {
      return NextResponse.json(
        { error: "Portfolio ID required" },
        { status: 400 }
      );
    }

    // Verify the portfolio belongs to the user
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        userId: session.user.id,
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    await prisma.portfolio.delete({
      where: { id: portfolioId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting portfolio:", error);
    return NextResponse.json(
      { error: "Failed to delete portfolio" },
      { status: 500 }
    );
  }
}

