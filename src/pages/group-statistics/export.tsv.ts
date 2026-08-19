import type { APIRoute } from "astro"
import { hasValidSession, sessionCookie } from "@/lib/group-statistics/auth"
import { recordToRow, STATISTICS_HEADERS } from "@/lib/group-statistics/records"
import { listStoredStatistics } from "@/lib/group-statistics/storage"

export const prerender = false

function tsvCell(value: string | number): string {
	let cell = String(value).replace(/[\t\r\n]+/g, " ")
	// Prevent values entered by users from becoming formulas when the TSV is
	// opened in Excel or Google Sheets.
	if (/^\s*[=+\-@]/.test(cell)) cell = `'${cell}`
	return cell
}

export const GET: APIRoute = async ({ cookies }) => {
	if (!hasValidSession(cookies.get(sessionCookie.name)?.value)) {
		return new Response("Требуется вход по паролю.", {
			status: 401,
			headers: { "content-type": "text/plain; charset=utf-8" },
		})
	}

	const records = await listStoredStatistics()
	const rows = [STATISTICS_HEADERS, ...records.map(recordToRow)]
	const contents = `\uFEFF${rows.map(row => row.map(tsvCell).join("\t")).join("\r\n")}\r\n`
	const date = new Date().toISOString().slice(0, 10)

	return new Response(contents, {
		headers: {
			"cache-control": "private, no-store",
			"content-disposition": `attachment; filename="group-statistics-${date}.tsv"`,
			"content-type": "text/tab-separated-values; charset=utf-8",
		},
	})
}
