import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth(async (request) => {
  const session = request.auth;
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|sign-in|_next/static|_next/image|favicon.ico).*)"],
};
