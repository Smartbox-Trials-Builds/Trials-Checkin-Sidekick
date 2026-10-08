"""Create named ZIPs locally; never send filenames or file contents to SQL."""
from pathlib import Path
import os
import tempfile
import time
from zipfile import ZipFile, ZIP_DEFLATED


def zip_drop_folder(drop, final, names, progress=None):
    drop, final = Path(drop).resolve(), Path(final).resolve()
    if not drop.is_dir() or not final.is_dir() or drop == final:
        raise ValueError("Connect distinct, valid Drop and Final folders.")
    files = sorted((p for p in drop.iterdir() if p.is_file()), key=lambda p: p.name.lower())
    if not files:
        raise ValueError("The Drop folder is empty. Add this client's files first.")
    groups = {"gridName": [p for p in files if p.suffix.lower() == ".grid3user"],
              "checkinName": [p for p in files if p.suffix.lower() != ".grid3user"]}
    destinations = []
    for kind, group in groups.items():
        name = names.get(kind, "")
        if bool(group) != bool(name):
            raise ValueError("Drop files do not match the vocab types selected in Sidekick.")
        if not group:
            continue
        if (not isinstance(name, str) or not name.lower().endswith(".zip") or
                any(c in name for c in '<>:"/\\|?*') or any(ord(c) < 32 for c in name) or
                name != name.strip() or len(name) > 220 or Path(name).name != name):
            raise ValueError("Invalid ZIP filename.")
        target = final / name
        if target.exists():
            raise ValueError("A final ZIP with this name already exists. Move it before retrying.")
        destinations.append((target, group))
    if len({str(p).lower() for p, _ in destinations}) != len(destinations):
        raise ValueError("ZIP filenames must be different.")
    snapshot = {p: (p.stat().st_size, p.stat().st_mtime_ns) for p in files}
    staged, published = [], []
    total = sum(state[0] for state in snapshot.values()) or 1
    processed = 0
    last_report = 0
    def report(percent, phase, force=False):
        nonlocal last_report
        now = time.monotonic()
        if progress and (force or now - last_report >= 0.5):
            progress(percent, phase)
            last_report = now
    report(0, "zipping", True)
    try:
        for target, group in destinations:
            fd, temporary = tempfile.mkstemp(prefix=".sidekick-", suffix=".tmp", dir=final)
            os.close(fd)
            temporary = Path(temporary)
            staged.append((temporary, target))
            with ZipFile(temporary, "w", ZIP_DEFLATED) as archive:
                for path in group:
                    with path.open("rb") as source, archive.open(path.name, "w", force_zip64=True) as destination:
                        while True:
                            chunk = source.read(1024 * 1024)
                            if not chunk:
                                break
                            destination.write(chunk)
                            processed += len(chunk)
                            report(min(85, int(processed * 85 / total)), "zipping")
        report(90, "verifying", True)
        for temporary, _ in staged:
            with ZipFile(temporary) as archive:
                if archive.testzip() is not None:
                    raise ValueError("ZIP verification failed. Original files were retained.")
        if any((p.stat().st_size, p.stat().st_mtime_ns) != state for p, state in snapshot.items()):
            raise ValueError("Drop files changed while zipping. Original files were retained.")
        report(95, "saving", True)
        for temporary, target in staged:
            # On Windows, rename refuses to overwrite an existing destination.
            os.rename(temporary, target)
            published.append(target)
    except Exception:
        for temporary, _ in staged:
            temporary.unlink(missing_ok=True)
        for target in published:
            target.unlink(missing_ok=True)
        raise
    # Originals are removed only after both final archives have been verified.
    report(99, "cleanup", True)
    for path in files:
        path.unlink()
    return {"renamed": [p.name for p in published], "checkinName": names.get("checkinName", ""),
            "gridName": names.get("gridName", ""), "skipped": []}
