import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { requireSupabaseConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostname = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(":")[0]
    .toLowerCase();
  const adminHostname = "admin.ari-mori.com";
  const isPublicHostname = hostname === "ari-mori.com" || hostname === "www.ari-mori.com";
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  if (hostname === adminHostname && pathname === "/") {
    return NextResponse.redirect(new URL("/admin", request.url), 308);
  }

  if (isPublicHostname && isAdminPath) {
    const url = request.nextUrl.clone();
    url.hostname = adminHostname;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  if (pathname === "/admin/manifest.webmanifest") {
    return NextResponse.next({ request });
  }

  if (!isAdminPath) {
    return NextResponse.next({ request });
  }

  const { supabaseUrl, supabasePublishableKey } = requireSupabaseConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (!user && !isLoginPage) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: isAdmin } = await supabase.rpc("ARIMORI_is_admin");

    if (!isAdmin) {
      await supabase.auth.signOut();
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("error", "forbidden");
      return NextResponse.redirect(url);
    }

    if (isLoginPage) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
