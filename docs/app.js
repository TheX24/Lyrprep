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

// Show welcome popup if not disabled
function showWelcomePopup() {
    // Check if user has chosen not to see the popup again
    if (localStorage.getItem('hideWelcomePopup') !== 'true') {
        welcomePopup.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent scrolling when popup is open
    }
}

// Close welcome popup
function closeWelcomePopup() {
    // Save user preference
    if (dontShowAgainCheckbox.checked) {
        localStorage.setItem('hideWelcomePopup', 'true');
    }
    
    welcomePopup.classList.remove('show');
    document.body.style.overflow = ''; // Re-enable scrolling
    inputText.focus();
}

// Initialize the app
function init() {
    // Load settings from localStorage
    loadSettings();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set initial theme based on system preference
    setInitialTheme();
    
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
function setInitialTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
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
function toggleTheme() {
    if (themeToggle.checked) {
        settings.theme = 'dark';
    } else {
        settings.theme = 'light';
    }
    
    localStorage.setItem('theme', settings.theme);
    applyTheme();
}

// Toggle settings panel
function toggleSettings() {
    settingsPanel.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.classList.toggle('no-scroll', settingsPanel.classList.contains('active'));
}

// Toggle search modal
function toggleSearchModal() {
    searchModal.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.classList.toggle('no-scroll', searchModal.classList.contains('active'));
    
    if (searchModal.classList.contains('active')) {
        searchTrackInput.focus();
    }
}

// Search for lyrics using LRCLIB API
async function searchLyrics() {
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
            throw new Error('Failed to fetch lyrics');
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
function updateSettings() {
    settings.removeTimestamps = document.getElementById('option-remove-timestamps').checked;
    settings.handleDashes = document.getElementById('option-handle-dashes').checked;
    settings.handleEmdash = document.getElementById('option-handle-emdash').checked;
    settings.handleParentheses = document.getElementById('option-handle-parentheses').checked;
    settings.addSpaces = document.getElementById('option-add-spaces').checked;
    settings.removeEmptyLines = document.getElementById('option-remove-empty-lines').checked;
    
    saveSettings();
    
    if (realtimeToggle.checked) {
        convertText();
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('lyrprepSettings', JSON.stringify(settings));
}

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('lyrprepSettings');
    if (savedSettings) {
        Object.assign(settings, JSON.parse(savedSettings));
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

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (settings.theme === 'system') {
        applyTheme();
    }
});
