$ErrorActionPreference = 'Stop'

# Get the current script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Create registry key for .lrc files if it doesn't exist
$regKey = "Registry::HKEY_CURRENT_USER\Software\Classes\.lrc"
if (-not (Test-Path $regKey)) {
    New-Item -Path $regKey -Force
}

# Get the file type for .lrc
$fileType = (Get-ItemProperty -Path $regKey)."(Default)"

# Create registry key for the context menu
$contextMenuKey = "Registry::HKEY_CURRENT_USER\Software\Classes\$fileType\shell\Lyrprep"
New-Item -Path $contextMenuKey -Force
Set-ItemProperty -Path $contextMenuKey -Name "(Default)" -Value "Process with Lyrprep"

# Create command key
$commandKey = "Registry::HKEY_CURRENT_USER\Software\Classes\$fileType\shell\Lyrprep\command"
New-Item -Path $commandKey -Force

# Add to the context menu for all files
$allFilesKey = "Registry::HKEY_CURRENT_USER\Software\Classes\*\shell\Lyrprep"
New-Item -Path $allFilesKey -Force
Set-ItemProperty -Path $allFilesKey -Name "(Default)" -Value "Process with Lyrprep"

# Create command key for all files
$allFilesCommandKey = "Registry::HKEY_CURRENT_USER\Software\Classes\*\shell\Lyrprep\command"
New-Item -Path $allFilesCommandKey -Force

# Get the full path to the batch file
$batchFile = Join-Path -Path $scriptPath -ChildPath "lyrprep_clip.bat"
$batchFile = [System.IO.Path]::GetFullPath($batchFile)

# Create the command
$command = "`"$batchFile`" `"%1`""
Set-ItemProperty -Path $commandKey -Name "(Default)" -Value $command
Set-ItemProperty -Path $allFilesCommandKey -Name "(Default)" -Value $command

# Get the full path to the batch file
$batchFile = Join-Path -Path $scriptPath -ChildPath "lyrprep_clip.bat"
$batchFile = [System.IO.Path]::GetFullPath($batchFile)

# Create the command
$command = "`"$batchFile`" `"%1`""
Set-ItemProperty -Path $commandKey -Name "(Default)" -Value $command

Write-Host "Successfully added Lyrprep to the right-click menu for .lrc files!"

# Refresh the shell to update the context menu
Start-Process powershell -ArgumentList '-NoProfile -Command "Stop-Process -Name explorer -Force"'
Start-Sleep -Seconds 2
Start-Process explorer