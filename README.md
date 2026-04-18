# Анонимные Интернет Зависимые (СНГ)

Сайт сообщества АИЗ. Код и контент — в [`src/`](src/).

## Стек

| | |
|---|---|
| **Фреймворк** | [Astro](https://astro.build/) 3, `hybrid` (SSG + серверные маршруты) |
| **Контент** | [Content Collections](https://docs.astro.build/en/guides/content-collections/) — посты, группы, истории; [Markdoc](https://markdoc.dev/) (`.mdoc`) |
| **CMS** | [Keystatic](https://keystatic.com/) — `/keystatic` |
| **UI** | [Tailwind CSS](https://tailwindcss.com/), стили в `src/css/`, [AOS](https://michalsnik.github.io/aos/) |
| **Прочее** | React, MDX, Partytown (аналитика), RSS, sitemap |
| **Деплой** | [Netlify](https://www.netlify.com/) (`@astrojs/netlify`) |

## Разработка

```bash
npm install
npm run dev
```

- Сайт: <http://127.0.0.1:4321> (`dev` слушает `127.0.0.1`)
- Keystatic: <http://127.0.0.1:4321/keystatic>

Сборка: `npm run build` · превью: `npm run preview`.
