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
		id: "picnic-june-2026-v2",
		enabled: true,
		activeUntil: "2026-06-05",
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
	{
		id: "picnic-august-2026",
		enabled: true,
		activeUntil: "2026-08-15",
		title: "Пикник АИЗ 2026 — 16 августа, воскресенье",
		lead:
			"Давайте выйдем за пределы квартиры и развиртулизируемся с теми, с кем пересекались на онлайн-собраниях, обменивались ситуациями и ОС, спорили на рабочих собраниях. Даже если для этого придётся купить билет из другого города. Нам, контент-зависимым, полезно увидеть друг друга в 3D и задружиться.",
		where:
			"Один из центральных парков Москвы с удобным доступом и магазином рядом",
		when: "Воскресенье, 16 августа. Обычно пикник длится 3–4 часа",
		bullets: [
			"Вкусняшки",
			"Вид на гладь Москвы-реки",
			"Контакт с собой, друг с другом, с природой и городом",
			"Молитва, спикерские и, возможно, другие программные придумки — насколько их удобно реализовать на природе",
			"Рассказы о том, что происходит в сообществе",
			"Анонимные фотки — вам на память"
		],
		ctaLabel: "Подписаться на новости пикника",
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
