// API route for managing chat messages
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql, generateId } from "@/app/lib/db";

// GET - Fetch messages for a specific chat
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json({ error: "Chat ID required" }, { status: 400 });
    }

    // Get user ID from email
    const users = await sql`
      SELECT id FROM "User" WHERE email = ${session.user.email}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = users[0].id;

    // Verify chat belongs to user
    const chat = await sql`
      SELECT id FROM "Chat" WHERE id = ${chatId} AND "userId" = ${userId}
    `;

    if (chat.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Fetch all messages for this chat
    const messages = await sql`
      SELECT id, role, content, "createdAt"
      FROM "ChatMessage"
      WHERE "chatId" = ${chatId}
      ORDER BY "createdAt" ASC
    `;

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[Messages API] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST - Add a message to a chat
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, role, content } = await request.json();

    if (!chatId || !role || !content) {
      return NextResponse.json({ error: "Chat ID, role, and content required" }, { status: 400 });
    }

    // Get user ID from email
    const users = await sql`
      SELECT id FROM "User" WHERE email = ${session.user.email}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = users[0].id;

    // Verify chat belongs to user
    const chat = await sql`
      SELECT id FROM "Chat" WHERE id = ${chatId} AND "userId" = ${userId}
    `;

    if (chat.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const messageId = generateId();
    const now = new Date();

    // Create new message
    await sql`
      INSERT INTO "ChatMessage" (id, "chatId", role, content, "createdAt")
      VALUES (${messageId}, ${chatId}, ${role}, ${content}, ${now})
    `;

    // Update chat's updatedAt timestamp
    await sql`
      UPDATE "Chat" SET "updatedAt" = ${now} WHERE id = ${chatId}
    `;

    return NextResponse.json({ 
      message: {
        id: messageId,
        chatId,
        role,
        content,
        createdAt: now
      }
    });
  } catch (error) {
    console.error("[Messages API] POST error:", error);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}





