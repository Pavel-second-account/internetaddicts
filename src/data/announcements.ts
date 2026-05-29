import type { ImageMetadata } from "astro"
import picnicImage from "@/assets/images/events/picnik.png"

export type SiteAnnouncement = {

	id: string
	enabled: boolean
	activeUntil: string
	title: string
	lead?: string
	bullets: string[]
	ctaLabel: string
	ctaHref: string
	image: ImageMetadata
	imageAlt?: string
}


export const siteAnnouncements: SiteAnnouncement[] = [
	{
		id: "picnic-june-2026",
		enabled: true,
		activeUntil: "2026-07-05",
		title: "Околопрограммное мероприятие АИЗ в июне",
		lead: "Устраиваем в Москве очередной пикник-развиртуализацию",
		bullets: [
			"Природа",
			"Вкусняшки",
			"Живое человеческое общение",
			"Настолки, спикерские, двусторонняя молитва + предлагайте своё",
		],
		ctaLabel: "В чат мероприятия",
		ctaHref: "https://t.me/+ombh8xnB9csyMmQy",
		image: picnicImage,
		imageAlt: "Пикник АИЗ",
	},
]

export function getActiveAnnouncements(now = new Date()): SiteAnnouncement[] {
	return siteAnnouncements.filter(a => {
		if (!a.enabled) return false
		const end = new Date(`${a.activeUntil}T23:59:59`)
		return now <= end
	})
}
