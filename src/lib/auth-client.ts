import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.BETTER_AUTH_URL || (() => { throw new Error('BETTER_AUTH_URL environment variable is required on the server'); })())
});
export const { signIn, signUp, signOut, useSession } = authClient;
