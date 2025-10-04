# Lyrprep - Lyrics Preprocessing Tool

A powerful web application for formatting and preprocessing song lyrics with real-time conversion. Perfect for preparing lyrics for karaoke, music production, or lyric videos.

## 🌟 Features

- **Real-time Processing**: See changes instantly as you type or modify settings
- **LRCLIB Integration**: Search and fetch lyrics directly within the app
- **Smart Formatting**:
  - Remove timestamps `[00:00.00]`
  - Convert dashes to proper formatting:
    - `-` → `—` (em dash with space)
    - `--` → `—` (em dash)
    - Word-connecting dashes → `-\` (with escape)
  - Parentheses Processing:
    - Move parenthetical content to new lines
    - Capitalize first letter
    - Add `<` prefix for background vocals
  - Remove empty lines (optional)
  - Add spaces between words (with escape characters)
- **Modern UI**:
  - Dark/Light theme with system preference detection
  - Clean, responsive design for all devices
  - Intuitive settings panel
- **Productivity Features**:
  - One-click copy to clipboard
  - Save settings in browser
  - Installable as PWA for offline use

## 🚀 How to Use

1. **Input Your Lyrics**
   - Paste directly into the text area, or
   - Click the search icon (🔍) to find lyrics by song/artist/Spotify Link

2. **Customize Processing** (via Settings ⚙️)
   - Toggle individual processing options
   - Real-time preview updates automatically
   - All settings are saved in your browser

3. **Get Your Results**
   - Formatted text appears in the output area
   - Click the copy button to copy to clipboard
   - Toggle between formatted and raw output

## 📝 Notes

- All processing happens in your browser (no data is sent to any server)
- Settings are saved in your browser's Indexed DB
- For best results, use the latest version of Chrome, Firefox, Safari, or Edge

## Dependencies

- [Font Awesome](https://fontawesome.com/) - Icons
- [Google Fonts](https://fonts.google.com/) - Inter font family
- [LRCLIB API](https://lrclib.net/) - Lyrics database

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS/Android)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

Made with ❤️ by [TheX24](https://github.com/TheX24)
