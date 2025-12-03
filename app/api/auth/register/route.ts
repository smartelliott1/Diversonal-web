import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, generateId } from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM "User" WHERE email = ${email}
    `;

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userId = generateId();
    const now = new Date().toISOString();
    
    await sql`
      INSERT INTO "User" (id, name, email, password, "createdAt", "updatedAt")
      VALUES (${userId}, ${name || null}, ${email}, ${hashedPassword}, ${now}, ${now})
    `;

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: name || null,
        email: email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
