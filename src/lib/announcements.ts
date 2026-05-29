export const ANNOUNCEMENT_DISMISS_PREFIX = "aiz:announcement-dismissed:"

export function announcementDismissKey(id: string): string {
	return `${ANNOUNCEMENT_DISMISS_PREFIX}${id}`
}

export function isAnnouncementDismissed(id: string): boolean {
	if (typeof localStorage === "undefined") return false
	return localStorage.getItem(announcementDismissKey(id)) === "1"
}

export function dismissAnnouncement(id: string): void {
	localStorage.setItem(announcementDismissKey(id), "1")
}
