import "./font-selector.ts"
import { GetExpireStore, GetInstantStore } from "./modules/Cache.ts";

const instantStore = GetInstantStore(
  `Lyrprep/InstantStore`,
  1,
  {
    SK_Store: "",
    settings: {
      removeTimestamps: true,
      handleDashes: true,
      handleParentheses: true,
      addSpaces: true,
      splitCJK: true,
      removeEmptyLines: true,
      theme: 'system',
      seasonalTheme: true,
    },
    lastLyrics: "",
  }
);

const cacheStore = GetExpireStore(
	"Lyprep/ExpireStore",
	1,
	{
		Duration: 1,
		Unit: "Hours"
	}
)

// DOM Elements
const inputText = document.querySelector('.input-text') as HTMLTextAreaElement | HTMLInputElement;
const outputText = document.querySelector('.output-text') as HTMLTextAreaElement | HTMLInputElement;
const convertBtn = document.querySelector('.convert-btn') as HTMLButtonElement;
const clearInputBtn = document.querySelector('.clear-input') as HTMLButtonElement;
const copyOutputBtn = document.querySelector('.copy-output') as HTMLButtonElement;
const settingsBtn = document.querySelector('.settings-btn') as HTMLButtonElement;
const closeSettingsBtn = document.querySelector('.close-settings') as HTMLButtonElement;
const settingsPanel = document.querySelector('.settings-panel') as HTMLElement;
const themeToggle = document.querySelector('.dark-theme-toggle') as HTMLInputElement;
const seasonalThemeToggle = document.querySelector('.seasonal-theme-toggle') as HTMLInputElement;
const realtimeToggle = document.querySelector('#realtime-toggle') as HTMLInputElement;
const toast = document.querySelector('.toast') as HTMLElement;
const overlay = document.querySelector('.overlay') as HTMLElement;
const searchBtn = document.querySelector('.search-lyrics') as HTMLButtonElement;
const searchModal = document.querySelector('.search-modal') as HTMLElement;
const closeSearchBtn = document.querySelector('.close-search') as HTMLButtonElement;
const searchForm = document.querySelector('.search-form') as HTMLFormElement;
const searchResults = document.querySelector('.search-results') as HTMLElement;
const searchTrackInput = document.querySelector('.search-track') as HTMLInputElement;
const searchArtistInput = document.querySelector('.search-artist') as HTMLInputElement;
const searchAlbumInput = document.querySelector('.search-album') as HTMLInputElement;
//const swapProvidersButton = document.querySelector('.swapProvidersButton');

const searchSpotifyUri = document.querySelector('.search-spotify-url') as HTMLInputElement;
const initLoaderModal = document.querySelector(".main__init-Loader") as HTMLElement;

const initLoaderTitle = initLoaderModal.querySelector<HTMLElement>(".main__init-Loader-Content .main__init-Loader-Title");

// const searchModalBtn = document.querySelector('.search-btn') as HTMLButtonElement;


// Removed unused waitUntil helper to satisfy noUnusedLocals

// Config
const spicyLyricsApiUrlBase = `https://api.spicylyrics.org/lyrprep`;
//const spicyLyricsApiUrlBase = `http://localhost:3001/lyrprep`;
// Version embedded in saved payloads (not the IndexedDB schema version)
// const CURRENT_STORE_VERSION = 1;

// Settings state
// const settings = {
// 	removeTimestamps: true,
// 	handleDashes: true,
// 	handleParentheses: true,
// 	addSpaces: true,
// 	splitCJK: true,
// 	removeEmptyLines: true,
// 	theme: 'system',
// 	seasonalTheme: true,
// };

let currentHCaptchaWidget: number | null = null;

let currentHCaptchaToken: string | null = null;
// Keep key for future use if needed (not currently used)
// let currentHCaptchaKey: number | null = null;

let hCaptchaSiteKey: string | null = null;
let hCaptchaLoaded = false;

let siteKeyRetries = 0;
const siteKeyRetryDelay = 1000;
const siteKeyMaxRetries = 10;

let shouldRenderHCaptcha = false;
let isAwaitingHCaptcha = false;


/* async function initSitekey() {
    if (hCaptchaSiteKey != null) return;

    if (!navigator.onLine) {
        const savedSK = instantStore.Items.SK_Store;
        if (savedSK) {
            hCaptchaSiteKey = savedSK;
			siteKeyRetries = 0;

			if (initLoaderTitle) initLoaderTitle.innerHTML = `Done!`;
			if (typeof overlay !== 'undefined' && typeof initLoaderModal !== undefined) {
				if (!searchModal.classList.contains("active") && !settingsPanel.classList.contains("active")) overlay.classList.remove("active");
				initLoaderModal.classList.remove("active");
			}
        }
        return;
    }

    if (siteKeyRetries > siteKeyMaxRetries) {
		console.error("error while getting hCaptcha sitekey");
		showToast("Error while getting the hCaptcha siteKey, try reloading");
		return;
	}
	
	try {
        const siteKeyResponse = await fetch(`${spicyLyricsApiUrlBase}/sk`);

        if (!siteKeyResponse.ok) {
            throw new Error("error while getting hCaptcha sitekey");
        }

        const siteKeyData = await siteKeyResponse.text();
        const siteKey = siteKeyData.split("\x1e").join("-");

        hCaptchaSiteKey = siteKey;
        instantStore.Items.SK_Store = siteKey;
        instantStore.SaveChanges();
        siteKeyRetries = 0;

		if (initLoaderTitle) initLoaderTitle.innerHTML = `Done!`;
        if (typeof overlay !== 'undefined' && typeof initLoaderModal !== undefined) {
			if (!searchModal.classList.contains("active") && !settingsPanel.classList.contains("active")) overlay.classList.remove("active");
			initLoaderModal.classList.remove("active");
		}
    } catch (error) {
        await new Promise((r) => setTimeout(r, siteKeyRetryDelay));
        siteKeyRetries++;
        initSitekey();
    }
} */


const hCaptchaCallbacks = {
	onSolve: (token: string) => {
		 console.log('hCaptcha solved successfully');
		currentHCaptchaToken = token;
		// currentHCaptchaKey = key;
		// Auto-resume SL search if applicable
		try {
			const modalIsActive = searchModal && searchModal.classList.contains('active');
			const spicyActive = searchForm && searchForm.classList.contains('spicylyrics');
			if (modalIsActive && spicyActive) {
				shouldRenderHCaptcha = false;
				isAwaitingHCaptcha = false;
				searchLyrics();
			}
		} catch (_) {}
	},
	onError: (err: unknown) => {
		console.error('hCaptcha error callback:', err);
		showToast("hCaptcha callback error, check console for more info")
		resetHCaptcha();
	},
	onExpired: () => {
		console.warn('hCaptcha token expired');
		showToast("hCaptcha token expired, refresh page")
		resetHCaptcha();
	}
}

/* window.onloadHCaptcha = async () => {
	hCaptchaLoaded = true;
	console.log("hCaptcha loaded!")
	ensureHCaptchaRendered();
} */

function ensureHCaptchaRendered() {
	try {
		const container = document.querySelector('#sl-hcaptcha-content');
		const modalIsActive = searchModal && searchModal.classList.contains('active');
		const spicyActive = searchForm && searchForm.classList.contains('spicylyrics');
		if (!hCaptchaLoaded || !hCaptchaSiteKey || !container || !modalIsActive || !spicyActive || !shouldRenderHCaptcha) return;

		// Don't render twice into the same container
		if (container.childElementCount > 0 && currentHCaptchaWidget !== null) return;

		console.log("SiteKey", "cbe4a368-ada0-43b6-8470-d3f0f5d21214")

		currentHCaptchaWidget = hcaptcha.render(container, {
			sitekey: "cbe4a368-ada0-43b6-8470-d3f0f5d21214",
			callback: (token: string) => hCaptchaCallbacks.onSolve(token),
			'expired-callback': () => hCaptchaCallbacks.onExpired(),
			'error-callback': (err: unknown) => hCaptchaCallbacks.onError(err),
		});
	} catch (err) {
		console.error('Failed to render hCaptcha:', err);
	}
}

function resetHCaptcha() {
	try {
		if (typeof hcaptcha !== 'undefined' && currentHCaptchaWidget !== null) {
			hcaptcha.reset(currentHCaptchaWidget);
		}
	} catch (e) {
		console.warn('resetHCaptcha encountered an error:', e);
	} finally {
		// currentHCaptchaKey = null;
		currentHCaptchaToken = null;
	}
}

function cleanupHCaptcha() {
	try {
		const container = document.querySelector('.sl-hcaptcha-content');
		if (typeof hcaptcha !== 'undefined' && currentHCaptchaWidget !== null) {
			try { hcaptcha.remove(currentHCaptchaWidget); } catch (e) {
				try { hcaptcha.reset(currentHCaptchaWidget); } catch (_) {}
			}
		}
		if (container) container.innerHTML = '';
	} catch (e) {
		console.warn('cleanupHCaptcha encountered an error:', e);
	} finally {
		// currentHCaptchaKey = null;
		currentHCaptchaToken = null;
		currentHCaptchaWidget = null;
		shouldRenderHCaptcha = false;
		// Re-enable the submit button if it was disabled for captcha
		try {
			const submitBtn = document.querySelector('.search-btn') as HTMLButtonElement | null;
			if (submitBtn) submitBtn.removeAttribute('disabled');
		} catch (_) {}
	}
}

// Search Providers
const searchProviders = [
	{
		element: document.querySelector(".providersTab .sl"),
		name: "spicylyrics"
	},
	{
		element: document.querySelector(".providersTab .lrclib"),
		name: "lrclib"
	}
]

// Initialize the app
async function init() {
	// Set initial theme
	await setInitialTheme();

	//await initSitekey();

	// Load settings from storage
	await loadSettings();
	
	// Set up event listeners
	setupEventListeners();

	// Ensure only visible provider fields are validated
	updateSearchProviderFields();

	// Set initial state of toggles
	updateTogglesFromSettings();

	{
		if (initLoaderTitle) initLoaderTitle.innerHTML = `Done!`;
		if (typeof overlay !== 'undefined' && typeof initLoaderModal !== undefined) {
			if (!searchModal.classList.contains("active") && !settingsPanel.classList.contains("active")) overlay.classList.remove("active");
			initLoaderModal.classList.remove("active");
		}

		setTimeout(() => {
			const spinner = initLoaderModal.querySelector<HTMLElement>(".main__init-Loader-Content .spinning-loader");
			if (spinner) {
				spinner.classList.remove("activeAnimation");
			}
		}, 1000);
	}
}

// Set up event listeners
function setupEventListeners() {
	// Convert button click
	convertBtn.addEventListener('click', convertText);
	
	searchProviders.forEach(provider => {
		const el = provider.element as HTMLElement | null;
		if (!el) return;
		el.addEventListener("click", () => {
			if (el.classList.contains("active")) return;

			// Remove active class from all providers
			searchProviders.forEach(p => p.element && p.element.classList.remove("active"));
			
			// Add active class to clicked provider
			el.classList.add("active");

			swapLyricsProviders();
		})
	})



	// Clear input button
	clearInputBtn.addEventListener('click', () => {
		inputText.value = '';
		outputText.value = '';
		inputText.focus();
		clearSavedTextLyrics();
	});
	
	// Copy output button
	copyOutputBtn.addEventListener('click', copyToClipboard);
	
	// Settings button
	settingsBtn.addEventListener('click', toggleSettings);
	closeSettingsBtn.addEventListener('click', toggleSettings);
	
	// Search button
	searchBtn.addEventListener('click', toggleSearchModal);
	closeSearchBtn.addEventListener('click', toggleSearchModal);
	
	// Close modals when clicking outside
	overlay.addEventListener('click', () => {
		if (settingsPanel.classList.contains('active')) toggleSettings();
		if (searchModal.classList.contains('active')) toggleSearchModal();
	});
	
	// Real-time conversion
	inputText.addEventListener('input', () => {
		if (realtimeToggle.checked) {
			convertText();
		}
	});
	
	// Settings toggles
	(document.querySelector('.option-remove-timestamps') as HTMLInputElement).addEventListener('change', updateSettings);
	(document.querySelector('.option-handle-dashes') as HTMLInputElement).addEventListener('change', updateSettings);
	(document.querySelector('.option-handle-parentheses') as HTMLInputElement).addEventListener('change', updateSettings);
	(document.querySelector('.option-add-spaces') as HTMLInputElement).addEventListener('change', updateSettings);
	(document.querySelector('.option-split-cjk') as HTMLInputElement).addEventListener('change', updateSettings);
	(document.querySelector('.option-remove-empty-lines') as HTMLInputElement).addEventListener('change', updateSettings);
	
	// Theme toggle
	themeToggle.addEventListener('change', toggleTheme);
	seasonalThemeToggle.addEventListener('change', toggleSeasonalTheme);
	
	// Search form submission
	searchForm.addEventListener('submit', (e) => {
		e.preventDefault();
		searchLyrics();
	});
	
	// Handle clicks on search results
	searchResults.addEventListener('click', (e) => {
		const target = e.target as HTMLElement | null;
		const resultItem = target?.closest('.search-result-item') as HTMLElement | null;
		if (resultItem) {
			const lyrics = resultItem.dataset.lyrics;
			if (lyrics) {
				inputText.value = lyrics;
				if (realtimeToggle.checked) convertText();
				toggleSearchModal();
			}
		}
	});
	
	// Close modals with Escape key
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			if (settingsPanel.classList.contains('active')) toggleSettings();
			if (searchModal.classList.contains('active')) toggleSearchModal();
		}
	});
}

// Set initial theme based on system preference
async function setInitialTheme() {
    // const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	let savedTheme;
	try { savedTheme = instantStore.Items.settings.theme; } catch (_) {}
	
	if (savedTheme) {
		instantStore.Items.settings.theme = savedTheme;
	} else {
		instantStore.Items.settings.theme = 'system';
	}

	let savedSeasonalTheme;
	try { savedSeasonalTheme = instantStore.Items.settings.seasonalTheme; } catch (_) {}
	
	if (savedTheme) {
		instantStore.Items.settings.seasonalTheme = savedSeasonalTheme ?? true;
	} else {
		instantStore.Items.settings.seasonalTheme = true;
	}
	
	applyTheme();
}

// Apply current theme
function applyTheme() {
	if (instantStore.Items.settings.theme === 'system') {
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
	} else {
		document.documentElement.setAttribute('data-theme', instantStore.Items.settings.theme);
	}
	
	// Update theme toggle
	if (themeToggle) {
		themeToggle.checked = document.documentElement.getAttribute('data-theme') === 'dark';
	}

	if (seasonalThemeToggle) {
		seasonalThemeToggle.checked = instantStore.Items.settings.seasonalTheme;
	}

	if (instantStore.Items.settings.seasonalTheme) {
		document.body.classList.add("theme-seasonal");
	} else {
		document.body.classList.remove("theme-seasonal");
	}
}

// Toggle between light and dark theme
async function toggleTheme() {
	if (themeToggle.checked) {
		instantStore.Items.settings.theme = 'dark';
	} else {
		instantStore.Items.settings.theme = 'light';
	}
	
	instantStore.SaveChanges();
	applyTheme();
}

async function toggleSeasonalTheme() {
	if (seasonalThemeToggle.checked) {
		instantStore.Items.settings.seasonalTheme = true;
	} else {
		instantStore.Items.settings.seasonalTheme = false;
	}
	
	instantStore.SaveChanges();
	applyTheme();
}

// Toggle settings panel
function toggleSettings() {
	settingsPanel.classList.toggle('active');
	overlay.classList.toggle('active');
	document.body.classList.toggle('no-scroll', settingsPanel.classList.contains('active'));
}

// Toggle search modal (open immediately; render hCaptcha lazily if needed)
async function toggleSearchModal() {
	overlay.classList.toggle('active');
	searchModal.classList.toggle('active');
	document.body.classList.toggle('no-scroll', searchModal.classList.contains('active'));
	
	if (searchModal.classList.contains('active')) {
		if (searchForm.classList.contains("lrclib")) {
			cleanupHCaptcha();
			searchTrackInput.focus();
		} else if (searchForm.classList.contains("spicylyrics")) {
			searchSpotifyUri.focus();
		}
	} else {
		cleanupHCaptcha();
	}

	isAwaitingHCaptcha = false;
}


// Search for lyrics using LRCLIB API
async function searchLyrics() {
	const currentProvider = searchForm.classList.contains("spicylyrics") ? "sl" : "lrclib";
	if (currentProvider === "lrclib") {
		const track = searchTrackInput.value.trim();
		const artist = searchArtistInput.value.trim();
		const album = searchAlbumInput.value.trim();
		
		if (!track) {
			showToast('Please enter a track name');
			return;
		}
		
		try {
			showLoadingState(true);
			
			let url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(track)}`;
			if (artist) {
				url += `&artist_name=${encodeURIComponent(artist)}`;
			}
			if (album) {
				url += `&album_name=${encodeURIComponent(album)}`;
			}
			
			const response = await fetch(url);
			
			if (!response.ok) {
				throw new Error('Failed to fetch lyrics (from the LRCLIB API)');
			}
			
			const results: Array<{ plainLyrics?: string; trackName?: string; artistName?: string; albumName?: string; duration?: number }> = await response.json();
			
			if (results.length === 0) {
				showToast('No results found');
				searchResults.innerHTML = '<div class="no-results">No results found. Try a different search term.</div>';
				return;
			}
			
			displaySearchResults(results);
		} catch (error) {
			console.error('Error searching for lyrics:', error);
			showToast('Error searching for lyrics');
			searchResults.innerHTML = '<div class="error">Error loading results. Please try again later.</div>';
		} finally {
			showLoadingState(false);
		}
	} else if (currentProvider === "sl") {
		// Hard block: if awaiting captcha, do not proceed even if user force-enables the button
		if (isAwaitingHCaptcha) {
			return;
		}
		const parseLyrics = (lyrics: string) => lyrics.split("\x1e").join("\n");

		const lyricsContinue = (lyrics: string) => {
			inputText.value = lyrics;
			searchSpotifyUri.value = "";
			if (realtimeToggle.checked) convertText();
			toggleSearchModal();
		}

		const trackUrl = searchSpotifyUri.value.trim();
		let trackId;
		try {
			const urlObject = new URL(trackUrl);
			const urlPath = urlObject.pathname;
			const splitContent = urlPath.split("/");
			const id = splitContent[splitContent.length - 1];

			trackId = id;
		} catch (error) {
			trackId = trackUrl
		}

		if (trackId) {
			showLoadingState(true);

			const cachedContent = await cacheStore.GetItem(`lyrics:${trackId}`);

			// console.log("Cached Content", cachedContent);
			if (typeof cachedContent === "string" && cachedContent.length > 0) {
				// console.log("Cached Content - not undefined");
				const lyrics = parseLyrics(cachedContent);

				// console.log("Cached Parsed Lyrics", lyrics);
				if (lyrics !== undefined) {
					// console.log("Cached Lyrics - not undefined");
					lyricsContinue(lyrics);
					showLoadingState(false);
					return;
				};
			}

			if (!navigator.onLine) {
				showLoadingState(false);
				showToast("Lyrics aren't cached, and you're offline. Get back online to get lyrics for this song");
				return;
			};


			let skipCaptchaReset = false;
			try {
				const response = await fetch(`${spicyLyricsApiUrlBase}/lyrics`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						// Only include captcha if present; otherwise omit so server returns 400 when required
						captcha: currentHCaptchaToken ?? null,
						metadata: {
							trackId
						}
					}),
				})

				if (!response.ok) {
					// Only initiate hCaptcha after the API explicitly requires it (400)
					if (response.status === 400) {
						shouldRenderHCaptcha = true;
						isAwaitingHCaptcha = true;
						ensureHCaptchaRendered();
						// Disable the submit button until captcha is solved
						try {
							const submitBtn = document.querySelector('.search-btn') as HTMLButtonElement | null;
							if (submitBtn) submitBtn.setAttribute('disabled', 'true');
						} catch (_) {}
						// Do not reset captcha in finally; we just asked user to solve it
						skipCaptchaReset = true;
						return;
					}
					throw new Error('Failed to fetch lyrics (from the Spicy Lyrics API)');
				}

				const data = await response.text();

				if (!data) {
					showToast('No results found');
					return;
				}

				const lyrics = parseLyrics(data);

				await cacheStore.SetItem(`lyrics:${trackId}`, lyrics);

				lyricsContinue(lyrics);
			} catch (error) {
				console.error("Error happened while fetching the Spicy Lyrics API for Lyrics", error)
				showToast('Error searching for lyrics');
			} finally {
				showLoadingState(false);
				// If modal is still open (error/no results), reset so user can retry;
				// if closed (success), cleanup happens on close. When we just requested
				// captcha (400), do not reset it here.
				if (searchModal.classList.contains('active')) {
					if (!skipCaptchaReset) {
						resetHCaptcha();
					}
				} else {
					cleanupHCaptcha();
				}
			}
		}
	}
}

// Display search results
function displaySearchResults(results: Array<{ plainLyrics?: string; trackName?: string; artistName?: string; albumName?: string; duration?: number }>) {
	searchResults.innerHTML = results.slice(0, 10).map(result => `
		<div class="search-result-item" data-lyrics="${escapeHtml(result.plainLyrics || '')}">
			<div class="search-result-title">${escapeHtml(result.trackName || 'Unknown Track')}</div>
			<div class="search-result-artist">${escapeHtml(result.artistName || 'Unknown Artist')}</div>
			<div class="search-result-album">${escapeHtml(result.albumName || 'Unknown Album')}</div>
			<div class="search-result-duration">${formatDuration(result.duration || 0)}</div>
		</div>
	`).join('');
}

// Show/hide loading state
function showLoadingState(isLoading: boolean) {
	const searchBtn = document.querySelector('.search-btn');
	if (isLoading) {
		(searchBtn as HTMLButtonElement | null)?.setAttribute('disabled', 'true');
		if (searchBtn) (searchBtn as HTMLButtonElement).innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
	} else {
		(searchBtn as HTMLButtonElement | null)?.removeAttribute('disabled');
		if (searchBtn) (searchBtn as HTMLButtonElement).innerHTML = '<i class="fas fa-search"></i> Search';
	}
}

// Format duration in seconds to MM:SS
function formatDuration(seconds: number) {
	if (!seconds) return '';
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe: string) {
	if (!unsafe) return '';
	return unsafe
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

// Update settings from UI
async function updateSettings() {
	instantStore.Items.settings.removeTimestamps = (document.querySelector('.option-remove-timestamps') as HTMLInputElement).checked;
	instantStore.Items.settings.handleDashes = (document.querySelector('.option-handle-dashes') as HTMLInputElement).checked;
	instantStore.Items.settings.handleParentheses = (document.querySelector('.option-handle-parentheses') as HTMLInputElement).checked;
	instantStore.Items.settings.addSpaces = (document.querySelector('.option-add-spaces') as HTMLInputElement).checked;
	instantStore.Items.settings.splitCJK = (document.querySelector('.option-split-cjk') as HTMLInputElement).checked;
	instantStore.Items.settings.removeEmptyLines = (document.querySelector('.option-remove-empty-lines') as HTMLInputElement).checked;
	
	await saveSettings();
	
	if (realtimeToggle.checked) {
		convertText();
	}
}

// Save settings to localStorage
async function saveSettings() {
	instantStore.SaveChanges();
}

// Load settings from localStorage
async function loadSettings() {
	let savedSettings = instantStore.Items.settings;
	if (savedSettings && typeof savedSettings === 'object') {
		try { Object.assign(instantStore.Items.settings, savedSettings); } catch (_) {}
	}
	
	// Apply loaded settings to UI
	updateTogglesFromSettings();
}

// Update UI toggles from settings
function updateTogglesFromSettings() {
	(document.querySelector('.option-remove-timestamps') as HTMLInputElement).checked = instantStore.Items.settings.removeTimestamps;
	(document.querySelector('.option-handle-dashes') as HTMLInputElement).checked = instantStore.Items.settings.handleDashes;
	(document.querySelector('.option-handle-parentheses') as HTMLInputElement).checked = instantStore.Items.settings.handleParentheses;
	(document.querySelector('.option-add-spaces') as HTMLInputElement).checked = instantStore.Items.settings.addSpaces;
	(document.querySelector('.option-split-cjk') as HTMLInputElement).checked = instantStore.Items.settings.splitCJK;
	(document.querySelector('.option-remove-empty-lines') as HTMLInputElement).checked = instantStore.Items.settings.removeEmptyLines;
	
	// Set theme toggle
	if (themeToggle) {
		themeToggle.checked = document.documentElement.getAttribute('data-theme') === 'dark';
	}
}

// (removed unused removeEmptyLines helper)


let currentSaveTextTimeout: any = null;

async function clearSavedTextLyrics() {
	instantStore.Items.lastLyrics = "";
	instantStore.SaveChanges();
}

async function loadSavedTextLyrics() {
	const value = instantStore.Items.lastLyrics;
	if (value === undefined) return;
	const lyrics = value.split("\x1e").join("\n");
	if (lyrics === undefined) return;
	inputText.value = lyrics;
	convertText();
}

loadSavedTextLyrics();
loadSettings();

// Main conversion functio.
async function convertText() {
	try {
		let text = inputText.value;

		if (currentSaveTextTimeout) {
			clearTimeout(currentSaveTextTimeout);
			currentSaveTextTimeout = null;
		}

		currentSaveTextTimeout = setTimeout(() => {
			instantStore.Items.lastLyrics = (text !== "" ? text.split("\n").join("\x1e") : "");
			instantStore.SaveChanges();
		}, 200);

		if (!text.trim()) {
			outputText.value = '';
			return;
		}
		
		// Split into lines and process each one
		let lines = text.split('\n');
		let processedLines = [];

		
		for (let line of lines) {
			if (line.trim() === '') {
				// Preserve empty lines
				processedLines.push('');
			} else {
				// Process non-empty lines
				let processedLine = processLine(line);
				// Split by newlines and add all parts to processedLines
				const splitLines = processedLine.split('\n');
				for (const l of splitLines) {
					if (l.trim() !== '') {
						processedLines.push(l.trim());
					}
				}
			}
		}
		
		// Join with newlines
		outputText.value = processedLines.join('\n');
		
		// Remove empty lines if setting is enabled
		if (instantStore.Items.settings.removeEmptyLines) {
			outputText.value = outputText.value.split('\n').filter(line => line.trim() !== '').join('\n');
		}
		
		// If addSpaces is enabled, replace spaces with backslash-space-backslash
		if (instantStore.Items.settings.addSpaces) {
			outputText.value = outputText.value.replace(/ /g, '\\ \\');
		}
		
	} catch (error) {
		console.error('Error processing text:', error);
		showToast('Error processing text');
	}
}

// Check if a character is a CJK character (Chinese, Japanese, Korean)
function isCJKChar(ch: string): boolean {
    return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(ch);
}

// Process a single line of text
function processLine(line: string) {
	if (!line || typeof line !== 'string') return line || '';
	
	// If all processing options are off, return the line as is
	if (!instantStore.Items.settings.removeTimestamps && !instantStore.Items.settings.handleDashes && !instantStore.Items.settings.handleParentheses && !instantStore.Items.settings.splitCJK) {
		return line;
	}
	
	// Remove anything within square brackets if enabled
	if (instantStore.Items.settings.removeTimestamps) {
		line = line.replace(/\[.*?\]/g, '').trim();
	}

	let backgroundVocals = [];
	let inParen = false;
	let currentParen = '';
	let mainLine = '';
	
	function isAlphaNum(ch: string): boolean {
		return /[\p{L}\p{N}]/u.test(ch); // Unicode letters and digits
	  }
	  function shouldEscapeInlineHyphen(prev: string, next: string): boolean {
		return isAlphaNum(prev) && isAlphaNum(next);
	  }

	// First, extract all parenthetical content and build the main line
	for (let i = 0; i < line.length; i++) {
		// Handle parenthetical content if enabled
		if (instantStore.Items.settings.handleParentheses) {
			// Check for opening parentheses (both ASCII and CJK)
			const isOpeningParen = ['(', '（', '「', '『', '【', '〈', '《'].includes(line[i]);
			// Check for closing parentheses (both ASCII and CJK)
			const isClosingParen = [')', '）', '」', '』', '】', '〉', '》'].includes(line[i]);
			
			if (isOpeningParen && !inParen) {
				inParen = true;
				currentParen = '';
				continue;
			} else if (isClosingParen && inParen) {
				inParen = false;
				backgroundVocals.push(currentParen.trim());
				continue;
			} else if (inParen) {
				currentParen += line[i];
				continue;
			}
		}

		// Handle CJK character splitting if enabled
		if (instantStore.Items.settings.splitCJK) {
			const char = line[i];
			// Check if character is CJK and handle splitting if needed
			if (isCJKChar(char)) {
				// Check if next character is also CJK
				if (i + 1 < line.length && isCJKChar(line[i + 1])) {
					// Add backslash after CJK character if followed by another CJK character
					mainLine += char + '\\';
				} else {
					mainLine += char;
				}
				continue;
			}
		}

		// Handle dashes if enabled
		if (instantStore.Items.settings.handleDashes && line[i] === '-') {
			if (i + 1 < line.length) {
				const nextChar = line[i + 1];
				if (nextChar === ' ') {
					// Dash followed by space → em dash
					mainLine += '— ';
					i++; // Skip the space
				} else if (nextChar === '-') {
					// Double dash → em dash
					mainLine += '—';
					i++; // Skip the second dash
				} else if (i > 0 && shouldEscapeInlineHyphen(line[i - 1], nextChar)) {
					// Dash between letters/numbers → add backslash
					mainLine += '-\\';
				} else {
					// Single dash → em dash
					mainLine += '—';
				}
				continue;
			} else {
				// Dash at end of line → em dash
				mainLine += '—';
			}
		} else {
			mainLine += line[i];
		}
	}

	// Clean up the main line - handle spaces around words and commas
	mainLine = mainLine
		.replace(/\s*,\s*/g, ', ')  // Ensure single space after commas
		.replace(/\s+/g, ' ')       // Replace multiple spaces with single space
		.replace(/\s+,/g, ',')      // Remove spaces before commas
		.replace(/\s+(?=[,.;:!?])/g, '')        // Remove spaces before punctuation
		.trim();

	// Process background vocals if any
	let bgLine = '';
	if (backgroundVocals.length > 0) {
		bgLine = backgroundVocals.map(vocal => {
			let processedVocal = vocal;
			
			// Apply CJK splitting to background vocals if enabled
			if (instantStore.Items.settings.splitCJK) {
				let result = '';
				for (let i = 0; i < processedVocal.length; i++) {
					const char = processedVocal[i];
				
				result += char;
				
				// Add backslash after CJK character if followed by another CJK character
				if (isCJKChar(char) && i < processedVocal.length - 1) {
					const nextChar = processedVocal[i + 1];
					if (isCJKChar(nextChar)) {
							result += '\\';
						}
					}
				}
				processedVocal = result;
			}
			
			// Process dashes in background vocals if enabled
			if (instantStore.Items.settings.handleDashes) {
				let result = '';
				for (let i = 0; i < processedVocal.length; i++) {
					if (processedVocal[i] === '-') {
						if (i + 1 < processedVocal.length) {
							const nextChar = processedVocal[i + 1];
							if (nextChar === ' ') {
								result += '— ';
								i++; // Skip the space
							} else if (nextChar === '-') {
								result += '—';
								i++; // Skip the second dash
							} else if (i > 0 && shouldEscapeInlineHyphen(processedVocal[i - 1], nextChar)) {
								result += '-\\';
							} else {
								result += '—';
							}
						} else {
							result += '—';
						}
					} else {
						result += processedVocal[i];
					}
				}
				processedVocal = result;
			}
			
			return processedVocal.trim();
		}).join(', ');
		
		// Capitalize the first letter of the background vocals line
		if (bgLine.length > 0) {
			bgLine = bgLine.charAt(0).toUpperCase() + bgLine.slice(1);
		}
	}
	
	return bgLine ? (mainLine ? mainLine + '\n<' + bgLine : '<' + bgLine) : mainLine;
}

// ...
async function copyToClipboard() {
	try {
		await navigator.clipboard.writeText(outputText.value);
		showToast('Copied to clipboard!');
	} catch (err) {
		console.error('Failed to copy text: ', err);
		showToast('Failed to copy to clipboard');
	}
}

let toastInt: any = null;

// Show toast notification
function showToast(message: string, duration = 3000) {
	if (toastInt) {
		clearTimeout(toastInt);
		toastInt = null;
	}

	toast.textContent = message;
	toast.classList.add('show');
	
	// Hide after duration
	toastInt = setTimeout(() => {
		toast.classList.remove('show');
	}, duration);
}

function swapLyricsProviders() {
	if (searchForm.classList.contains("spicylyrics")) {
		searchForm.classList.remove("spicylyrics")
		searchForm.classList.add("lrclib")
	} else if (searchForm.classList.contains("lrclib")) {
		searchForm.classList.remove("lrclib")
		searchForm.classList.add("spicylyrics")
	}

	// Update which inputs are required/disabled based on active provider
	updateSearchProviderFields();

	// If modal open, render or cleanup depending on provider
	if (searchModal.classList.contains('active')) {
		if (searchForm.classList.contains('spicylyrics')) {
			if (shouldRenderHCaptcha) ensureHCaptchaRendered();
		} else {
			cleanupHCaptcha();
		}
	}

	isAwaitingHCaptcha = false;
}

// Enable/disable and toggle required for inputs based on active provider
function updateSearchProviderFields() {
	const isSpicyLyrics = searchForm.classList.contains('spicylyrics');

	// Spicy Lyrics provider active
	if (isSpicyLyrics) {
		// Enable Spotify URL and make it required
		if (searchSpotifyUri) {
			searchSpotifyUri.required = true;
		}

		// Disable LRCLIB fields and remove required
		if (searchTrackInput) {
			searchTrackInput.disabled = true;
			searchTrackInput.required = false;
		}
		if (searchArtistInput) {
			searchArtistInput.disabled = true;
			searchArtistInput.required = false;
		}
		if (searchAlbumInput) {
			searchAlbumInput.disabled = true;
			searchAlbumInput.required = false;
		}
	} else {
		// LRCLIB provider active
		if (searchSpotifyUri) {
			searchSpotifyUri.required = false;
		}

		if (searchTrackInput) {
			searchTrackInput.disabled = false;
			searchTrackInput.required = true;
		}
		if (searchArtistInput) {
			searchArtistInput.disabled = false;
			searchArtistInput.required = false;
		}
		if (searchAlbumInput) {
			searchAlbumInput.disabled = false;
			searchAlbumInput.required = false;
		}
	}
}

// Initialize the app when the DOM is loaded
//document.addEventListener('DOMContentLoaded', init);
init();
// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
	if (instantStore.Items.settings.theme === 'system') {
		applyTheme();
	}
});

// Handle online/offline UI state for search button and modal
/* function updateSearchButtonStatus() {
	if (!searchBtn) return;
	const isOnline = navigator.onLine;
	if (!isOnline) {
		searchBtn.classList.add('disabled');
		searchBtn.disabled = true;
	} else {
		searchBtn.classList.remove('disabled');
		searchBtn.disabled = false;
	}
} */

/* function forceCloseSearchModalIfOpen() {
	if (!searchModal) return;
	if (searchModal.classList.contains('active')) {
		searchModal.classList.remove('active');
		// Only remove overlay/no-scroll if settings panel isn't open
		if (!settingsPanel.classList.contains('active')) {
			overlay.classList.remove('active');
			document.body.classList.remove('no-scroll');
		}
		cleanupHCaptcha();
	}
}
 */
let wasOnLrcLib = false;

function updateOfflineStatus() {
	const lrcLibSPButton = searchProviders.find(provider => provider.name === "lrclib")?.element as HTMLElement;
	const spicyLyricsSPButton = searchProviders.find(provider => provider.name === "spicylyrics")?.element as HTMLElement;
	const isLrcLibFormScreen = searchForm.classList.contains("lrclib");

	if (navigator.onLine) {
		if (lrcLibSPButton) {
			lrcLibSPButton.classList.remove("disabled");
		}

		if (wasOnLrcLib) {
			swapLyricsProviders();
			if (lrcLibSPButton) lrcLibSPButton.classList.add("active");
			if (spicyLyricsSPButton) spicyLyricsSPButton.classList.remove("active");
		}

		wasOnLrcLib = false;

		return;
	}

	if (lrcLibSPButton) {
		lrcLibSPButton.classList.add("disabled");
	}

	if (isLrcLibFormScreen) {
		wasOnLrcLib = true;
		swapLyricsProviders();
		if (lrcLibSPButton) lrcLibSPButton.classList.remove("active");
		if (spicyLyricsSPButton) spicyLyricsSPButton.classList.add("active");
	}

}

const offlineNoticeElement = document.querySelector<HTMLElement>(".offlineNotice");

// Initial online state and listeners
window.addEventListener('online', () => {
	updateOfflineStatus();
    hCaptchaSiteKey = null;
    siteKeyRetries = 0;
    //initSitekey();
    showToast("Back online!");
	offlineNoticeElement?.classList.remove("active");
});

window.addEventListener('offline', () => {
	updateOfflineStatus();

    showToast("You're offline. Features are limited during offline mode");
	offlineNoticeElement?.classList.add("active");
});

// Check if user is offline when page loads and show toast
if (!navigator.onLine) {
	updateOfflineStatus();
    showToast("You're offline. Features are limited during offline mode");
	offlineNoticeElement?.classList.add("active");
}