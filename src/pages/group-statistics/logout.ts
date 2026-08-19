import type { APIRoute } from "astro"
import { isSameOrigin, sessionCookie } from "@/lib/group-statistics/auth"

export const prerender = false

export const POST: APIRoute = ({ cookies, request, url, redirect }) => {
	if (!isSameOrigin(request, url)) return new Response("Forbidden", { status: 403 })
	cookies.delete(sessionCookie.name, { path: "/group-statistics" })
	return redirect("/group-statistics", 303)
}
