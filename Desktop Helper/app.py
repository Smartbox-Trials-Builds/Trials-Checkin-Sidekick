from __future__ import annotations

import json
import sys
import threading
import queue
import time
import subprocess
from helper_updates import HELPER_VERSION, UPDATE_REPOSITORY, check_updates, save_token, download_update
from urllib.error import HTTPError
from cloud_bridge import CloudBridge
from zip_engine import zip_drop_folder
import tkinter as tk
from dataclasses import dataclass
from pathlib import Path
from tkinter import filedialog, messagebox, simpledialog, ttk
from zipfile import ZIP_DEFLATED, ZipFile

APP_NAME = "Smartbox Vocab Zipper"
CONFIG_DIR = Path.home() / "AppData" / "Roaming" / "SmartboxVocabZipper"
CONFIG_PATH = CONFIG_DIR / "config.json"
GRID_USER_EXTENSION = ".grid3user"
GRID_USER_ZIP_NAME = "Current Grid User.zip"
CHECKIN_ZIP_NAME = "Current Checkin.zip"

SIDEKICK_BG = "#101722"
SIDEKICK_NAVY = "#e5edf7"
SIDEKICK_BLUE = "#79b8ff"
SIDEKICK_ORANGE = "#245c94"
SIDEKICK_MUTED = "#9badc4"
SIDEKICK_INPUT_BG = "#182333"
SIDEKICK_BORDER = "#30435b"
STATUS_CONNECTED = "#31c553"
STATUS_DISCONNECTED = "#d44a4a"


@dataclass
class AppConfig:
    drop_folder: str
    final_folder: str


class ConfigStore:
    def load(self) -> AppConfig | None:
        if not CONFIG_PATH.exists():
            return None
        try:
            data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return None

        drop_folder = data.get("drop_folder", "").strip()
        final_folder = data.get("final_folder", "").strip()
        if not drop_folder and not final_folder:
            return None
        return AppConfig(drop_folder=drop_folder, final_folder=final_folder)

    def save(self, config: AppConfig) -> None:
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        CONFIG_PATH.write_text(
            json.dumps(
                {
                    "drop_folder": config.drop_folder,
                    "final_folder": config.final_folder,
                },
                indent=2,
            ),
            encoding="utf-8",
        )


class SidekickDesktopApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title(APP_NAME + " v" + HELPER_VERSION)
        self.root.geometry("450x350")
        self.root.minsize(420, 340)

        self.config_store = ConfigStore()
        config = self.config_store.load()
        self.drop_folder = config.drop_folder if config else ""
        self.final_folder = config.final_folder if config else ""

        self.file_count_var = tk.StringVar(value="Files ready to zip: 0")
        self.zip_status_var = tk.StringVar(value="")
        self.bridge_status_var = tk.StringVar(value="Sidekick: not connected")
        self.drop_indicator_canvas: tk.Canvas | None = None
        self.final_indicator_canvas: tk.Canvas | None = None

        self._apply_theme()
        self._build_ui()
        self._refresh_connection_indicators()
        self.refresh_file_count()
        self.bridge = None
        self.updating = False
        self.bridge_gate = threading.Lock()
        self.bridge_events = queue.Queue()
        self.bridge_results = queue.Queue()
        self.root.after(250, self._handle_bridge_events)

    def _apply_theme(self) -> None:
        self.root.configure(bg=SIDEKICK_BG)
        style = ttk.Style(self.root)
        style.theme_use("clam")

        style.configure("Root.TFrame", background=SIDEKICK_BG)
        style.configure("Card.TFrame", background=SIDEKICK_INPUT_BG)
        style.configure("Card.TLabel", background=SIDEKICK_INPUT_BG, foreground=SIDEKICK_MUTED, font=("Segoe UI", 9))
        style.configure("Compact.TButton", background=SIDEKICK_INPUT_BG, foreground=SIDEKICK_NAVY, font=("Segoe UI", 8), padding=(6, 4), borderwidth=1, bordercolor=SIDEKICK_BORDER)
        style.configure("TLabel", background=SIDEKICK_BG, foreground=SIDEKICK_NAVY, font=("Segoe UI", 9))
        style.configure("Title.TLabel", background=SIDEKICK_BG, foreground=SIDEKICK_NAVY, font=("Segoe UI", 16, "bold"))
        style.configure("Subtitle.TLabel", background=SIDEKICK_BG, foreground=SIDEKICK_MUTED, font=("Segoe UI", 10))
        style.configure("Field.TLabel", background=SIDEKICK_BG, foreground=SIDEKICK_NAVY, font=("Segoe UI", 9, "bold"))

        style.configure(
            "Primary.TButton",
            background=SIDEKICK_ORANGE,
            foreground="#e0e0e0",
            font=("Segoe UI", 10, "bold"),
            bordercolor=SIDEKICK_BORDER,
            borderwidth=1,
            padding=(9, 5),
        )
        style.map("Primary.TButton", background=[("active", "#005599"), ("pressed", "#002a55")])

        style.configure(
            "Secondary.TButton",
            background=SIDEKICK_INPUT_BG,
            foreground=SIDEKICK_NAVY,
            font=("Segoe UI", 10, "bold"),
            bordercolor=SIDEKICK_BORDER,
            borderwidth=1,
            padding=(12, 7),
        )
        style.map("Secondary.TButton", background=[("active", "#253951"), ("pressed", "#1b2b40")])

        style.configure(
            "TEntry",
            fieldbackground=SIDEKICK_INPUT_BG,
            foreground=SIDEKICK_NAVY,
            bordercolor=SIDEKICK_BORDER,
        )

    def _build_ui(self) -> None:
        root_frame = ttk.Frame(self.root, padding=12, style="Root.TFrame")
        root_frame.pack(fill=tk.BOTH, expand=True)
        header = ttk.Frame(root_frame, style="Root.TFrame")
        header.pack(fill=tk.X)
        ttk.Label(header, text="Vocab Zipper", style="Title.TLabel").pack(side=tk.LEFT)
        self.update_button = ttk.Button(header, text="Check for updates", style="Compact.TButton", command=self.check_for_updates)
        self.update_button.pack(side=tk.RIGHT)
        ttk.Label(root_frame, text="Desktop companion  ·  v" + HELPER_VERSION, style="Subtitle.TLabel").pack(anchor="w", pady=(2, 10))
        self.folder_labels = {}
        self._build_folder_row(root_frame, "Drop folder", self.select_drop_folder, "drop")
        self._build_folder_row(root_frame, "Final folder", self.select_final_folder, "final")
        info_box = ttk.Frame(root_frame, style="Root.TFrame")
        info_box.pack(fill=tk.X, pady=(5, 8))
        ttk.Label(info_box, textvariable=self.file_count_var, style="Field.TLabel").pack(side=tk.LEFT)
        ttk.Button(info_box, text="Refresh", style="Compact.TButton", command=self.refresh_file_count).pack(side=tk.RIGHT)
        actions = ttk.Frame(root_frame, style="Root.TFrame")
        actions.pack(fill=tk.X)
        actions.columnconfigure(0, weight=1)
        actions.columnconfigure(1, weight=1)
        ttk.Button(actions, text="Connect to Sidekick", style="Primary.TButton", command=self.connect_sidekick).grid(row=0, column=0, sticky="ew", padx=(0, 5))
        ttk.Button(actions, text="Zip & Move Files", style="Secondary.TButton", command=self.zip_and_move_files).grid(row=0, column=1, sticky="ew")
        status_card = ttk.Frame(root_frame, padding=8, style="Card.TFrame")
        status_card.pack(fill=tk.X, pady=(10, 0))
        ttk.Label(status_card, textvariable=self.bridge_status_var, style="Card.TLabel", wraplength=375).pack(anchor="w")
        ttk.Label(status_card, textvariable=self.zip_status_var, style="Card.TLabel", wraplength=375).pack(anchor="w", pady=(3, 0))

    def _build_folder_row(self, parent, label, browse_command, indicator_name):
        row = ttk.Frame(parent, padding=(8, 6), style="Card.TFrame")
        row.pack(fill=tk.X, pady=(0, 5))
        indicator = tk.Canvas(row, width=12, height=12, bg=SIDEKICK_INPUT_BG, highlightthickness=0, bd=0)
        indicator.create_oval(2, 2, 10, 10, fill=STATUS_DISCONNECTED, outline=STATUS_DISCONNECTED)
        indicator.pack(side=tk.LEFT, padx=(0, 7))
        setattr(self, indicator_name + "_indicator_canvas", indicator)
        copy = ttk.Frame(row, style="Card.TFrame")
        copy.pack(side=tk.LEFT, fill=tk.X, expand=True)
        ttk.Label(copy, text=label, style="Card.TLabel").pack(anchor="w")
        variable = tk.StringVar(value="Not connected")
        self.folder_labels[indicator_name] = variable
        ttk.Label(copy, textvariable=variable, style="Card.TLabel", width=25).pack(anchor="w")
        ttk.Button(row, text="Choose", style="Compact.TButton", command=browse_command).pack(side=tk.RIGHT, padx=(6, 0))

    @staticmethod
    def _is_connected(path: str) -> bool:
        return bool(path) and Path(path).is_dir()

    def _set_indicator_color(self, indicator_canvas: tk.Canvas | None, is_connected: bool) -> None:
        if indicator_canvas is None:
            return
        color = STATUS_CONNECTED if is_connected else STATUS_DISCONNECTED
        indicator_canvas.itemconfig(1, fill=color, outline=color)

    def _refresh_connection_indicators(self) -> None:
        for key, path in [("drop", self.drop_folder), ("final", self.final_folder)]:
            name = Path(path).name if path else "Not connected"
            self.folder_labels[key].set(name if len(name) <= 27 else name[:24] + "…")
        self._set_indicator_color(self.drop_indicator_canvas, self._is_connected(self.drop_folder))
        self._set_indicator_color(self.final_indicator_canvas, self._is_connected(self.final_folder))

    def select_drop_folder(self) -> None:
        selected = filedialog.askdirectory(parent=self.root, title="Select Drop folder", initialdir=self.drop_folder or str(Path.home()))
        if selected:
            self.drop_folder = selected
            self._refresh_connection_indicators()
            self._save_config()
            self.refresh_file_count()

    def select_final_folder(self) -> None:
        selected = filedialog.askdirectory(parent=self.root, title="Select Final folder", initialdir=self.final_folder or str(Path.home()))
        if selected:
            self.final_folder = selected
            self._refresh_connection_indicators()
            self._save_config()

    def _save_config(self) -> None:
        self.config_store.save(AppConfig(drop_folder=self.drop_folder, final_folder=self.final_folder))

    def _drop_files(self) -> list[Path]:
        if not self.drop_folder:
            return []
        drop_path = Path(self.drop_folder)
        if not drop_path.is_dir():
            return []
        return sorted([path for path in drop_path.iterdir() if path.is_file()], key=lambda p: p.name.lower())

    def refresh_file_count(self) -> None:
        file_count = len(self._drop_files())
        self.file_count_var.set(f"Files ready to zip: {file_count}")

    def check_for_updates(self):
        self.update_button.configure(state="disabled")
        def worker():
            try:
                self.bridge_events.put(("update", check_updates()))
            except HTTPError as exc:
                self.bridge_events.put(("update", {"state": "auth" if exc.code in (401,403,404) else "error", "url": f"https://github.com/{UPDATE_REPOSITORY}/releases"}))
            except Exception:
                self.bridge_events.put(("update", {"state": "error", "url": f"https://github.com/{UPDATE_REPOSITORY}/releases"}))
        threading.Thread(target=worker, daemon=True).start()

    def download_and_install_update(self, update):
        self.update_button.configure(state="disabled")
        def worker():
            try:
                path = download_update(update, CONFIG_DIR / "Updates", lambda percent: self.bridge_events.put(("download_progress", percent)))
                self.bridge_events.put(("installer_ready", path))
            except Exception as exc:
                self.bridge_events.put(("update_failed", str(exc)))
        threading.Thread(target=worker, daemon=True).start()

    def _launch_update_when_idle(self, installer):
        if not self.bridge_gate.acquire(blocking=False):
            self.root.after(500, lambda: self._launch_update_when_idle(installer))
            return
        try:
            if self.bridge and (self.bridge.state.get("active_job") or self.bridge.state.get("pending_ack")):
                self.root.after(500, lambda: self._launch_update_when_idle(installer))
                return
            arguments = [str(installer), "/SILENT", "/SUPPRESSMSGBOXES", "/NORESTART"]
            if getattr(sys, "frozen", False):
                arguments.append("/DIR=" + str(Path(sys.executable).parent))
            subprocess.Popen(arguments, close_fds=True)
            self.root.destroy()
        except Exception as exc:
            self.updating = False
            self.update_button.configure(state="normal")
            messagebox.showerror(APP_NAME, "Could not start the installer. " + str(exc))
        finally:
            self.bridge_gate.release()

    def connect_sidekick(self):
        if self.bridge is None:
            try:
                self.bridge = CloudBridge(CONFIG_DIR / "sidekick-bridge.json")
            except Exception:
                messagebox.showerror(APP_NAME, "Could not initialize pairing. Install the updated helper dependencies.")
                return
            threading.Thread(target=self._bridge_loop, daemon=True).start()
        self.root.clipboard_clear()
        self.root.clipboard_append(self.bridge.state["code"])
        messagebox.showinfo(APP_NAME, "Pairing code copied. In Sidekick User settings, paste it under Desktop zipper and click Pair helper. Keep this helper open. Treat the code as private.")

    def _bridge_loop(self):
        while True:
            try:
                if self.updating:
                    self.bridge.flush_ack()
                    time.sleep(0.5)
                    continue
                with self.bridge_gate:
                    job = self.bridge.poll()
                self.bridge_events.put(("connected", None))
                if job:
                    try:
                        names = self.bridge.decrypt(job)
                        self.bridge_events.put(("zip", (job["id"], names)))
                        while True:
                            ok, result = self.bridge_results.get()
                            if ok is not None:
                                break
                            try:
                                self.bridge.rpc("zip_progress", {"p_id": job["id"], "p_percent": result["percent"], "p_phase": result["phase"]})
                            except Exception:
                                pass
                    except Exception:
                        ok, result = False, {"error": "The encrypted request could not be read. Check pairing."}
                    self.bridge.complete(job["id"], ok, result)
            except Exception:
                self.bridge_events.put(("offline", None))
            time.sleep(2)

    def _handle_bridge_events(self):
        try:
            while True:
                kind, data = self.bridge_events.get_nowait()
                if kind == "update":
                    self.update_button.configure(state="normal")
                    if data["state"] == "auth":
                        token = simpledialog.askstring(APP_NAME, "Private GitHub updates require your own token. Use a fine-grained token limited to this repository with Contents: Read-only. Paste token (stored with Windows encryption):", show="*", parent=self.root)
                        if token:
                            try:
                                save_token(token)
                                self.check_for_updates()
                            except Exception:
                                messagebox.showerror(APP_NAME, "Could not save the GitHub access token.")
                    elif data["state"] == "current":
                        messagebox.showinfo(APP_NAME, "You have the latest published zipper version (" + HELPER_VERSION + ").")
                    elif data["state"] == "available":
                        if messagebox.askyesno(APP_NAME, "Zipper " + data["version"] + " is available. Download and install it now? The zipper will close after the download is verified. Your folders and pairing will be kept."):
                            self.download_and_install_update(data)
                    else:
                        messagebox.showerror(APP_NAME, "Could not check for a published zipper update. Check your connection and try again.")
                elif kind == "download_progress":
                    self.bridge_status_var.set(f"Downloading update: {data}%")
                elif kind == "installer_ready":
                    self.updating = True
                    self.bridge_status_var.set("Update verified. Waiting for active ZIP requests to finish…")
                    self._launch_update_when_idle(data)
                elif kind == "update_failed":
                    self.updating = False
                    self.update_button.configure(state="normal")
                    messagebox.showerror(APP_NAME, "Update was not started. " + data)
                elif kind == "connected":
                    self.bridge_status_var.set("Sidekick: online — ready for Next Step")
                elif kind == "offline":
                    self.bridge_status_var.set("Sidekick: offline — retrying")
                elif kind == "zip":
                    self.zip_status_var.set("Sidekick requested zipping…")
                    self.root.update_idletasks()
                    try:
                        def progress(percent, phase):
                            self.zip_status_var.set(f"{phase.title()}: {percent}%")
                            self.root.update_idletasks()
                            self.bridge_results.put((None, {"percent": percent, "phase": phase}))
                        result = zip_drop_folder(self.drop_folder, self.final_folder, data[1], progress=progress)
                        self.zip_status_var.set("ZIPs saved with final names. Sidekick can continue.")
                        self.bridge_results.put((True, result))
                    except Exception as exc:
                        self.zip_status_var.set("Zipping failed. Check folders and files.")
                        self.bridge_results.put((False, {"error": str(exc)}))
                    self.refresh_file_count()
        except queue.Empty:
            pass
        self.root.after(250, self._handle_bridge_events)

    def zip_and_move_files(self) -> None:
        if self.bridge is not None:
            messagebox.showinfo(APP_NAME, "Connected to Sidekick. Use Next Step in the extension to zip with final filenames.")
            return
        self.zip_status_var.set("")
        if not self.drop_folder or not Path(self.drop_folder).is_dir():
            messagebox.showerror(APP_NAME, "Please connect a valid Drop folder.")
            return
        if not self.final_folder:
            messagebox.showerror(APP_NAME, "Please connect a Final folder.")
            return

        final_path = Path(self.final_folder)
        final_path.mkdir(parents=True, exist_ok=True)

        files_to_process = self._drop_files()
        if not files_to_process:
            messagebox.showinfo(APP_NAME, "There are no files in the Drop folder to zip.")
            self.refresh_file_count()
            return

        grid_files = [path for path in files_to_process if path.suffix.lower() == GRID_USER_EXTENSION]
        checkin_files = [path for path in files_to_process if path.suffix.lower() != GRID_USER_EXTENSION]

        try:
            self.zip_status_var.set("Zipping files please wait")
            self.root.update_idletasks()

            if grid_files:
                grid_zip_path = final_path / GRID_USER_ZIP_NAME
                self._create_zip(grid_zip_path, grid_files)

            if checkin_files:
                checkin_zip_path = final_path / CHECKIN_ZIP_NAME
                self._create_zip(checkin_zip_path, checkin_files)

            for file_path in files_to_process:
                file_path.unlink()

            self.refresh_file_count()
            self.zip_status_var.set(
                "Finished zipping You can now start your Checkin with the Sidekick extension"
            )
        except OSError as exc:
            self.zip_status_var.set("")
            messagebox.showerror(APP_NAME, f"Unable to complete zipping.\n\n{exc}")

    @staticmethod
    def _create_zip(
        zip_path: Path,
        files: list[Path],
    ) -> None:
        if zip_path.exists():
            zip_path.unlink()

        with ZipFile(zip_path, "w", compression=ZIP_DEFLATED) as zip_file:
            for file_path in files:
                zip_file.write(file_path, arcname=file_path.name)


def main() -> None:
    if "--self-test" in sys.argv:
        import tempfile
        from zipfile import ZipFile
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            drop, final = base / "drop", base / "final"
            drop.mkdir(); final.mkdir()
            (drop / "fake.grid3user").write_bytes(b"grid")
            (drop / "fake.sps").write_bytes(b"checkin")
            result = zip_drop_folder(drop, final, {"gridName": "Fake Grid.zip", "checkinName": "Fake Checkin.zip"})
            assert len(result["renamed"]) == 2
            assert not list(drop.iterdir())
            with ZipFile(final / "Fake Grid.zip") as archive:
                assert archive.namelist() == ["fake.grid3user"]
            CloudBridge(base / "bridge.json")
        return
    root = tk.Tk()
    SidekickDesktopApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
