import { createSignal, onCleanup, onMount } from "solid-js"
import { readBookmarks } from "@/lib/bookmarks"

type BookmarksCounterProps = {
	mobile?: boolean
	active?: boolean
}

export default function BookmarksCounter(props: BookmarksCounterProps) {
	const [count, setCount] = createSignal(0)

	const sync = () => {
		setCount(readBookmarks().length)
	}

	onMount(() => {
		sync()
		window.addEventListener("storage", sync)
		window.addEventListener("aiz:bookmarks-changed", sync)
		onCleanup(() => {
			window.removeEventListener("storage", sync)
			window.removeEventListener("aiz:bookmarks-changed", sync)
		})
	})

	return (
		<a
			href="/bookmarks"
			class={`inline-flex items-center gap-2 text-base transition ${
				props.mobile
					? `w-full justify-between rounded-xl border px-3 py-3 font-medium ${
							props.active
								? "border-stone-300 bg-stone-200 font-semibold text-stone-950"
								: "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100"
						}`
					: `rounded-lg px-3 py-2 ${
							props.active
								? "bg-stone-50 font-semibold text-stone-900 ring-1 ring-stone-300"
								: "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
						}`
			}`}
			aria-label="Закладки"
			aria-current={props.active ? "page" : undefined}
		>
			<span>Закладки</span>
			<span class="rounded-full bg-stone-700 px-2 py-0.5 text-xs text-white">{count()}</span>
		</a>
	)
}
