import type { APIRoute } from "astro"
import { hasValidSession, sessionCookie } from "@/lib/group-statistics/auth"
import { AKI_DATASET } from "@/lib/group-statistics/datasets"
import { exportTsv } from "@/lib/group-statistics/export"

export const prerender = false

export const GET: APIRoute = async ({ cookies }) => {
	const dataset = AKI_DATASET
	if (!hasValidSession(dataset, cookies.get(sessionCookie(dataset).name)?.value)) {
		return new Response("Требуется вход по паролю.", {
			status: 401,
			headers: { "content-type": "text/plain; charset=utf-8" },
		})
	}
	return exportTsv(dataset)
}
