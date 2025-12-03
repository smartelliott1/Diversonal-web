import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sql, generateId } from "@/app/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Find user by email using raw SQL
        const users = await sql`
          SELECT id, email, name, image, password 
          FROM "User" 
          WHERE email = ${email}
        `;

        const user = users[0];

        // Check if user exists and has a password (local account)
        if (!user || !user.password) {
          return null;
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/", // We'll use modals instead of a separate page
  },
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google OAuth - create/update user in database
      if (account?.provider === "google" && user.email) {
        try {
          const existingUsers = await sql`
            SELECT id FROM "User" WHERE email = ${user.email}
          `;
          
          const now = new Date().toISOString();
          
          if (existingUsers.length === 0) {
            // Create new user
            const userId = generateId();
            await sql`
              INSERT INTO "User" (id, name, email, image, "emailVerified", "createdAt", "updatedAt")
              VALUES (${userId}, ${user.name || null}, ${user.email}, ${user.image || null}, ${now}, ${now}, ${now})
            `;
            user.id = userId;
          } else {
            // Update existing user
            user.id = existingUsers[0].id;
            await sql`
              UPDATE "User" 
              SET name = ${user.name || null}, image = ${user.image || null}, "updatedAt" = ${now}
              WHERE id = ${user.id}
            `;
          }
          
          // Create/update account link
          if (account.providerAccountId) {
            const existingAccounts = await sql`
              SELECT id FROM "Account" 
              WHERE provider = ${account.provider} AND "providerAccountId" = ${account.providerAccountId}
            `;
            
            if (existingAccounts.length === 0) {
              const accountId = generateId();
              await sql`
                INSERT INTO "Account" (id, "userId", type, provider, "providerAccountId", access_token, refresh_token, expires_at, token_type, scope, id_token, session_state)
                VALUES (
                  ${accountId}, 
                  ${user.id}, 
                  ${account.type || 'oauth'}, 
                  ${account.provider}, 
                  ${account.providerAccountId},
                  ${account.access_token || null},
                  ${account.refresh_token || null},
                  ${account.expires_at || null},
                  ${account.token_type || null},
                  ${account.scope || null},
                  ${account.id_token || null},
                  ${account.session_state || null}
                )
              `;
            }
          }
        } catch (error) {
          console.error("Error handling Google sign in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
