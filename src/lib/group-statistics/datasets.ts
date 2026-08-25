export type StatisticsDatasetId = "main" | "aki"

export interface StatisticsDataset {
	id: StatisticsDatasetId
	/** URL prefix of the endpoint. Also scopes the session cookie. */
	basePath: string
	title: string
	description: string
	heading: string
	cookieName: string
	dataFileEnv: string
	productionDataFile: string
	developmentDataFile: string
	exportFilePrefix: string
	/** Only the main dataset mirrors its records into the Google spreadsheet. */
	syncsWithGoogle: boolean
	/**
	 * The main endpoint only accepts meetings listed in /groups. АКИ groups live
	 * outside that collection, so its endpoint takes a free-form name.
	 */
	restrictToGroups: boolean
}

export const MAIN_DATASET: StatisticsDataset = {
	id: "main",
	basePath: "/group-statistics",
	title: "Статистика групп",
	description: "Внесённая статистика собраний АИЗ",
	heading: "Статистика групп",
	cookieName: "aiz_group_statistics_session",
	dataFileEnv: "AIZ_STATS_DATA_FILE",
	productionDataFile: "/opt/internetaddicts/shared/group-statistics.json",
	developmentDataFile: "./data/group-statistics.json",
	exportFilePrefix: "group-statistics",
	syncsWithGoogle: true,
	restrictToGroups: true,
}

export const AKI_DATASET: StatisticsDataset = {
	id: "aki",
	basePath: "/group-statistics-aki",
	title: "Статистика групп АКИ",
	description: "Внесённая статистика собраний АКИ",
	heading: "Статистика групп АКИ",
	cookieName: "aiz_group_statistics_aki_session",
	dataFileEnv: "AIZ_STATS_AKI_DATA_FILE",
	productionDataFile: "/opt/internetaddicts/shared/group-statistics-aki.json",
	developmentDataFile: "./data/group-statistics-aki.json",
	exportFilePrefix: "group-statistics-aki",
	syncsWithGoogle: false,
	restrictToGroups: false,
}
