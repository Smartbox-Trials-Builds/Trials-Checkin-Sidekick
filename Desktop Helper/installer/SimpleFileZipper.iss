#define AppName "Smartbox Vocab Zipper"
#define AppVersion "1.2.1"
#define AppPublisher "Sidekick"
#define AppExeName "SmartboxVocabZipper.exe"
#define AppId "{{D476B0F0-28D6-4BE8-89E9-56D2DA3EA62D}"

[Setup]
AppId={#AppId}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={localappdata}\Programs\Smartbox Vocab Zipper
DefaultGroupName=Smartbox Vocab Zipper
AllowNoIcons=yes
OutputDir=..\dist-updates
OutputBaseFilename=SmartboxVocabZipper-Setup-{#AppVersion}
Compression=lzma
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\{#AppExeName}
PrivilegesRequired=lowest
CloseApplications=yes
AppPublisherURL=https://github.com/Smartbox-Trials-Builds/Trials-Checkin-Sidekick
AppSupportURL=https://github.com/Smartbox-Trials-Builds/Trials-Checkin-Sidekick/releases
SetupIconFile=..\assets\install-icon.ico

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked

[Files]
Source: "..\dist-updates\SmartboxVocabZipper.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Smartbox Vocab Zipper"; Filename: "{app}\{#AppExeName}"
Name: "{autodesktop}\Smartbox Vocab Zipper"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExeName}"; Description: "Launch Smartbox Vocab Zipper"; Flags: nowait postinstall skipifsilent
