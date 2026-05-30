import type { ImageMetadata } from "astro"
import picnicImage from "@/assets/images/events/picnik.png"

export type SiteAnnouncement = {

	id: string
	enabled: boolean
	activeUntil: string
	title: string
	lead?: string
	where?: string
	when?: string
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
		title: "Традиционный летний Пикник АИЗ пройдет в Москве уже 7 июня",
		where:
			"Парк Фили на набережной Москвы-реки, 10 минут пешком от м.Филевский Парк",
		when: "Воскресенье 7 июня с 14.00 и до упора",
		bullets: [
			"Природа",
			"Вкусняшки",
			"Живое человеческое общение",
			"Настолки, спикерские, двусторонняя молитва",
			"По желанию можно провести спикерские, мастер-классы, игры"
		],
		ctaLabel: "Инструкции как пройти и другая оргинформация в чате",
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
