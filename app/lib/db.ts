import { neon, NeonQueryFunction } from "@neondatabase/serverless";

// Lazy-initialized SQL client to avoid build-time errors
let sqlClient: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!sqlClient) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    sqlClient = neon(databaseUrl);
  }
  return sqlClient;
}

// Export a tagged template function that lazily initializes the connection
export const sql: NeonQueryFunction<false, false> = ((
  strings: TemplateStringsArray,
  ...values: unknown[]
) => {
  return getSql()(strings, ...values);
}) as NeonQueryFunction<false, false>;

// Helper to generate cuid-like IDs
export function generateId(): string {
  return 'c' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

