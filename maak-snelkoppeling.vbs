' Maakt een snelkoppeling "Aandeel Checker" op het bureaublad.
' Dubbelklik dit bestand eenmalig — daarna start je de app vanaf je bureaublad.
' Het script schrijft eerst het meegeleverde icoon (base64) weg naar public\logo.ico.
Set ws = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)

' --- 1. Icoon wegschrijven (ingebed, zodat er geen los bestand nodig is) ---
icoB64 = ""
icoB64 = icoB64 & "AAABAAIAEBAAAAAAIABRAQAAJgAAACAgAAAAACAAqQIAAHcBAACJUE5HDQoaCgAAAA1JSERSAAAAEAAAABAIBgAAAB/z/2EAAAEYSURBVHicY/zx5fU/BgoAEyWaqWIAC7rAziNXGXYducLIxoYq9evXHwY3G53/7jbaKOKMyGFw+dYTBofYbkZ8Nh5YXPpfV00GuwvuP3nDwMDAwCAmzMvw69cfFI1sbCwMr95+Zrj/5A0DsgFYwwBZ87cfvxhkJYUYWguD/mNTixEGMMDNxc7w+89fBgYGBgZjbXmGheuPMUqLCxBngKykEIOloTLcJW8+fGXQUpFkuP/kNcOfv//wGyAtLsBgaajMsGrbaQY2NhYGVhZmBgYGBoaHT7kZnr78wMDCzITbgD9//zF8/faTYcOe8wwMDJCwgLni67efWL2KYoCqvBjDh8/fsSqEAUUZERQ+I3peoCghkQMGPjMBAP8YbUihwQPvAAAAAElFTkSuQmCCiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACcElEQVR4nO2WXUhTYRjH/2943BxnO9NNlpngxJAokrxoRd1EhpQG1VWL0CIEoy4qCEWoi11EdKFBdiEhCgUTouhjBYrdxMBGFyVY9sVIIkvX1LMzzs7Zkd4uxpEYdXjP1Haz/+Xh+fi9z/u8z3lISpr7hTxqXT6TFwAKAABQxGKkqBrefp4xFXhL7QZYLdzKAcbGp9Dd84DEF5NQVI0ZoNJTiqsXj9LGXZsN7YjRHPjwZRYH228QRdWYTvOndJ9nt8/TumrPP+0MeyAYihBRkuHgS0wlBwAHXwJRkhEMRYiRnSHAz4UkACCtLZkG0H30GDkB5CJRkk31yqoBKKqGnfU1GO7toJ3tB+h/B1DTGr7HRFRVlGF3Qy2zH9McyFb2q1BUDeVlDnR3NNNA32Oif2OR6QqIkow673q4nDxESQYAWC0cbl4+Tgfvh8lIeBIvJ6I4sr+BKZ6pCoiSjKY9W3HGv5cqaQ29Q6PkffQH+gOt9OHYa/Jpeg6WYg79gVb6LjM5DZ8gM0AxV4TYfALHmn043LidtnUNEJeTx5Wzh2hFuYCewVEyEp7E0LXTdFO1B8FQhPTdfc50KCaA2HwCF041ob5uI23rHCBWC4dvswu4dP0eqalyIzIRhWC3IXDrCdmxzYvhpxEIdtvyFRmJqQfOndgHb6WbnuzKJAcy957WlvBm6isEuw0AEF9MLidnFVMFXrz6iDuPxsnfAmf/I8wkBxgrMD0TNxV01QDcpTyATBOale6jx8gJwN/io4LdhkQyZRogkUxBsNvgb/EZjmXDfQDIbSGxWji4nPzKFxJda7mSMQGspfK+FRcACgC/AUgX8oslPEl3AAAAAElFTkSuQmCC"

If Not fso.FolderExists(appDir & "\public") Then fso.CreateFolder(appDir & "\public")
tmpB64 = appDir & "\public\logo.b64"
icoPath = appDir & "\public\logo.ico"
Set tf = fso.CreateTextFile(tmpB64, True)
tf.Write icoB64
tf.Close
Set sh = CreateObject("WScript.Shell")
sh.Run "certutil -decode """ & tmpB64 & """ """ & icoPath & """", 0, True
fso.DeleteFile tmpB64

' --- 2. Snelkoppeling aanmaken ---
desktop = ws.SpecialFolders("Desktop")
Set sc = ws.CreateShortcut(desktop & "\Aandeel Checker.lnk")
sc.TargetPath = appDir & "\start-aandeel-checker.bat"
sc.WorkingDirectory = appDir
sc.IconLocation = icoPath
sc.Description = "Checklist voor aankoop van een aandeel"
sc.Save
MsgBox "Snelkoppeling 'Aandeel Checker' staat op je bureaublad.", vbInformation, "Klaar"
