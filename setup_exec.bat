::[Bat To Exe Converter]
::
::YAwzoRdxOk+EWAjk
::fBw5plQjdCyDJFqL8EcjFAhAQweJAGqpFbAI+9Ty7OWJ7EQeW4I=
::YAwzuBVtJxjWCl3EqQJgSA==
::ZR4luwNxJguZRRnk
::Yhs/ulQjdF+5
::cxAkpRVqdFKZSjk=
::cBs/ulQjdF+5
::ZR41oxFsdFKZSDk=
::eBoioBt6dFKZSTk=
::cRo6pxp7LAbNWATEpCI=
::egkzugNsPRvcWATEpCI=
::dAsiuh18IRvcCxnZtBJQ
::cRYluBh/LU+EWAjk
::YxY4rhs+aU+JeA==
::cxY6rQJ7JhzQF1fEqQJQ
::ZQ05rAF9IBncCkqN+0xwdVs0
::ZQ05rAF9IAHYFVzEqQJQ
::eg0/rx1wNQPfEVWB+kM9LVsJDGQ=
::fBEirQZwNQPfEVWB+kM9LVsJDGQ=
::cRolqwZ3JBvQF1fEqQJQ
::dhA7uBVwLU+EWDk=
::YQ03rBFzNR3SWATElA==
::dhAmsQZ3MwfNWATElA==
::ZQ0/vhVqMQ3MEVWAtB9wSA==
::Zg8zqx1/OA3MEVWAtB9wSA==
::dhA7pRFwIByZRRnk
::Zh4grVQjdCyDJFqL8EcjFAhAQweJAHi/EqAMpu3j6oo=
::YB416Ek+ZW8=
::
::
::978f952a14a936cc963da21a135fa983
@echo off

REM Set the destination directory
set "destination_directory=C:\Kamero SM"

REM Check if the destination directory already exists
if not exist "%destination_directory%" (
    REM Check if the script is running with administrator privileges
    NET SESSION >NUL 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo Creating directory ...
        mkdir "%destination_directory%"
    ) else (
        echo Requesting administrator privileges...
        PowerShell.exe -Command "Start-Process -Verb RunAs -FilePath \"%~f0\""
        exit
    )
)

REM Get the current directory (where the batch file is located)
set "current_directory=%~dp0"

REM Copy all files and folders from the current directory to the destination directory
echo Copying files to ...
xcopy "%current_directory%*" "%destination_directory%" /E /I /Q /Y

if %ERRORLEVEL% NEQ 0 (
    echo Error occurred during file copying.
    pause
    exit /b
)


powershell.exe -ExecutionPolicy Bypass -Command ^
"$targetPath = 'C:\Kamero SM\ksm.exe'; ^
$desktopPath = [Environment]::GetFolderPath('Desktop'); ^
$shortcutFile = Join-Path $desktopPath 'Kamero Stock Management.lnk'; ^
$shell = New-Object -ComObject WScript.Shell; ^
$shortcut = $shell.CreateShortcut($shortcutFile); ^
$shortcut.TargetPath = $targetPath; ^
$shortcut.Save(); "
if not exist "C:\Kamero SM\ksm.exe" (
    echo ERROR: ksm.exe not found after copying.
    exit /b
)

echo Shortcut created successfully.

REM Execute the ksm.exe file
echo Starting the application ...
start "" "C:\Kamero SM\ksm.exe"

echo Setup completed.
exit
