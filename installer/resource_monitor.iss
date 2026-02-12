; Resource Monitor Inno Setup Script
; Build command example:
;   "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer\resource_monitor.iss

#define AppId "com.ksun22515.resource-monitor"
#define AppName "Resource Monitor"
#define AppVersion "0.1.0"
#define AppPublisher "Resource Monitor Team"
#define AppExeName "resource_monitor.exe"
#define SourceExe "..\src-tauri\target\release\resource_monitor.exe"
#define SourceIcon "..\src-tauri\icons\icon.ico"

[Setup]
AppId={#AppId}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
UninstallDisplayIcon={app}\{#AppExeName}
OutputDir=..\dist-installer
OutputBaseFilename=ResourceMonitor-Setup-{#AppVersion}
Compression=lzma
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
SetupIconFile={#SourceIcon}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "chinesesimp"; MessagesFile: "compiler:Languages\ChineseSimplified.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "autostart"; Description: "Launch {#AppName} at Windows startup"; GroupDescription: "Startup options"

[Files]
Source: "{#SourceExe}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#AppName}"; Filename: "{app}\{#AppExeName}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "ResourceMonitor"; ValueData: """{app}\{#AppExeName}"" --autostart"; Flags: uninsdeletevalue; Tasks: autostart

[Run]
Filename: "{app}\{#AppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(AppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
function InitializeSetup(): Boolean;
begin
  if not FileExists(ExpandConstant('{#SourceExe}')) then
  begin
    MsgBox(
      'Cannot find build artifact:' + #13#10 + ExpandConstant('{#SourceExe}') + #13#10#13#10 +
      'Please run "pnpm tauri build" first.',
      mbError,
      MB_OK
    );
    Result := False;
    exit;
  end;

  Result := True;
end;
