$packageName = 'Hain'
$installerType = 'exe' # Squirrel Installer / Updater
$url64 = 'https://github.com/appetizermonster/hain/releases/download/v${version}/HainSetup-x64-v${version}.exe'
$url32 = 'https://github.com/appetizermonster/hain/releases/download/v${version}/HainSetup-ia32-v${version}.exe'
$silentArgs = "" # The installation is silent by default

Install-ChocolateyPackage "$packageName" "$installerType" "$silentArgs" "$url32" "$url64"