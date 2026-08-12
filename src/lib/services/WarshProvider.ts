import { globalState } from '$lib/runes/main.svelte';

let versesCache: Record<string, string> | null = null;
let loadingPromise: Promise<Record<string, string>> | null = null;

/** Loads the bundled Warsh (Nafi') verse text once. */
async function loadVerses(): Promise<Record<string, string>> {
	if (versesCache) return versesCache;
	if (loadingPromise) return loadingPromise;
	loadingPromise = fetch('/warsh/verses.json')
		.then(async (response) => {
			if (!response.ok) throw new Error(`Failed to load Warsh verses: ${response.status}`);
			versesCache = (await response.json()) as Record<string, string>;
			globalState.updateVideoPreviewUI();
			return versesCache;
		})
		.finally(() => {
			loadingPromise = null;
		});
	return loadingPromise;
}

export class WarshProvider {
	/** Preloads the Warsh text before a synchronous export. */
	static async prefetch(): Promise<void> {
		await loadVerses();
	}

	/** Returns the requested Warsh word range, or the complete ayah if the word split differs. */
	static getVerseSlice(surah: number, verse: number, startWordIndex: number, endWordIndex: number): string | null {
		if (!versesCache) {
			void loadVerses();
			return null;
		}
		const text = versesCache[`${surah}:${verse}`];
		if (!text) return null;
		const words = text.split(/\s+/).filter(Boolean);
		if (startWordIndex < 0 || endWordIndex >= words.length || startWordIndex > endWordIndex) return text;
		return words.slice(startWordIndex, endWordIndex + 1).join(' ');
	}
}

export default WarshProvider;
