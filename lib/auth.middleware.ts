import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Invalid AUTH_URL on Vercel causes "TypeError: Invalid URL" in NextAuth.
// If malformed, unset so trustHost uses request headers instead.
const authUrl = process.env.AUTH_URL?.trim();
if (authUrl) {
  try {
    new URL(authUrl);
  } catch {
    delete process.env.AUTH_URL;
  }
}

export const { auth } = NextAuth(authConfig);
