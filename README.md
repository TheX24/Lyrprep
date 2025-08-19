# Lyrprep - Lyrics Preprocessing Tool

> [!WARNING]
> Deprecated. Use [website.](https://lyrprep.spicylyrics.org)

Lyrprep is a Python-based tool designed to process lyrics files (.lrc) into a ready-to-sync text for AMLL TTML Tool.  
Vibe-coded with Cascade by Windsurf.

## Features

- **Multiple Processing Modes**:
  - Basic formatting (lyrprep.py)
  - Clipboard integration (lyrprep_clip.py)
- **Text Transformations**:
  - Smart dash handling (end-of-line dashes become em-dashes)
  - Parentheses processing
  - Custom spacing with backslashes
- **Easy Integration**:
  - Drag-and-drop batch files
  - Windows context menu integration
  - Command-line interface

## Installation

### Prerequisites
- Python 3.6 or higher
- Required Python packages: `pyperclip`

### Quick Start

1. Clone this repository or download the files to your preferred directory.
2. Install the required packages:
   ```
   pip install pyperclip
   ```
3. (Optional) Run the installer to add context menu integration:
   ```
   install_context_menu.bat
   ```
   Note: This requires administrator privileges.

## Usage

### Basic Usage

1. **Using the Basic Processor**
   - Drag and drop an .lrc file onto `lyrprep.bat`
   - Output will be saved as `[original_filename]_processed.txt`

2. **Using the Clipboard Version**
   - Drag and drop an .lrc file onto `lyrprep_clip.bat`
   - Processed text will be copied to your clipboard

### Command Line Usage

```bash
# Basic processing
python lyrprep.py "path/to/your/file.lrc"

# Clipboard version
python lyrprep_clip.py "path/to/your/file.lrc"
```

## Context Menu Integration

To add Lyrprep to your Windows right-click context menu:

1. Run `install_context_menu.bat` as administrator
2. Right-click any .lrc file and select "Process with Lyrprep"

To uninstall the context menu integration:

1. You're on your own sorry

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with Python
- Uses [pyperclip](https://pypi.org/project/pyperclip/) for clipboard operations
- Thanks to Cascade (Windsurf) for basically making everything
