import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import type { GroupStatisticRecord } from "./records"

const DEFAULT_PRODUCTION_PATH = "/opt/internetaddicts/shared/group-statistics.json"
const DEFAULT_DEVELOPMENT_PATH = "./data/group-statistics.json"

let writeQueue: Promise<void> = Promise.resolve()

export interface StoredGroupStatistic extends GroupStatisticRecord {
	id?: string
	googleSyncedAt?: string
}

function dataFilePath(): string {
	const configured = process.env.AIZ_STATS_DATA_FILE?.trim()
	if (configured) return resolve(configured)
	return process.env.NODE_ENV === "production"
		? DEFAULT_PRODUCTION_PATH
		: resolve(DEFAULT_DEVELOPMENT_PATH)
}

function isRecord(value: unknown): value is StoredGroupStatistic {
	if (!value || typeof value !== "object") return false
	const record = value as Partial<GroupStatisticRecord>
	return (
		typeof record.groupName === "string" &&
		typeof record.date === "string" &&
		typeof record.participantCount === "number" &&
		typeof record.newcomerCount === "number" &&
		typeof record.user === "string" &&
		typeof record.timestamp === "string"
	)
}

async function readRecords(path = dataFilePath()): Promise<StoredGroupStatistic[]> {
	try {
		const contents = await readFile(path, "utf8")
		const parsed: unknown = JSON.parse(contents)
		if (!Array.isArray(parsed) || !parsed.every(isRecord)) {
			throw new Error("Файл статистики имеет неверный формат.")
		}
		return parsed.map(record => ({
			...record,
			// Records created before this field was introduced remain valid.
			additionalInfo: typeof record.additionalInfo === "string" ? record.additionalInfo : "",
		}))
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return []
		throw error
	}
}

async function writeRecords(path: string, records: StoredGroupStatistic[]): Promise<void> {
	await mkdir(dirname(path), { recursive: true, mode: 0o700 })
	const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`
	await writeFile(temporaryPath, `${JSON.stringify(records, null, 2)}\n`, { mode: 0o600 })
	await rename(temporaryPath, path)
}

export async function listStoredStatistics(): Promise<StoredGroupStatistic[]> {
	await writeQueue
	return readRecords()
}

export async function listPendingGoogleStatistics(): Promise<StoredGroupStatistic[]> {
	const operation = writeQueue.then(async () => {
		const path = dataFilePath()
		const records = await readRecords(path)
		let migrated = false
		for (const record of records) {
			if (!record.id) {
				record.id = randomUUID()
				migrated = true
			}
		}
		if (migrated) await writeRecords(path, records)
		return records.filter(record => !record.googleSyncedAt)
	})

	writeQueue = operation.then(
		() => undefined,
		() => undefined,
	)
	return operation
}

export async function appendStoredStatistic(
	record: GroupStatisticRecord,
): Promise<StoredGroupStatistic> {
	const storedRecord: StoredGroupStatistic = { ...record, id: randomUUID() }
	const operation = writeQueue.then(async () => {
		const path = dataFilePath()
		const records = await readRecords(path)
		records.push(storedRecord)
		await writeRecords(path, records)
	})

	writeQueue = operation.catch(() => undefined)
	await operation
	return storedRecord
}

export async function markGoogleStatisticSynced(id: string, syncedAt = new Date()): Promise<void> {
	const operation = writeQueue.then(async () => {
		const path = dataFilePath()
		const records = await readRecords(path)
		const record = records.find(candidate => candidate.id === id)
		if (!record) throw new Error(`Локальная запись ${id} не найдена.`)
		record.googleSyncedAt = syncedAt.toISOString()
		await writeRecords(path, records)
	})

	writeQueue = operation.catch(() => undefined)
	return operation
}
