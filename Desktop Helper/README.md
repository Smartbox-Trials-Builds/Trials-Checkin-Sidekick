# Smartbox Vocab Zipper (Python)

A lightweight desktop helper app for quickly zipping and moving Smartbox vocabulary/check-in files.

## What the app does

- Prompts users to connect two folders:
  - **Drop folder**
  - **Final folder**
- Shows how many files are currently in the Drop folder and ready to zip.
- Uses **Zip & Move Files** to package files from Drop and place ZIPs in Final.
- Splits ZIP output into:
  - `Current Grid User.zip` for `.grid3user` files only.
  - `Current Checkin.zip` for all other file types.
- Deletes the original files from the Drop folder after successful zipping.
- Shows a completion prompt that the user can return to the CRM Sidekick Extension.

## Run locally

```bash
python app.py
```

## Notes

- Folder selections are saved to:
  - `%AppData%\SmartboxVocabZipper\config.json`
- Existing ZIP names are overwritten on each run:
  - `Current Grid User.zip`
  - `Current Checkin.zip`

## Package as a desktop app (PyInstaller)

### Prerequisites

- Windows machine
- Python 3.10+ installed

### 1) Install build dependencies

```bash
pip install -r requirements-build.txt
```

### 2) Build the EXE

Run:

```bash
python scripts/build-installer.py --clean
```

This creates `dist-updates/SmartboxVocabZipper.exe`.

### 3) Run on Windows

1. Open `dist-updates/SmartboxVocabZipper.exe`.
2. (Optional) Create a shortcut manually for easier access.

## Connect to Sidekick through Supabase

1. Install the updated helper (or install requirements-build.txt and run app.py).
2. Choose distinct Drop and Final folders. Put only the current client's files in Drop.
3. Click **Connect to Sidekick**; a private pairing code is copied.
4. In the extension, open **User settings → Desktop zipper**, paste the code and click **Pair helper**.
5. Keep the helper open. Click **Next Step** in Check-in; do not click Zip & Move Files first.

Sidekick supplies its existing final filenames. The helper separates .grid3user files, verifies both archives, then removes originals. Existing final filenames and mismatched vocab types stop the request. Sidekick waits for success before proceeding with the CRM note. Filenames and results use AES-256-GCM encryption; Supabase stores encrypted envelopes and job status, never plaintext client names or file contents. The pairing key and desktop auth session remain local in sidekick-bridge.json. Treat the pairing code as private. Reopening the helper requires clicking Connect to Sidekick again.

If a request is interrupted, check Final and Drop folders before retrying. A pending acknowledgement is retried without zipping again. On helper restart during a job, Sidekick receives an error rather than automatically processing another client's files. Unpaired extension users retain the existing manual ZIP/rename workflow.

## Check for updates

The helper's **Check for updates** button checks published GitHub Releases in Smartbox-Trials-Builds/Trials-Checkin-Sidekick. Releases must include SmartboxVocabZipper.exe and use tags such as zipper-v1.2.0. Extension-only releases and prereleases are skipped.

Because the repository is private, users need GitHub access plus their own fine-grained access token limited to this repository with Contents: Read-only. The helper prompts for this token on the first check; Windows DPAPI encrypts the saved token for the current Windows user. If the token expires, enter a replacement when prompted. Downloads open in the browser, where users must also be signed into a GitHub account with repository access. Close the helper before replacing its executable. Folder selections, pairing, and update credentials remain saved separately.

## Installable Windows package

Download SmartboxVocabZipper-Setup-1.2.1.exe from the full Sidekick V3.0.2 release. Install for your Windows user; no administrator access or Python installation is required. Start-menu and optional desktop shortcuts are provided. Uninstall through Windows Installed apps. Saved AppData folders and pairing are retained during upgrades and uninstall.

The repository is now public: GitHub sign-in and update tokens are not required. Future update checks prefer versioned Windows installer assets over portable executable downloads, including in combined Sidekick releases.

### Live ZIP progress (helper 1.2.2)

Sidekick now requires the paired helper when vocabulary is returned; its former Saved Zips Folder/rename fallback is removed. The helper reports compression progress by bytes, archive verification, final saving and cleanup through authenticated Supabase progress updates. The extension polls those updates while waiting. Progress carries no client names or filenames. Keep helper 1.2.2 open. Vocab NOT returned still skips zipping.

### In-app update installation (helper 1.2.3)

After confirming an available update, the helper downloads its Windows installer directly without opening a browser. It verifies the exact download size and GitHub SHA-256 asset digest before execution, waits for active ZIP requests and acknowledgements, closes the helper, and launches the installer. Silent updates relaunch the helper after installation. Download/verification failures leave the current helper open. Folder settings and pairing remain in AppData. Older helper versions require installing 1.2.3 once before this in-app update flow is available.
