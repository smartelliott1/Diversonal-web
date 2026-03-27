// API route for managing Agent Opti chats
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql, generateId } from "@/app/lib/db";

// GET - Fetch all chats for a user
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from email
    const users = await sql`
      SELECT id FROM "User" WHERE email = ${session.user.email}
    `;

    if (users.length === 0) {
      return NextResponse.json({ chats: [] });
    }

    const userId = users[0].id;

    // Fetch all chats with their latest message for preview
    const chats = await sql`
      SELECT 
        c.id,
        c.title,
        c."createdAt",
        c."updatedAt",
        (
          SELECT content 
          FROM "ChatMessage" 
          WHERE "chatId" = c.id 
          ORDER BY "createdAt" DESC 
          LIMIT 1
        ) as "lastMessage",
        (
          SELECT COUNT(*)::int 
          FROM "ChatMessage" 
          WHERE "chatId" = c.id
        ) as "messageCount"
      FROM "Chat" c
      WHERE c."userId" = ${userId}
      ORDER BY c."updatedAt" DESC
    `;

    return NextResponse.json({ chats });
  } catch (error) {
    console.error("[Chats API] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}

// POST - Create a new chat
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await request.json();

    // Get user ID from email
    const users = await sql`
      SELECT id FROM "User" WHERE email = ${session.user.email}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = users[0].id;
    const chatId = generateId();
    const now = new Date();

    // Create new chat
    await sql`
      INSERT INTO "Chat" (id, "userId", title, "createdAt", "updatedAt")
      VALUES (${chatId}, ${userId}, ${title || "New Chat"}, ${now}, ${now})
    `;

    return NextResponse.json({ 
      chat: {
        id: chatId,
        title: title || "New Chat",
        createdAt: now,
        updatedAt: now,
        lastMessage: null,
        messageCount: 0
      }
    });
  } catch (error) {
    console.error("[Chats API] POST error:", error);
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
  }
}

// DELETE - Delete a chat
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("id");

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

    // Verify chat belongs to user before deleting
    const chat = await sql`
      SELECT id FROM "Chat" WHERE id = ${chatId} AND "userId" = ${userId}
    `;

    if (chat.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Delete messages first (cascade should handle this, but being explicit)
    await sql`DELETE FROM "ChatMessage" WHERE "chatId" = ${chatId}`;
    
    // Delete chat
    await sql`DELETE FROM "Chat" WHERE id = ${chatId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Chats API] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 });
  }
}

// PATCH - Update chat title
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title } = await request.json();

    if (!id || !title) {
      return NextResponse.json({ error: "Chat ID and title required" }, { status: 400 });
    }

    // Get user ID from email
    const users = await sql`
      SELECT id FROM "User" WHERE email = ${session.user.email}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = users[0].id;
    const now = new Date();

    // Update chat title (only if it belongs to user)
    const result = await sql`
      UPDATE "Chat" 
      SET title = ${title}, "updatedAt" = ${now}
      WHERE id = ${id} AND "userId" = ${userId}
      RETURNING id, title, "updatedAt"
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ chat: result[0] });
  } catch (error) {
    console.error("[Chats API] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update chat" }, { status: 500 });
  }
}





