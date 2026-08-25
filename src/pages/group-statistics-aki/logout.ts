import type { APIRoute } from "astro"
import { isSameOrigin, sessionCookie } from "@/lib/group-statistics/auth"
import { AKI_DATASET } from "@/lib/group-statistics/datasets"

export const prerender = false

export const POST: APIRoute = ({ cookies, request, url, redirect }) => {
	if (!isSameOrigin(request, url)) return new Response("Forbidden", { status: 403 })
	const dataset = AKI_DATASET
	const cookie = sessionCookie(dataset)
	cookies.delete(cookie.name, { path: cookie.path })
	return redirect(dataset.basePath, 303)
}
