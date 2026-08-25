import type { AstroCookies } from "astro"
import {
	createSessionCookie,
	hasValidSession,
	isPasswordConfigured,
	isSameOrigin,
	passwordMatches,
	sessionCookie,
} from "./auth"
import type { StatisticsDataset } from "./datasets"
import { listGroupMeetings, type GroupMeeting, type MeetingFormat } from "./meetings"
import { inputFromForm, validateRecord, type RecordInput } from "./records"
import { appendStoredStatistic, listStoredStatistics, type StoredGroupStatistic } from "./storage"
import { syncPendingGoogleStatistics } from "./sync"

export interface PageContext {
	request: Request
	cookies: AstroCookies
	url: URL
}

interface AuthOutcome {
	authenticated: boolean
	loginError: string
	status?: number
	redirectTo?: string
	form?: FormData
}

function moscowToday(): string {
	return new Intl.DateTimeFormat("sv-SE", {
		timeZone: "Europe/Moscow",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(new Date())
}

function issueSession(dataset: StatisticsDataset, context: PageContext): void {
	const cookie = sessionCookie(dataset)
	context.cookies.set(cookie.name, createSessionCookie(dataset), {
		httpOnly: true,
		secure: context.url.protocol === "https:",
		sameSite: "strict",
		path: cookie.path,
		maxAge: cookie.maxAge,
	})
}

/**
 * Shared gate for both endpoints: validates the session, handles the login POST
 * and hands any other POST body back to the caller.
 */
async function authenticate(
	dataset: StatisticsDataset,
	context: PageContext,
	redirectAfterLogin: string,
): Promise<AuthOutcome> {
	const cookie = sessionCookie(dataset)
	const authenticated = hasValidSession(dataset, context.cookies.get(cookie.name)?.value)

	if (!isPasswordConfigured()) {
		return { authenticated: false, loginError: "Доступ ещё не настроен администратором сайта.", status: 503 }
	}
	if (context.request.method !== "POST") return { authenticated, loginError: "" }
	if (!isSameOrigin(context.request, context.url)) {
		return {
			authenticated,
			loginError: "Запрос отклонён. Обновите страницу и попробуйте снова.",
			status: 403,
		}
	}

	const form = await context.request.formData()
	if (String(form.get("action") ?? "") !== "login") {
		return { authenticated, loginError: "", form }
	}
	if (!passwordMatches(String(form.get("password") ?? ""))) {
		return { authenticated, loginError: "Неверный пароль.", status: 401 }
	}

	issueSession(dataset, context)
	return { authenticated: true, loginError: "", redirectTo: redirectAfterLogin }
}

export interface DisplayRecord extends StoredGroupStatistic {
	/** YYYYMMDD, so the table can sort lexicographically. */
	sortKey: string
	format: MeetingFormat | "unknown"
}

export interface RecordsPageState {
	status?: number
	redirectTo?: string
	authenticated: boolean
	loginError: string
	records: DisplayRecord[]
	groupNames: string[]
	loadError: string
	syncWarning: string
}

function sortKey(date: string): string {
	const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(date.trim())
	return match ? `${match[3]}${match[2]}${match[1]}` : "00000000"
}

export async function loadRecordsPage(
	dataset: StatisticsDataset,
	context: PageContext,
): Promise<RecordsPageState> {
	const auth = await authenticate(dataset, context, dataset.basePath)
	const state: RecordsPageState = {
		status: auth.status,
		redirectTo: auth.redirectTo,
		authenticated: auth.authenticated,
		loginError: auth.loginError,
		records: [],
		groupNames: [],
		loadError: "",
		syncWarning: "",
	}
	if (!state.authenticated || state.redirectTo) return state

	if (dataset.syncsWithGoogle) {
		try {
			await syncPendingGoogleStatistics(dataset)
		} catch (error) {
			console.error("Failed to sync pending group statistics with Google", error)
			state.syncWarning =
				"Некоторые записи ещё не синхронизированы с Google. Повторим автоматически."
		}
	}

	try {
		const formats = new Map(
			(await listGroupMeetings()).map(meeting => [meeting.name, meeting.format] as const),
		)
		state.records = (await listStoredStatistics(dataset)).reverse().map(record => ({
			...record,
			sortKey: sortKey(record.date),
			// Records for groups that have since left /groups keep an unknown format.
			format: formats.get(record.groupName.trim()) ?? "unknown",
		}))
		state.groupNames = [...new Set(state.records.map(record => record.groupName))].sort((a, b) =>
			a.localeCompare(b, "ru"),
		)
	} catch (error) {
		console.error("Failed to read stored group statistics", error)
		state.status = 502
		state.loadError = "Не удалось загрузить записи. Попробуйте обновить страницу позже."
	}
	return state
}

export interface FormPageState {
	status?: number
	redirectTo?: string
	authenticated: boolean
	loginError: string
	saveError: string
	values: RecordInput
	meetings: GroupMeeting[]
	/** Names already used on this dataset, offered as autocomplete suggestions. */
	knownGroupNames: string[]
	saved: "both" | "local" | null
}

export async function handleFormPage(
	dataset: StatisticsDataset,
	context: PageContext,
): Promise<FormPageState> {
	const meetings = await listGroupMeetings()
	const groupNames = meetings.map(meeting => meeting.name)
	const newPath = `${dataset.basePath}/new`
	const auth = await authenticate(dataset, context, newPath)

	const state: FormPageState = {
		status: auth.status,
		redirectTo: auth.redirectTo,
		authenticated: auth.authenticated,
		loginError: auth.loginError,
		saveError: "",
		values: {
			groupName: "",
			date: moscowToday(),
			participantCount: "",
			newcomerCount: "0",
			user: "",
			additionalInfo: "",
		},
		meetings,
		knownGroupNames: [],
		saved: null,
	}
	if (state.redirectTo) return state

	if (state.authenticated && !dataset.restrictToGroups) {
		try {
			const stored = await listStoredStatistics(dataset)
			state.knownGroupNames = [...new Set(stored.map(record => record.groupName))].sort((a, b) =>
				a.localeCompare(b, "ru"),
			)
		} catch (error) {
			console.error("Failed to read known group names", error)
		}
	}

	const saved = context.url.searchParams.get("saved")
	if (saved === "both" || saved === "local") state.saved = saved

	const form = auth.form
	if (!form || String(form.get("action") ?? "") !== "create") return state

	if (!state.authenticated) {
		state.status = 401
		state.loginError = "Сессия завершилась. Введите пароль ещё раз."
		return state
	}

	state.values = inputFromForm(form)
	const validation = validateRecord(state.values)
	if (dataset.restrictToGroups && !groupNames.includes(state.values.groupName)) {
		validation.errors.push("Выберите группу из списка действующих групп.")
	}
	if (validation.errors.length || !validation.value) {
		state.status = 400
		state.saveError = validation.errors.join(" ")
		return state
	}

	try {
		await appendStoredStatistic(dataset, validation.value)
	} catch (error) {
		console.error("Failed to store group statistic", error)
		state.status = 502
		state.saveError = "Не удалось сохранить запись. Данные оставлены в форме — попробуйте ещё раз."
		return state
	}

	if (!dataset.syncsWithGoogle) {
		state.redirectTo = `${newPath}?saved=both`
		return state
	}

	try {
		await syncPendingGoogleStatistics(dataset)
		state.redirectTo = `${newPath}?saved=both`
	} catch (error) {
		console.error("Failed to sync group statistics with Google", error)
		state.redirectTo = `${newPath}?saved=local`
	}
	return state
}
