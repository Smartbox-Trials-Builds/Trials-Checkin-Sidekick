"""Check official GitHub releases; downloads open in the user's browser."""
import json
import re
import urllib.request
import ctypes
import hashlib
from ctypes import wintypes
from pathlib import Path

HELPER_VERSION = "1.2.3"
UPDATE_REPOSITORY = "Smartbox-Trials-Builds/Trials-Checkin-Sidekick"
ASSET_NAME = "SmartboxVocabZipper.exe"
TOKEN_PATH = Path.home() / "AppData" / "Roaming" / "SmartboxVocabZipper" / "github-update-token.bin"


class Blob(ctypes.Structure):
    _fields_ = [("size", wintypes.DWORD), ("data", ctypes.POINTER(ctypes.c_ubyte))]


def protect_token(value, decrypt=False):
    buffer = (ctypes.c_ubyte * len(value)).from_buffer_copy(value)
    source, destination = Blob(len(value), buffer), Blob()
    crypt = ctypes.WinDLL("crypt32", use_last_error=True)
    function = crypt.CryptUnprotectData if decrypt else crypt.CryptProtectData
    function.argtypes = [ctypes.POINTER(Blob), ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p,
                         ctypes.c_void_p, wintypes.DWORD, ctypes.POINTER(Blob)]
    function.restype = wintypes.BOOL
    if not function(ctypes.byref(source), None, None, None, None, 1, ctypes.byref(destination)):
        raise ctypes.WinError(ctypes.get_last_error())
    try:
        return ctypes.string_at(destination.data, destination.size)
    finally:
        free = ctypes.WinDLL("kernel32").LocalFree
        free.argtypes = [ctypes.c_void_p]
        free(destination.data)


def save_token(token):
    TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_PATH.write_bytes(protect_token(token.strip().encode()))


def read_token():
    try:
        return protect_token(TOKEN_PATH.read_bytes(), decrypt=True).decode()
    except (OSError, ValueError):
        return None


def version_tuple(tag):
    match = re.fullmatch(r"(?:zipper-)?[vV]?(\d+)\.(\d+)\.(\d+)", tag)
    return tuple(map(int, match.groups())) if match else None


def check_updates():
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "Sidekick-Zipper/" + HELPER_VERSION}
    token = read_token()
    if token:
        headers["Authorization"] = "Bearer " + token
    request = urllib.request.Request(
        f"https://api.github.com/repos/{UPDATE_REPOSITORY}/releases?per_page=100",
        headers=headers,
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        releases = json.load(response)
    candidates = []
    for release in releases:
        if release.get("draft") or release.get("prerelease"):
            continue
        for asset in release.get("assets", []):
            name = asset.get("name", "")
            installer = re.fullmatch(r"SmartboxVocabZipper-Setup-(\d+\.\d+\.\d+)\.exe", name)
            version = version_tuple(installer.group(1)) if installer else version_tuple(release.get("tag_name", "")) if release.get("tag_name", "").startswith("zipper-") and name == ASSET_NAME else None
            url = asset.get("browser_download_url", "")
            if version and url.startswith(f"https://github.com/{UPDATE_REPOSITORY}/releases/download/"):
                candidates.append({"version_tuple": version, "installer": bool(installer), "url": url,
                                   "digest": asset.get("digest"), "size": asset.get("size"), "name": name})
    if not candidates:
        return {"state": "unavailable", "url": f"https://github.com/{UPDATE_REPOSITORY}/releases"}
    chosen = max(candidates, key=lambda item: (item["version_tuple"], item["installer"]))
    return {**chosen, "state": "available" if chosen["version_tuple"] > version_tuple(HELPER_VERSION) else "current",
            "version": '.'.join(map(str,chosen["version_tuple"]))}


def download_update(update, folder, progress=None):
    if not update.get("installer") or not re.fullmatch(r"SmartboxVocabZipper-Setup-\d+\.\d+\.\d+\.exe", update.get("name", "")):
        raise ValueError("This release does not have a supported Windows installer.")
    digest = update.get("digest", "") or ""
    if not re.fullmatch(r"sha256:[a-fA-F0-9]{64}", digest):
        raise ValueError("The release has no verified SHA-256 digest. Update was not started.")
    if not update["url"].startswith(f"https://github.com/{UPDATE_REPOSITORY}/releases/download/"):
        raise ValueError("Invalid update download source.")
    expected_size = update.get("size")
    if not isinstance(expected_size, int) or not 1024 <= expected_size <= 200 * 1024 * 1024:
        raise ValueError("Invalid installer size.")
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / update["name"]
    partial = target.with_suffix(".part")
    received = 0
    checksum = hashlib.sha256()
    try:
        request = urllib.request.Request(update["url"], headers={"User-Agent": "Sidekick-Zipper/" + HELPER_VERSION})
        with urllib.request.urlopen(request, timeout=30) as response, partial.open("wb") as output:
            while True:
                chunk = response.read(256 * 1024)
                if not chunk:
                    break
                received += len(chunk)
                if received > expected_size:
                    raise ValueError("Installer size verification failed.")
                checksum.update(chunk)
                output.write(chunk)
                if progress:
                    progress(int(received * 100 / expected_size))
        if received != expected_size or checksum.hexdigest() != digest.split(":", 1)[1].lower():
            raise ValueError("Installer verification failed. The zipper will remain open.")
        partial.replace(target)
        return target
    except Exception:
        partial.unlink(missing_ok=True)
        raise
