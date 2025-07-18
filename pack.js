const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Package the Electron application
const appName = 'ksm';
const outputDir = path.join(__dirname, 'dist');
execSync(`electron-packager . ${appName} --platform=win32 --arch=x64 --icon=assets/icon.ico --out=${outputDir} --overwrite`);

// Determine the output path for the packaged application
const packagedAppDir = path.join(outputDir, `${appName}-win32-x64`);

// Create setup.exe (as a placeholder)
const setupExePath = path.join(packagedAppDir, 'setup.exe');
fs.writeFileSync(setupExePath, 'This is a placeholder for setup.exe');

console.log('Packaging completed. setup.exe created.');
