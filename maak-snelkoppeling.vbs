' Maakt een snelkoppeling "Aandeel Checker" op het bureaublad.
' Dubbelklik dit bestand eenmalig — daarna start je de app vanaf je bureaublad.
Set ws = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
desktop = ws.SpecialFolders("Desktop")
Set sc = ws.CreateShortcut(desktop & "\Aandeel Checker.lnk")
sc.TargetPath = appDir & "\start-aandeel-checker.bat"
sc.WorkingDirectory = appDir
sc.IconLocation = appDir & "\public\logo.ico"
sc.Description = "Checklist voor aankoop van een aandeel"
sc.Save
MsgBox "Snelkoppeling 'Aandeel Checker' staat op je bureaublad.", vbInformation, "Klaar"
