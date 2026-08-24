import { createSign } from "node:crypto"
import { readFile } from "node:fs/promises"
import { STATISTICS_HEADERS, recordToRow } from "./records"
import type { StoredGroupStatistic } from "./storage"

interface ServiceAccountCredentials {
	client_email: string
	private_key: string
	token_uri?: string
}

interface TokenCache {
	accessToken: string
	expiresAt: number
}

const DEFAULT_SPREADSHEET_ID = "1qaSmvkymqUMT_Y-VwbSdDFEi0hDGVcxkU67AE_lLoR4"
const DEFAULT_RANGE = "Лист1!A:H"
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/spreadsheets"
// Keep Record ID in column G so existing rows and deduplication remain compatible.
const GOOGLE_HEADERS = [...STATISTICS_HEADERS.slice(0, 6), "Record ID", STATISTICS_HEADERS[6]]
let tokenCache: TokenCache | undefined

function base64url(value: string): string {
	return Buffer.from(value).toString("base64url")
}

async function credentials(): Promise<ServiceAccountCredentials> {
	const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()
	const filePath = process.env.GOOGLE_SERVICE_ACCOUNT_FILE?.trim()
	if (!inline && !filePath) {
		throw new Error("Не заданы GOOGLE_SERVICE_ACCOUNT_JSON или GOOGLE_SERVICE_ACCOUNT_FILE.")
	}

	let parsed: Partial<ServiceAccountCredentials>
	try {
		parsed = JSON.parse(inline || (await readFile(filePath!, "utf8")))
	} catch {
		throw new Error("Не удалось прочитать JSON учётной записи Google.")
	}

	if (!parsed.client_email || !parsed.private_key) {
		throw new Error("В JSON учётной записи Google отсутствуют client_email или private_key.")
	}

	return {
		client_email: parsed.client_email,
		private_key: parsed.private_key.replace(/\\n/g, "\n"),
		token_uri: parsed.token_uri,
	}
}

async function accessToken(): Promise<string> {
	const nowSeconds = Math.floor(Date.now() / 1000)
	if (tokenCache && tokenCache.expiresAt > nowSeconds + 60) return tokenCache.accessToken

	const account = await credentials()
	const tokenUri = account.token_uri || "https://oauth2.googleapis.com/token"
	const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
	const claim = base64url(
		JSON.stringify({
			iss: account.client_email,
			scope: GOOGLE_SCOPE,
			aud: tokenUri,
			iat: nowSeconds,
			exp: nowSeconds + 3600,
		}),
	)
	const unsigned = `${header}.${claim}`
	const signer = createSign("RSA-SHA256")
	signer.update(unsigned)
	signer.end()
	const assertion = `${unsigned}.${signer.sign(account.private_key, "base64url")}`

	const response = await fetch(tokenUri, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
			assertion,
		}),
	})
	const body = (await response.json().catch(() => ({}))) as {
		access_token?: string
		expires_in?: number
		error_description?: string
	}
	if (!response.ok || !body.access_token) {
		throw new Error(body.error_description || "Google не выдал токен доступа.")
	}

	tokenCache = {
		accessToken: body.access_token,
		expiresAt: nowSeconds + (body.expires_in ?? 3600),
	}
	return tokenCache.accessToken
}

function config(): { spreadsheetId: string; range: string; sheetPrefix: string } {
	const configuredRange = process.env.AIZ_STATS_SHEET_RANGE?.trim() || DEFAULT_RANGE
	const separatorIndex = configuredRange.indexOf("!")
	const sheetPrefix = separatorIndex >= 0 ? `${configuredRange.slice(0, separatorIndex)}!` : ""
	return {
		spreadsheetId: process.env.AIZ_STATS_SPREADSHEET_ID?.trim() || DEFAULT_SPREADSHEET_ID,
		// Eight values are now stored. Derive the range from the configured sheet name
		// so installations that still have the former A:G setting keep working.
		range: `${sheetPrefix}A:H`,
		sheetPrefix,
	}
}

async function googleRequest(url: string, init?: RequestInit): Promise<any> {
	const response = await fetch(url, {
		...init,
		headers: {
			authorization: `Bearer ${await accessToken()}`,
			...(init?.body ? { "content-type": "application/json" } : {}),
			...init?.headers,
		},
	})
	const body = await response.json().catch(() => ({}))
	if (!response.ok) {
		throw new Error(body?.error?.message || `Google Sheets API вернул HTTP ${response.status}.`)
	}
	return body
}

function valuesUrl(range: string, suffix = ""): string {
	const { spreadsheetId } = config()
	const apiBase = process.env.GOOGLE_SHEETS_API_BASE_URL?.trim() || "https://sheets.googleapis.com"
	return `${apiBase.replace(/\/$/, "")}/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}${suffix}`
}

async function getValues(range: string): Promise<unknown[][]> {
	const url = new URL(valuesUrl(range))
	url.searchParams.set("majorDimension", "ROWS")
	url.searchParams.set("valueRenderOption", "FORMATTED_VALUE")
	const body = await googleRequest(url.toString())
	return Array.isArray(body.values) ? body.values : []
}

async function updateValues(range: string, values: Array<Array<string | number>>): Promise<void> {
	const url = new URL(valuesUrl(range))
	url.searchParams.set("valueInputOption", "RAW")
	await googleRequest(url.toString(), {
		method: "PUT",
		body: JSON.stringify({ majorDimension: "ROWS", values }),
	})
}

async function ensureHeaders(): Promise<void> {
	const { sheetPrefix } = config()
	const headerRange = `${sheetPrefix}A1:H1`
	const rows = await getValues(headerRange)
	const current = rows[0] ?? []
	if (current.length === 0 || current.every(value => String(value ?? "").trim() === "")) {
		await updateValues(headerRange, [GOOGLE_HEADERS])
	} else {
		if (!String(current[6] ?? "").trim()) {
			await updateValues(`${sheetPrefix}G1`, [["Record ID"]])
		}
		if (!String(current[7] ?? "").trim()) {
			await updateValues(`${sheetPrefix}H1`, [[STATISTICS_HEADERS[6]]])
		}
	}
}

export async function appendGroupStatisticToGoogle(record: StoredGroupStatistic): Promise<void> {
	if (!record.id) throw new Error("У локальной записи отсутствует Record ID.")
	await ensureHeaders()

	const { range, sheetPrefix } = config()
	const idRows = await getValues(`${sheetPrefix}G:G`)
	if (idRows.some(row => String(row[0] ?? "") === record.id)) return

	const url = new URL(valuesUrl(range, ":append"))
	url.searchParams.set("valueInputOption", "RAW")
	url.searchParams.set("insertDataOption", "INSERT_ROWS")
	await googleRequest(url.toString(), {
		method: "POST",
		body: JSON.stringify({
			majorDimension: "ROWS",
			values: [[...recordToRow(record).slice(0, 6), record.id, record.additionalInfo]],
		}),
	})
}
