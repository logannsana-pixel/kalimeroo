import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") || "";

  // ADMIN PANEL
  if (hostname === "admin-panel.kalimero.shop") {
    if (!url.pathname.startsWith("/auth/admin")) {
      url.pathname = `/auth/admin${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  } 
  return NextResponse.next();
}
