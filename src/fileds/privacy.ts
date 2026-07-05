import { singleton, fields } from "@keystatic/core"

export const privacy = singleton({
	label: "Политика конфиденциальности",
	path: "src/data/page/privacy",
	// Keystatic saves as privacy.mdx (flat file)
	entryLayout: "content",
	format: {
		contentField: "content",
	},
	schema: {
		content: fields.mdx({
			label: "Текст политики",
		}),
	},
})
