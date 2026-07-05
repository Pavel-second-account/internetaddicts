import { collections } from "@/fileds"
import { privacy } from "@/fileds/privacy"
import { config } from "@keystatic/core";

const isProd = import.meta.env.PROD;

export default config({
	storage: isProd
		? {
				kind: "cloud",
			}
		: {
				kind: "local",
			},
	cloud: {
		project: "aiz-site-2/internetaddicts",
	},
	collections,
	singletons: {
		privacy,
	},
});
