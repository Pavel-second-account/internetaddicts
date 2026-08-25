import type { StatisticsDataset } from "./datasets"
import { recordToRow, STATISTICS_HEADERS } from "./records"
import { listStoredStatistics } from "./storage"

function tsvCell(value: string | number): string {
	let cell = String(value).replace(/[\t\r\n]+/g, " ")
	// Prevent values entered by users from becoming formulas when the TSV is
	// opened in Excel or Google Sheets.
	if (/^\s*[=+\-@]/.test(cell)) cell = `'${cell}`
	return cell
}

export async function exportTsv(dataset: StatisticsDataset): Promise<Response> {
	const records = await listStoredStatistics(dataset)
	const rows = [STATISTICS_HEADERS, ...records.map(recordToRow)]
	const contents = `﻿${rows.map(row => row.map(tsvCell).join("\t")).join("\r\n")}\r\n`
	const date = new Date().toISOString().slice(0, 10)

	return new Response(contents, {
		headers: {
			"cache-control": "private, no-store",
			"content-disposition": `attachment; filename="${dataset.exportFilePrefix}-${date}.tsv"`,
			"content-type": "text/tab-separated-values; charset=utf-8",
		},
	})
}
