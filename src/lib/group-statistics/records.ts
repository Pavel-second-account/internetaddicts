export const STATISTICS_HEADERS = [
	"Название группы",
	"Дата",
	"Количество участников",
	"Количество новичков",
	"User",
	"Timestamp",
] as const

export interface GroupStatisticRecord {
	groupName: string
	date: string
	participantCount: number
	newcomerCount: number
	user: string
	timestamp: string
}

export interface RecordInput {
	groupName: string
	date: string
	participantCount: string
	newcomerCount: string
	user: string
}

export interface ValidationResult {
	value?: GroupStatisticRecord
	errors: string[]
}

const MAX_GROUP_NAME_LENGTH = 120
const MAX_USER_LENGTH = 80
const MAX_COUNT = 10_000

export function inputFromForm(form: FormData): RecordInput {
	return {
		groupName: String(form.get("groupName") ?? "").trim(),
		date: String(form.get("date") ?? "").trim(),
		participantCount: String(form.get("participantCount") ?? "").trim(),
		newcomerCount: String(form.get("newcomerCount") ?? "").trim(),
		user: String(form.get("user") ?? "").trim(),
	}
}

function parseNonNegativeInteger(value: string): number | null {
	if (!/^\d+$/.test(value)) return null
	const parsed = Number(value)
	return Number.isSafeInteger(parsed) && parsed <= MAX_COUNT ? parsed : null
}

function formatInputDate(value: string): string | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
	if (!match) return null

	const year = Number(match[1])
	const month = Number(match[2])
	const day = Number(match[3])
	const date = new Date(Date.UTC(year, month - 1, day))
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null
	}

	return `${match[3]}.${match[2]}.${match[1]}`
}

function moscowTimestamp(now: Date): string {
	const parts = new Intl.DateTimeFormat("sv-SE", {
		timeZone: "Europe/Moscow",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).formatToParts(now)
	const part = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find(candidate => candidate.type === type)?.value ?? ""
	return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}`
}

export function validateRecord(input: RecordInput, now = new Date()): ValidationResult {
	const errors: string[] = []
	const date = formatInputDate(input.date)
	const participantCount = parseNonNegativeInteger(input.participantCount)
	const newcomerCount = parseNonNegativeInteger(input.newcomerCount)

	if (!input.groupName || input.groupName.length > MAX_GROUP_NAME_LENGTH) {
		errors.push(`Название группы обязательно и должно быть не длиннее ${MAX_GROUP_NAME_LENGTH} символов.`)
	}
	if (!date) errors.push("Укажите корректную дату собрания.")
	if (participantCount === null) {
		errors.push(`Количество участников должно быть целым числом от 0 до ${MAX_COUNT}.`)
	}
	if (newcomerCount === null) {
		errors.push(`Количество новичков должно быть целым числом от 0 до ${MAX_COUNT}.`)
	}
	if (
		participantCount !== null &&
		newcomerCount !== null &&
		newcomerCount > participantCount
	) {
		errors.push("Количество новичков не может превышать количество участников.")
	}
	if (!input.user || input.user.length > MAX_USER_LENGTH) {
		errors.push(`Имя ответственного обязательно и должно быть не длиннее ${MAX_USER_LENGTH} символов.`)
	}

	if (errors.length || !date || participantCount === null || newcomerCount === null) {
		return { errors }
	}

	return {
		errors,
		value: {
			groupName: input.groupName,
			date,
			participantCount,
			newcomerCount,
			user: input.user,
			timestamp: moscowTimestamp(now),
		},
	}
}

export function recordToRow(record: GroupStatisticRecord): Array<string | number> {
	return [
		record.groupName,
		record.date,
		record.participantCount,
		record.newcomerCount,
		record.user,
		record.timestamp,
	]
}

export function rowsToRecords(rows: unknown[][]): GroupStatisticRecord[] {
	if (!Array.isArray(rows)) return []
	const firstRowIsHeader = String(rows[0]?.[0] ?? "").trim() === STATISTICS_HEADERS[0]
	const dataRows = firstRowIsHeader ? rows.slice(1) : rows

	return dataRows
		.filter(row => Array.isArray(row) && row.some(cell => String(cell ?? "").trim()))
		.map(row => ({
			groupName: String(row[0] ?? ""),
			date: String(row[1] ?? ""),
			participantCount: Number(row[2] ?? 0),
			newcomerCount: Number(row[3] ?? 0),
			user: String(row[4] ?? ""),
			timestamp: String(row[5] ?? ""),
		}))
}
