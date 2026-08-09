import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

// SQLite for both dev and production (same local file DB)
const dbProvider = "sqlite";

export const auth = betterAuth({
  baseURL,
  database: prismaAdapter(prisma, {
    provider: dbProvider,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // mapProfileToUser: (profile) => ({
      //   id: profile.sub,
      //   name: profile.name,
      //   email: profile.email,
      //   emailVerified: profile.email_verified,
      //   image: profile.picture,
      // }),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // refresh every 24h
  },
  // Wildcard patterns for tunnel origins (trycloudflare, ngrok, etc.)
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:3005",
    baseURL,
    "https://*.trycloudflare.com",
    "https://*.ngrok-free.app",
  ],
  advanced: {
    // Disable CSRF for tunnel/proxy scenarios (demo/dev mode)
    disableCSRFCheck: true,
    // Tắt crossSubDomainCookies — không set Domain attribute trên cookie
    // để browser gửi cookie cho bất kỳ host nào (localhost, tunnel, v.v.)
    // CRITICAL: Force useSecureCookies=false — nếu không, production build
    // (isProduction=true) sẽ thêm __Secure- prefix + secure:true → browser
    // từ chối cookie trên HTTP → session không được gửi → redirect loop.
    useSecureCookies: false,
  },
  plugins: [nextCookies()],
});
