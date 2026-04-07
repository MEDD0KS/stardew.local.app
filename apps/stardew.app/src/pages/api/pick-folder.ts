import { execFileSync, execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir, platform } from "os";
import type { NextApiRequest, NextApiResponse } from "next";

const TITLE = "Select your Stardew Valley save folder";

// Modern IFileOpenDialog via COM interop — same dialog as Explorer/VS Code
const WIN_PS_SCRIPT = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

[ComImport, Guid("DC1C5A9C-E88A-4DDE-A5A1-60F82A20AEF7")]
class FileOpenDialogRCW {}

[ComImport, Guid("42F85136-DB7E-439C-85F1-E4075D135FC8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IFileDialog {
    [PreserveSig] int Show(IntPtr hwnd);
    void SetFileTypes();  void SetFileTypeIndex();  void GetFileTypeIndex();
    void Advise();  void Unadvise();
    void SetOptions(uint fos);
    void GetOptions(out uint fos);
    void SetDefaultFolder(IntPtr psi);  void SetFolder(IntPtr psi);
    void GetFolder();  void GetCurrentSelection();
    void SetFileName([MarshalAs(UnmanagedType.LPWStr)] string n);
    void GetFileName();
    void SetTitle([MarshalAs(UnmanagedType.LPWStr)] string t);
    void SetOkButtonLabel();  void SetFileNameLabel();
    void GetResult([MarshalAs(UnmanagedType.Interface)] out IShellItem ppsi);
}

[ComImport, Guid("43826D1E-E718-42EE-BC55-A1E261C37BFE"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IShellItem {
    void BindToHandler();  void GetParent();
    void GetDisplayName(uint sigdn, [MarshalAs(UnmanagedType.LPWStr)] out string name);
}

public static class FolderPicker {
    public static string Pick(string title) {
        var dlg = (IFileDialog)new FileOpenDialogRCW();
        dlg.SetOptions(0x20);
        dlg.SetTitle(title);
        if (dlg.Show(IntPtr.Zero) != 0) return "";
        IShellItem item; dlg.GetResult(out item);
        string p; item.GetDisplayName(0x80058000, out p);
        return p ?? "";
    }
}
"@
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$p = [FolderPicker]::Pick("${TITLE}")
if ($p) { Write-Output $p }
`;

function pickWindows(): string {
  const scriptPath = join(tmpdir(), `pick-folder-${process.pid}.ps1`);
  try {
    // UTF-8 BOM (\uFEFF) is required for PowerShell 5.1 to read the file as UTF-8
    writeFileSync(scriptPath, "\uFEFF" + WIN_PS_SCRIPT.trimStart(), "utf8");
    return execFileSync("powershell", ["-NoProfile", "-STA", "-File", scriptPath], {
      encoding: "utf-8",
      timeout: 120_000,
    }).trim();
  } finally {
    try { unlinkSync(scriptPath); } catch {}
  }
}

function pickLinux(): string {
  // Try zenity (GNOME/GTK), then kdialog (KDE)
  try {
    return execSync(
      `zenity --file-selection --directory --title="${TITLE}" 2>/dev/null`,
      { encoding: "utf-8", timeout: 120_000 },
    ).trim();
  } catch {
    // zenity not found or cancelled — try kdialog
  }
  try {
    return execSync(
      `kdialog --getexistingdirectory "$HOME" --title "${TITLE}" 2>/dev/null`,
      { encoding: "utf-8", timeout: 120_000 },
    ).trim();
  } catch {
    // kdialog not found or cancelled
  }
  return "";
}

function pickMac(): string {
  // AppleScript — native Finder folder dialog
  const script = `osascript -e 'POSIX path of (choose folder with prompt "${TITLE}")'`;
  return execSync(script, { encoding: "utf-8", timeout: 120_000 }).trim();
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  try {
    const os = platform();
    let result = "";

    if (os === "win32") {
      result = pickWindows();
    } else if (os === "darwin") {
      result = pickMac();
    } else {
      result = pickLinux();
    }

    return result
      ? res.json({ cancelled: false, path: result })
      : res.json({ cancelled: true });
  } catch {
    return res.json({ cancelled: true });
  }
}
