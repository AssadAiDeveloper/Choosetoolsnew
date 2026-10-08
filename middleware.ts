import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

const intl = createMiddleware(routing);

const LOCALE_RE = /^\/(ar|es|nl|fr|de|ru|hi|id|tr|pt)(?=\/|$)/;

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The default locale (en) is served without a prefix. next-intl's own
  // rewrite for /en is temporary (307); answer these with a permanent 308 so
  // search engines update the URL in one hop instead of keeping /en indexed.
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const target = request.nextUrl.clone();
    target.pathname = pathname === "/en" ? "/" : pathname.slice(4);
    return NextResponse.redirect(target, 308);
  }

  const response = intl(request);
  if (response) {
    const locale = pathname.match(LOCALE_RE)?.[1] ?? "en";
    response.headers.set("Content-Language", locale);
  }
  return response;
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};