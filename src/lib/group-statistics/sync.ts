import type { StatisticsDataset } from "./datasets"
import { appendGroupStatisticToGoogle } from "./sheets"
import { listPendingGoogleStatistics, markGoogleStatisticSynced } from "./storage"

const syncQueues = new Map<string, Promise<void>>()

export async function syncPendingGoogleStatistics(dataset: StatisticsDataset): Promise<void> {
	if (!dataset.syncsWithGoogle) return

	const previous = syncQueues.get(dataset.id) ?? Promise.resolve()
	const operation = previous.then(async () => {
		const pending = await listPendingGoogleStatistics(dataset)
		for (const record of pending) {
			await appendGroupStatisticToGoogle(record)
			await markGoogleStatisticSynced(dataset, record.id!)
		}
	})

	syncQueues.set(dataset.id, operation.catch(() => undefined))
	return operation
}
