Option Explicit

Dim shell, fso, projectDir, batPath, cmd
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

projectDir = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = projectDir & "\start-share.bat"

If Not fso.FileExists(batPath) Then
  MsgBox "start-share.bat not found in project root.", vbCritical, "Launch Error"
  WScript.Quit 1
End If

shell.Popup "Starting in background... Browser will open in a few seconds.", 3, "Review Pack", 64

cmd = "cmd /c cd /d """ & projectDir & """ && call start-share.bat"
shell.Run cmd, 0, False
