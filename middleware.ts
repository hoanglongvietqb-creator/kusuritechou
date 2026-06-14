import { auth } from "@/lib/auth.middleware";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register") ||
    req.nextUrl.pathname.startsWith("/forgot-password") ||
    req.nextUrl.pathname.startsWith("/reset-password");
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");
  const isCron = req.nextUrl.pathname.startsWith("/api/cron");

  if (isApiAuth || isCron) return NextResponse.next();

  if (!isLoggedIn && !isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)"],
};
