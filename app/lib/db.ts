import { neon } from "@neondatabase/serverless";

// Create a SQL query function using Neon's serverless driver
// This works directly on Vercel without any binary engine issues
export const sql = neon(process.env.DATABASE_URL!);

// Helper to generate cuid-like IDs
export function generateId(): string {
  return 'c' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

