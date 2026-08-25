import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import type { StatisticsDataset } from "./datasets"

const SESSION_LIFETIME_SECONDS = 8 * 60 * 60

function getPassword(): string {
	return process.env.AIZ_STATS_PASSWORD?.trim() ?? ""
}

function getSessionSecret(): string {
	return process.env.AIZ_STATS_SESSION_SECRET?.trim() || getPassword()
}

function digest(value: string): Buffer {
	return createHash("sha256").update(value).digest()
}

// The dataset id is part of the signed payload so a session issued for one
// endpoint cannot be replayed against another.
function sign(dataset: StatisticsDataset, expiresAt: string): string {
	return createHmac("sha256", getSessionSecret())
		.update(`v1.${dataset.id}.${expiresAt}`)
		.digest("base64url")
}

export function isPasswordConfigured(): boolean {
	return getPassword().length > 0
}

export function passwordMatches(candidate: string): boolean {
	const configured = getPassword()
	if (!configured) return false
	return timingSafeEqual(digest(candidate), digest(configured))
}

export function hasValidSession(
	dataset: StatisticsDataset,
	cookieValue: string | undefined,
): boolean {
	if (!cookieValue || !isPasswordConfigured()) return false

	const [version, expiresAt, signature] = cookieValue.split(".")
	if (version !== "v1" || !expiresAt || !signature) return false
	if (!/^\d+$/.test(expiresAt) || Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false

	const expected = sign(dataset, expiresAt)
	return timingSafeEqual(digest(signature), digest(expected))
}

export function createSessionCookie(dataset: StatisticsDataset): string {
	const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS)
	return `v1.${expiresAt}.${sign(dataset, expiresAt)}`
}

export function sessionCookie(dataset: StatisticsDataset): {
	name: string
	path: string
	maxAge: number
} {
	return {
		name: dataset.cookieName,
		path: dataset.basePath,
		maxAge: SESSION_LIFETIME_SECONDS,
	}
}

export function isSameOrigin(request: Request, _url: URL): boolean {
	// SameSite=Strict on the signed session cookie is the primary CSRF protection.
	// Sec-Fetch-Site remains reliable when Astro is behind a reverse proxy whose
	// internal request URL differs from the public Origin.
	return request.headers.get("sec-fetch-site") !== "cross-site"
}
