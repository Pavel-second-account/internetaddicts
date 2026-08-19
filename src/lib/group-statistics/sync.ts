import { appendGroupStatisticToGoogle } from "./sheets"
import { listPendingGoogleStatistics, markGoogleStatisticSynced } from "./storage"

let syncQueue: Promise<void> = Promise.resolve()

export async function syncPendingGoogleStatistics(): Promise<void> {
	const operation = syncQueue.then(async () => {
		const pending = await listPendingGoogleStatistics()
		for (const record of pending) {
			await appendGroupStatisticToGoogle(record)
			await markGoogleStatisticSynced(record.id!)
		}
	})

	syncQueue = operation.catch(() => undefined)
	return operation
}
