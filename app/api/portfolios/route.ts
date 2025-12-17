import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql, generateId } from "@/app/lib/db";

// GET - Fetch user's portfolios
// Query params: ?filter=saved (manually saved only), ?filter=history (all), ?filter=all (all)
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";

    let portfolios;
    
    if (filter === "saved") {
      // Only manually saved portfolios (for Developed Portfolios tab)
      portfolios = await sql`
        SELECT id, name, "createdAt", "updatedAt", age, risk, horizon, capital, goal, sectors, "portfolioData", "detailedRecommendations", "isManuallySaved"
        FROM "Portfolio"
        WHERE "userId" = ${session.user.id} AND "isManuallySaved" = true
        ORDER BY "createdAt" DESC
      `;
    } else {
      // All portfolios (for History tab or default)
      portfolios = await sql`
        SELECT id, name, "createdAt", "updatedAt", age, risk, horizon, capital, goal, sectors, "portfolioData", "detailedRecommendations", "isManuallySaved"
        FROM "Portfolio"
        WHERE "userId" = ${session.user.id}
        ORDER BY "createdAt" DESC
      `;
    }

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
// Set isManuallySaved: true for explicit user saves, false for auto-saves
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
    const portfolioId = generateId();
    const now = new Date().toISOString();
    const isManuallySaved = data.isManuallySaved === true;

    await sql`
      INSERT INTO "Portfolio" (
        id, "userId", name, "createdAt", "updatedAt", 
        age, risk, horizon, capital, goal, sectors, 
        "portfolioData", "detailedRecommendations", "isManuallySaved"
      )
      VALUES (
        ${portfolioId},
        ${session.user.id},
        ${data.name || `Portfolio ${new Date().toLocaleDateString()}`},
        ${now},
        ${now},
        ${data.age},
        ${data.risk},
        ${data.horizon},
        ${data.capital},
        ${data.goal},
        ${data.sectors},
        ${JSON.stringify(data.portfolioData)},
        ${data.detailedRecommendations ? JSON.stringify(data.detailedRecommendations) : null},
        ${isManuallySaved}
      )
    `;

    return NextResponse.json({ 
      success: true, 
      portfolio: { id: portfolioId, name: data.name, isManuallySaved } 
    });
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

    // Verify the portfolio belongs to the user and delete
    const result = await sql`
      DELETE FROM "Portfolio"
      WHERE id = ${portfolioId} AND "userId" = ${session.user.id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting portfolio:", error);
    return NextResponse.json(
      { error: "Failed to delete portfolio" },
      { status: 500 }
    );
  }
}
