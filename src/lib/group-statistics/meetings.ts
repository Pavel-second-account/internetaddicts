import { getCollection } from "astro:content"

const dayOrder: Record<string, number> = {
	Понедельник: 1,
	Вторник: 2,
	Среда: 3,
	Четверг: 4,
	Пятница: 5,
	Суббота: 6,
	Воскресенье: 7,
}

export type MeetingFormat = "online" | "offline"

export interface GroupMeeting {
	name: string
	day: string
	time: string
	format: MeetingFormat
}

/** The collection stores a free-form label; only "Онлайн" means a remote meeting. */
export function meetingFormat(type: string): MeetingFormat {
	return type.trim().toLowerCase() === "онлайн" ? "online" : "offline"
}

export async function listGroupMeetings(): Promise<GroupMeeting[]> {
	const groups = await getCollection("groups")
	return groups
		.map(group => ({
			name: `${group.data.title.trim()} — ${group.data.when}${group.data.dateTime ? `, ${group.data.dateTime}` : ""}`,
			day: group.data.when,
			time: group.data.dateTime ?? "",
			format: meetingFormat(group.data.type),
		}))
		.sort(
			(a, b) =>
				(dayOrder[a.day] ?? 99) - (dayOrder[b.day] ?? 99) ||
				a.time.localeCompare(b.time, "ru") ||
				a.name.localeCompare(b.name, "ru"),
		)
}
