import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import solid from "@astrojs/solid-js";
import keystatic from "@keystatic/astro";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import { defineConfig } from "astro/config";

import node from "@astrojs/node";

import react from "@astrojs/react";

export default defineConfig({
    site: "https://www.internetaddicts.ru/",
	// Nginx terminates HTTPS, so Astro's built-in Origin comparison sees the
	// internal URL and rejects legitimate form POSTs. Protected forms use a
	// signed SameSite=Strict session cookie and Sec-Fetch-Site validation.
	security: {
		checkOrigin: false,
	},
    prefetch: {
        defaultStrategy: "viewport",
    },
    integrations: [solid(), mdx(), sitemap(), icon(), keystatic({ configPath: "./config/keystatic.config.ts" }), react()],
    vite: {
        plugins: [tailwindcss()],
    },
    // Astro 5: hybrid убран — static + adapter даёт те же смешанные SSR/prerender страницы
    output: "static",
    adapter: node({ mode: "standalone" }),
});
