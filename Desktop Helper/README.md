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

This creates `dist/SmartboxVocabZipper.exe`.

### 3) Run on Windows

1. Open `dist/SmartboxVocabZipper.exe`.
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
