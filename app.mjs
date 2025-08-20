import DB from "./tools/iDB.mjs";
// IndexedDB config moved here (stores are fixed by the DB class)
const iDBConfig = {
	dbName: 'LyrprepDB',
	version: 1,
	defaults: {
		expireTtlMs: 1000 * 60 * 60 * 24 * 7,
	},
};
const iDB = new DB(iDBConfig);
// DOM Elements
const inputText = document.getElementById('input-text');
const outputText = document.getElementById('output-text');
const convertBtn = document.getElementById('convert-btn');
const clearInputBtn = document.getElementById('clear-input');
const copyOutputBtn = document.getElementById('copy-output');
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings');
const settingsPanel = document.getElementById('settings-panel');
const themeToggle = document.getElementById('theme-toggle');
const realtimeToggle = document.getElementById('realtime-toggle');
const toast = document.getElementById('toast');
const overlay = document.getElementById('overlay');
const searchBtn = document.getElementById('search-lyrics');
const searchModal = document.getElementById('search-modal');
const closeSearchBtn = document.getElementById('close-search');
const searchForm = document.querySelector('.search-form');
const searchResults = document.getElementById('search-results');
const searchTrackInput = document.getElementById('search-track');
const searchArtistInput = document.getElementById('search-artist');
const searchAlbumInput = document.getElementById('search-album');
const swapProvidersButton = document.querySelector('.swapProvidersButton');

const lrclibFormGroup = document.querySelector('.lrclib-formGroup');
const spicyLyricsFormGroup = document.querySelector('.sl-formGroup');
const searchSpotifyUri = document.getElementById('search-spotify-url');

const searchModalBtn = document.getElementById('search-btn');


async function waitUntil(valueOrFn, checkInterval = 100) {
	return new Promise(async (resolve) => {
		while (true) {
			const current = typeof valueOrFn === 'function' ? valueOrFn() : valueOrFn;
			if (current) {
				resolve(current);
				return;
			}
			await new Promise((r) => setTimeout(r, checkInterval));
		}
	})
}

// Config
const spicyLyricsApiUrlBase = `https://api.spicylyrics.org/lyrprep`;
// Version embedded in saved payloads (not the IndexedDB schema version)
const CURRENT_STORE_VERSION = 1;

// Settings state
const settings = {
	removeTimestamps: true,
	handleDashes: true,
	handleEmdash: true,
	handleParentheses: true,
	addSpaces: true,
	removeEmptyLines: true,
	theme: 'system'
};

// Welcome popup elements
const welcomePopup = document.getElementById('welcome-popup');
const closeWelcomeBtn = document.getElementById('close-welcome');
const dontShowAgainCheckbox = document.getElementById('dont-show-again');

let currentHCaptchaWidget = null;

let currentHCaptchaToken = null;
let currentHCaptchaKey = null;

let hCaptchaSiteKey = null;
let hCaptchaLoaded = false;

let siteKeyRetries = 0;
const siteKeyRetryDelay = 1000;
const siteKeyMaxRetries = 10;

let shouldRenderHCaptcha = false;
let isAwaitingHCaptcha = false;


async function initSitekey() {
    if (hCaptchaSiteKey != null) return;

    if (!navigator.onLine) {
        const savedSK = await iDB.get("SK_Store");
        if (savedSK) {
            hCaptchaSiteKey = savedSK;
			siteKeyRetries = 0;

			if (typeof overlay !== 'undefined') {
				overlay.classList.remove("active");
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
        await iDB.savePermanent("SK_Store", siteKey)
        siteKeyRetries = 0;

        if (typeof overlay !== 'undefined') {
            overlay.classList.remove("active");
        }
    } catch (error) {
        await new Promise((r) => setTimeout(r, siteKeyRetryDelay));
        siteKeyRetries++;
        initSitekey();
    }
}


const hCaptchaCallbacks = {
	onSolve: (token, key) => {
		console.log('hCaptcha solved successfully');
		currentHCaptchaToken = token;
		currentHCaptchaKey = key;
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
	onError: (err) => {
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

window.onloadHCaptcha = async () => {
	hCaptchaLoaded = true;
	ensureHCaptchaRendered();
}

function ensureHCaptchaRendered() {
	try {
		const container = document.getElementById('sl-hcaptcha-content');
		const modalIsActive = searchModal && searchModal.classList.contains('active');
		const spicyActive = searchForm && searchForm.classList.contains('spicylyrics');
		if (!hCaptchaLoaded || !hCaptchaSiteKey || !container || !modalIsActive || !spicyActive || !shouldRenderHCaptcha) return;

		// Don't render twice into the same container
		if (container.childElementCount > 0 && currentHCaptchaWidget !== null) return;

		currentHCaptchaWidget = hcaptcha.render(container, {
			sitekey: hCaptchaSiteKey,
			callback: (token) => hCaptchaCallbacks.onSolve(token, currentHCaptchaWidget),
			'expired-callback': () => hCaptchaCallbacks.onExpired(),
			'error-callback': (err) => hCaptchaCallbacks.onError(err),
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
		currentHCaptchaKey = null;
		currentHCaptchaToken = null;
	}
}

function cleanupHCaptcha() {
	try {
		const container = document.getElementById('sl-hcaptcha-content');
		if (typeof hcaptcha !== 'undefined' && currentHCaptchaWidget !== null) {
			try { hcaptcha.remove(currentHCaptchaWidget); } catch (e) {
				try { hcaptcha.reset(currentHCaptchaWidget); } catch (_) {}
			}
		}
		if (container) container.innerHTML = '';
	} catch (e) {
		console.warn('cleanupHCaptcha encountered an error:', e);
	} finally {
		currentHCaptchaKey = null;
		currentHCaptchaToken = null;
		currentHCaptchaWidget = null;
		shouldRenderHCaptcha = false;
		// Re-enable the submit button if it was disabled for captcha
		try {
			const submitBtn = document.getElementById('search-btn');
			if (submitBtn) submitBtn.disabled = false;
		} catch (_) {}
	}
}

// Show welcome popup if not disabled
async function showWelcomePopup() {
	// Check if user has chosen not to see the popup again
	try {
		const hidden = localStorage.getItem("hideWelcomePopup");
		if (hidden !== 'true') {
			welcomePopup.classList.add('show');
			document.body.style.overflow = 'hidden'; // Prevent scrolling when popup is open
		}
	} catch (_) {
		welcomePopup.classList.add('show');
		document.body.style.overflow = 'hidden';
	}
}

// Close welcome popup
async function closeWelcomePopup() {
	// Save user preference
	if (dontShowAgainCheckbox.checked) {
		localStorage.setItem('hideWelcomePopup', 'true');
	}
	
	welcomePopup.classList.remove('show');
	document.body.style.overflow = ''; // Re-enable scrolling
	inputText.focus();
}

// Initialize the app
async function init() {

	await initSitekey();

	// Load settings from storage
	await loadSettings();
	
	// Set up event listeners
	setupEventListeners();

	// Ensure only visible provider fields are validated
	updateSearchProviderFields();
	
	// Set initial theme based on system preference
	await setInitialTheme();
	
	// Set initial state of toggles
	updateTogglesFromSettings();
	
	// Show welcome popup if needed
	setTimeout(showWelcomePopup, 500); // Small delay for better UX
	
	// Close popup when clicking outside content
	welcomePopup.addEventListener('click', (e) => {
		if (e.target === welcomePopup) {
			closeWelcomePopup();
		}
	});
	
	// Close popup when pressing Escape key
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && welcomePopup.classList.contains('show')) {
			closeWelcomePopup();
		}
	});

}

// Set up event listeners
function setupEventListeners() {
	// Welcome popup close button
	closeWelcomeBtn.addEventListener('click', closeWelcomePopup);
	
	// Convert button click
	convertBtn.addEventListener('click', convertText);


	swapProvidersButton.addEventListener("click", swapLyricsProviders)
	
	// Clear input button
	clearInputBtn.addEventListener('click', () => {
		inputText.value = '';
		outputText.value = '';
		inputText.focus();
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
	document.getElementById('option-remove-timestamps').addEventListener('change', updateSettings);
	document.getElementById('option-handle-dashes').addEventListener('change', updateSettings);
	document.getElementById('option-handle-emdash').addEventListener('change', updateSettings);
	document.getElementById('option-handle-parentheses').addEventListener('change', updateSettings);
	document.getElementById('option-add-spaces').addEventListener('change', updateSettings);
	document.getElementById('option-remove-empty-lines').addEventListener('change', updateSettings);
	
	// Theme toggle
	themeToggle.addEventListener('change', toggleTheme);
	
	// Search form submission
	searchForm.addEventListener('submit', (e) => {
		e.preventDefault();
		searchLyrics();
	});
	
	// Handle clicks on search results
	searchResults.addEventListener('click', (e) => {
		const resultItem = e.target.closest('.search-result-item');
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
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	let savedTheme;
	try { savedTheme = await iDB.get('theme'); } catch (_) {}
	
	if (savedTheme) {
		settings.theme = savedTheme;
	} else {
		settings.theme = 'system';
	}
	
	applyTheme();
}

// Apply current theme
function applyTheme() {
	if (settings.theme === 'system') {
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
	} else {
		document.documentElement.setAttribute('data-theme', settings.theme);
	}
	
	// Update theme toggle
	if (themeToggle) {
		themeToggle.checked = document.documentElement.getAttribute('data-theme') === 'dark';
	}
}

// Toggle between light and dark theme
async function toggleTheme() {
	if (themeToggle.checked) {
		settings.theme = 'dark';
	} else {
		settings.theme = 'light';
	}
	
	await iDB.savePermanent('theme', settings.theme);
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
			
			const results = await response.json();
			
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
		const parseLyrics = (lyrics) => lyrics.split("\x1e").join("\n");

		const lyricsContinue = (lyrics) => {
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

			const cachedContent = await iDB.get(`sl:${trackId}`);

			console.log("Cached Content", cachedContent);
			if (cachedContent !== undefined) {
				console.log("Cached Content - not undefined");
				const lyrics = parseLyrics(cachedContent);

				console.log("Cached Parsed Lyrics", lyrics);
				if (lyrics !== undefined) {
					console.log("Cached Lyrics - not undefined");
					lyricsContinue(lyrics);
					showLoadingState(false);
					return;
				};
			}

			// No cached lyrics; require hCaptcha after submit
			if (!currentHCaptchaToken) {
				showLoadingState(false);
				shouldRenderHCaptcha = true;
				isAwaitingHCaptcha = true;
				ensureHCaptchaRendered();
				// Disable the submit button until captcha is solved
				try {
					const submitBtn = document.getElementById('search-btn');
					if (submitBtn) submitBtn.disabled = true;
				} catch (_) {}
				return;
			}

			try {
				const response = await fetch(`${spicyLyricsApiUrlBase}/lyrics`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						captcha: currentHCaptchaToken,
						metadata: {
							trackId
						}
					}),
				})

				if (!response.ok) {
					throw new Error('Failed to fetch lyrics (from the Spicy Lyrics API)');
				}

				const data = await response.text();

				if (!data) {
					showToast('No results found');
					return;
				}

				const lyrics = parseLyrics(data);

				await iDB.saveExpiring(`sl:${trackId}`, data, 1000 * 60 * 30);

				lyricsContinue(lyrics);
			} catch (error) {
				console.error("Error happened while fetching the Spicy Lyrics API for Lyrics", error)
				showToast('Error searching for lyrics');
			} finally {
				showLoadingState(false);
				// If modal is still open (error/no results), reset so user can retry; if closed (success), cleanup happens on close
				if (searchModal.classList.contains('active')) {
					resetHCaptcha();
				} else {
					cleanupHCaptcha();
				}
			}
		}
	}
}

// Display search results
function displaySearchResults(results) {
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
function showLoadingState(isLoading) {
	const searchBtn = document.getElementById('search-btn');
	if (isLoading) {
		searchBtn.disabled = true;
		searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
	} else {
		searchBtn.disabled = false;
		searchBtn.innerHTML = '<i class="fas fa-search"></i> Search';
	}
}

// Format duration in seconds to MM:SS
function formatDuration(seconds) {
	if (!seconds) return '';
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
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
	settings.removeTimestamps = document.getElementById('option-remove-timestamps').checked;
	settings.handleDashes = document.getElementById('option-handle-dashes').checked;
	settings.handleEmdash = document.getElementById('option-handle-emdash').checked;
	settings.handleParentheses = document.getElementById('option-handle-parentheses').checked;
	settings.addSpaces = document.getElementById('option-add-spaces').checked;
	settings.removeEmptyLines = document.getElementById('option-remove-empty-lines').checked;
	
	await saveSettings();
	
	if (realtimeToggle.checked) {
		convertText();
	}
}

// Save settings to localStorage
async function saveSettings() {
	await iDB.savePermanent('lyrprepSettings', settings);
}

// Load settings from localStorage
async function loadSettings() {
	let savedSettings;
	try { savedSettings = await iDB.get('lyrprepSettings'); } catch (_) {}
	if (savedSettings) {
		try { Object.assign(settings, JSON.parse(savedSettings)); } catch (_) {}
	}
	
	// Apply loaded settings to UI
	updateTogglesFromSettings();
}

// Update UI toggles from settings
function updateTogglesFromSettings() {
	document.getElementById('option-remove-timestamps').checked = settings.removeTimestamps;
	document.getElementById('option-handle-dashes').checked = settings.handleDashes;
	document.getElementById('option-handle-emdash').checked = settings.handleEmdash;
	document.getElementById('option-handle-parentheses').checked = settings.handleParentheses;
	document.getElementById('option-add-spaces').checked = settings.addSpaces;
	document.getElementById('option-remove-empty-lines').checked = settings.removeEmptyLines;
	
	// Set theme toggle
	if (themeToggle) {
		themeToggle.checked = document.documentElement.getAttribute('data-theme') === 'dark';
	}
}

// Remove empty lines from text
function removeEmptyLines(text) {
	return text.split('\n').filter(line => line.trim() !== '').join('\n');
}

// Main conversion function
function convertText() {
	try {
		let text = inputText.value;
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
		if (settings.removeEmptyLines) {
			outputText.value = outputText.value.split('\n').filter(line => line.trim() !== '').join('\n');
		}
		
		// If addSpaces is enabled, replace spaces with backslash-space-backslash
		if (settings.addSpaces) {
			outputText.value = outputText.value.replace(/ /g, '\\ \\');
		}
		
	} catch (error) {
		console.error('Error processing text:', error);
		showToast('Error processing text');
	}
}

// Process a single line of text
function processLine(line) {
	if (!line || typeof line !== 'string') return line || '';
	
	// If all processing options are off, return the line as is
	if (!settings.removeTimestamps && !settings.handleDashes && !settings.handleParentheses) {
		return line;
	}
	
	// Remove anything within square brackets if enabled
	if (settings.removeTimestamps) {
		line = line.replace(/\[.*?\]/g, '').trim();
	}

	// If only removeTimestamps is enabled, we can return early
	if (!settings.handleDashes && !settings.handleParentheses) {
		return line;
	}

	let result = '';
	let i = 0;
	
	while (i < line.length) {
		// Handle text in parentheses if enabled
		if (settings.handleParentheses && line[i] === '(') {
			let j = i + 1;
			let parenContent = '';
			
			// Find the matching closing parenthesis
			while (j < line.length && line[j] !== ')') {
				parenContent += line[j];
				j++;
			}
			
			if (j < line.length) { // Found closing parenthesis
				// Get text before the opening parenthesis
				const beforeParen = line.substring(0, i).trim();
				
				// Process the content inside parentheses
				const processed = processLine(parenContent);
				
				// Get any text after the closing parenthesis
				const afterParen = line.substring(j + 1).trim();
				
				// Build the result with proper newlines and < for parenthetical content
				if (beforeParen) {
					result = beforeParen + '\n';
				}
				
				if (processed) {
					const formatted = processed.charAt(0).toUpperCase() + processed.slice(1).toLowerCase();
					result += '<' + formatted;  // Add < before the parenthetical content
				}
				
				if (afterParen) {
					result += '\n' + afterParen;
				}
				
				// Skip to the end of the line
				i = line.length;
				break;
			}
		}
		
		// Handle dashes if enabled
		if (settings.handleDashes && line[i] === '-') {
			if (i + 1 < line.length) {
				const nextChar = line[i + 1];
				if (nextChar === ' ') {
					// Dash followed by space → em dash
					result += '— ';
					i += 2;
				} else if (nextChar === '-') {
					// Double dash → em dash
					result += '—';
					i += 2;
				} else if (i > 0 && line[i - 1].match(/[a-zA-Z]/) && nextChar.match(/[a-zA-Z]/)) {
					// Dash between letters → add backslash
					result += '-\\';
					i++;
				} else {
					// Single dash at end of word → em dash
					result += '—';
					i++;
				}
				continue;
			} else {
				// Dash at end of line → em dash
				result += '—';
				i++;
				continue;
			}
		}
		
		// Add regular characters
		result += line[i];
		i++;
	}
	
	// Clean up multiple spaces but preserve newlines
	return result.replace(/[^\S\n]+/g, ' ').trim();
}

// Copy output to clipboard
async function copyToClipboard() {
	try {
		await navigator.clipboard.writeText(outputText.value);
		showToast('Copied to clipboard!');
	} catch (err) {
		console.error('Failed to copy text: ', err);
		showToast('Failed to copy to clipboard');
	}
}

// Show toast notification
function showToast(message, duration = 3000) {
	toast.textContent = message;
	toast.classList.add('show');
	
	// Hide after duration
	setTimeout(() => {
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
	if (settings.theme === 'system') {
		applyTheme();
	}
});

// Handle online/offline UI state for search button and modal
function updateSearchButtonStatus() {
	if (!searchBtn) return;
	const isOnline = navigator.onLine;
	if (!isOnline) {
		searchBtn.classList.add('disabled');
		searchBtn.disabled = true;
	} else {
		searchBtn.classList.remove('disabled');
		searchBtn.disabled = false;
	}
}

function forceCloseSearchModalIfOpen() {
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

// Initial online state and listeners
window.addEventListener('online', () => {
	updateSearchButtonStatus();
    hCaptchaSiteKey = null;
    siteKeyRetries = 0;
    initSitekey();
    showToast("Back online!");
});

window.addEventListener('offline', () => {
	updateSearchButtonStatus();
	forceCloseSearchModalIfOpen();

    showToast("You're offline. Features are limited during offline mode");
});

// Check if user is offline when page loads and show toast
if (!navigator.onLine) {
    updateSearchButtonStatus();
	forceCloseSearchModalIfOpen();
    showToast("You're offline. Features are limited during offline mode");
}

// Ensure initial state on script load
updateSearchButtonStatus();