import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(_request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set("Cache-Control", "public, max-age=120")

  return response
}

export const config = {
  /* The middleware matches on everything by default (all static files, js chunks,
   * RSC payloads, etc.). It's safest to list out the paths here, although that does
   * leave us with the maintenance overhead.
   */
  matcher: [
    /* HTML responses. These are dynamically rendered, so Next.js instructs no-cache,
     * however we are currently serving public content that is cacheable. */
    "/",
    "/about",
    "/c",
    "/c/[channelType]",
    "/c/[channelType]/[name]",
    "/cart",
    "/dashboard",
    "/dashboard/[tab]",
    "/dashboard/[tab]/[id]",
    "/departments",
    "/learningpaths",
    "/learningpaths/[id]",
    "/onboarding",
    "/privacy",
    "/program_letter",
    "/program_letter/[id]",
    "/program_letter/[id]/view",
    "/search",
    "/terms",
    "/topics",
    "/unit",

    /* Images rendered with the Next.js Image component have the cache header
     * set on them, but CSS background images do not.
     */
    "/images/(.*)",
    "/favicon.ico",
  ],
}
