@echo off
setlocal enabledelayedexpansion
set "file=%~1"
python "%~dp0lyrprep_clip.py" "!file!"
