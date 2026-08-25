import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import type { StatisticsDataset } from "./datasets"
import type { GroupStatisticRecord } from "./records"

// One serialised write queue per dataset so the endpoints never interleave
// read-modify-write cycles on the same file.
const writeQueues = new Map<string, Promise<void>>()

export interface StoredGroupStatistic extends GroupStatisticRecord {
	id?: string
	googleSyncedAt?: string
}

function dataFilePath(dataset: StatisticsDataset): string {
	const configured = process.env[dataset.dataFileEnv]?.trim()
	if (configured) return resolve(configured)
	return process.env.NODE_ENV === "production"
		? dataset.productionDataFile
		: resolve(dataset.developmentDataFile)
}

function enqueue<T>(dataset: StatisticsDataset, task: () => Promise<T>): Promise<T> {
	const previous = writeQueues.get(dataset.id) ?? Promise.resolve()
	const operation = previous.then(task)
	writeQueues.set(
		dataset.id,
		operation.then(
			() => undefined,
			() => undefined,
		),
	)
	return operation
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

async function readRecords(path: string): Promise<StoredGroupStatistic[]> {
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

export async function listStoredStatistics(
	dataset: StatisticsDataset,
): Promise<StoredGroupStatistic[]> {
	await (writeQueues.get(dataset.id) ?? Promise.resolve())
	return readRecords(dataFilePath(dataset))
}

export async function listPendingGoogleStatistics(
	dataset: StatisticsDataset,
): Promise<StoredGroupStatistic[]> {
	if (!dataset.syncsWithGoogle) return []
	return enqueue(dataset, async () => {
		const path = dataFilePath(dataset)
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
}

export async function appendStoredStatistic(
	dataset: StatisticsDataset,
	record: GroupStatisticRecord,
): Promise<StoredGroupStatistic> {
	const storedRecord: StoredGroupStatistic = { ...record, id: randomUUID() }
	await enqueue(dataset, async () => {
		const path = dataFilePath(dataset)
		const records = await readRecords(path)
		records.push(storedRecord)
		await writeRecords(path, records)
	})
	return storedRecord
}

export async function markGoogleStatisticSynced(
	dataset: StatisticsDataset,
	id: string,
	syncedAt = new Date(),
): Promise<void> {
	return enqueue(dataset, async () => {
		const path = dataFilePath(dataset)
		const records = await readRecords(path)
		const record = records.find(candidate => candidate.id === id)
		if (!record) throw new Error(`Локальная запись ${id} не найдена.`)
		record.googleSyncedAt = syncedAt.toISOString()
		await writeRecords(path, records)
	})
}
