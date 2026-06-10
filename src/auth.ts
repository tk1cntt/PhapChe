import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

// SQLite for development, PostgreSQL for production
const dbProvider = process.env.NODE_ENV === "production" ? "postgresql" : "sqlite";

export const auth = betterAuth({
  baseURL,
  database: prismaAdapter(prisma, {
    provider: dbProvider,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // refresh every 24h
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:3005",
    baseURL,
  ],
  plugins: [nextCookies()],
});
