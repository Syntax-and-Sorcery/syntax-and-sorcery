import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// "/api" is listed because the routes check the user themselves and answer 401 instead of a redirect
const PUBLIC_PATHS = ["/", "/login", "/signup", "/reset-password", "/auth", "/api"];

export async function updateSession(request: NextRequest) {
  // mock mode skips auth so local dev works without Supabase keys
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === "mock") return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v)); // no-cache headers
        },
      },
    },
  );

  // don't put code between createServerClient and getClaims
  const { data } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || (p !== "/" && path.startsWith(p)));

  if (!data?.claims && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return response; // return this exact object, or the session cookies are lost
}
