"""Check official GitHub releases; downloads open in the user's browser."""
import json
import re
import urllib.request
import ctypes
from ctypes import wintypes
from pathlib import Path

HELPER_VERSION = "1.2.2"
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
                candidates.append((version, bool(installer), url))
    if not candidates:
        return {"state": "unavailable", "url": f"https://github.com/{UPDATE_REPOSITORY}/releases"}
    version, installer, url = max(candidates)
    return {"state": "available" if version > version_tuple(HELPER_VERSION) else "current", "version": '.'.join(map(str,version)), "url": url}
