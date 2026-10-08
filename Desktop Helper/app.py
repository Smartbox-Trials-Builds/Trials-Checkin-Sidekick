from __future__ import annotations

import json
import sys
import threading
import queue
import time
import webbrowser
from helper_updates import HELPER_VERSION, UPDATE_REPOSITORY, check_updates, save_token
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

SIDEKICK_BG = "#121212"
SIDEKICK_NAVY = "#e0e0e0"
SIDEKICK_BLUE = "#81cfff"
SIDEKICK_ORANGE = "#003366"
SIDEKICK_MUTED = "#d5e9ff"
SIDEKICK_INPUT_BG = "#2a2a3a"
SIDEKICK_BORDER = "#81cfff"
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
        self.root.geometry("700x400")
        self.root.minsize(680, 360)

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
        self.bridge_events = queue.Queue()
        self.bridge_results = queue.Queue()
        self.root.after(250, self._handle_bridge_events)

    def _apply_theme(self) -> None:
        self.root.configure(bg=SIDEKICK_BG)
        style = ttk.Style(self.root)
        style.theme_use("clam")

        style.configure("Root.TFrame", background=SIDEKICK_BG)
        style.configure("TLabel", background=SIDEKICK_BG, foreground=SIDEKICK_NAVY, font=("Segoe UI", 10))
        style.configure("Title.TLabel", background=SIDEKICK_BG, foreground=SIDEKICK_NAVY, font=("Segoe UI", 19, "bold"))
        style.configure("Subtitle.TLabel", background=SIDEKICK_BG, foreground=SIDEKICK_MUTED, font=("Segoe UI", 10))
        style.configure("Field.TLabel", background=SIDEKICK_BG, foreground=SIDEKICK_NAVY, font=("Segoe UI", 10, "bold"))

        style.configure(
            "Primary.TButton",
            background=SIDEKICK_ORANGE,
            foreground="#e0e0e0",
            font=("Segoe UI", 10, "bold"),
            bordercolor=SIDEKICK_BORDER,
            borderwidth=1,
            padding=(12, 7),
        )
        style.map("Primary.TButton", background=[("active", "#005599"), ("pressed", "#002a55")])

        style.configure(
            "Secondary.TButton",
            background=SIDEKICK_BLUE,
            foreground="#121212",
            font=("Segoe UI", 10, "bold"),
            bordercolor=SIDEKICK_BORDER,
            borderwidth=1,
            padding=(12, 7),
        )
        style.map("Secondary.TButton", background=[("active", "#9ad8ff"), ("pressed", "#66bfff")])

        style.configure(
            "TEntry",
            fieldbackground=SIDEKICK_INPUT_BG,
            foreground=SIDEKICK_NAVY,
            bordercolor=SIDEKICK_BORDER,
        )

    def _build_ui(self) -> None:
        root_frame = ttk.Frame(self.root, padding=20, style="Root.TFrame")
        root_frame.pack(fill=tk.BOTH, expand=True)

        header = ttk.Frame(root_frame, style="Root.TFrame")
        header.pack(fill=tk.X)
        ttk.Label(header, text=APP_NAME + " v" + HELPER_VERSION, style="Title.TLabel").pack(side=tk.LEFT)
        self.update_button = ttk.Button(header, text="Check for updates", command=self.check_for_updates)
        self.update_button.pack(side=tk.RIGHT)
        ttk.Label(
            root_frame,
            text="Connect your Drop and Final folders, then zip and move check-in files in one click.",
            style="Subtitle.TLabel",
        ).pack(anchor="w", pady=(0, 20))

        self._build_folder_row(
            parent=root_frame,
            label="Drop folder",
            browse_command=self.select_drop_folder,
            indicator_name="drop",
        )
        self._build_folder_row(
            parent=root_frame,
            label="Final folder",
            browse_command=self.select_final_folder,
            indicator_name="final",
        )

        info_box = ttk.Frame(root_frame, style="Root.TFrame")
        info_box.pack(fill=tk.X, pady=(10, 12))
        ttk.Label(info_box, textvariable=self.file_count_var, style="Field.TLabel").pack(side=tk.LEFT)
        ttk.Button(info_box, text="Refresh", style="Secondary.TButton", command=self.refresh_file_count).pack(side=tk.LEFT, padx=(10, 0))

        actions = ttk.Frame(root_frame, style="Root.TFrame")
        actions.pack(fill=tk.X)
        ttk.Button(actions, text="Connect to Sidekick", command=self.connect_sidekick).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(actions, text="Zip & Move Files", style="Primary.TButton", command=self.zip_and_move_files).pack(side=tk.LEFT)
        ttk.Label(root_frame, textvariable=self.bridge_status_var, style="Field.TLabel").pack(anchor="w", pady=(8, 0))
        ttk.Label(root_frame, textvariable=self.zip_status_var, style="Field.TLabel", wraplength=640).pack(anchor="w", pady=(4, 0))

    def _build_folder_row(self, parent: ttk.Frame, label: str, browse_command, indicator_name: str) -> None:
        row = ttk.Frame(parent, style="Root.TFrame")
        row.pack(fill=tk.X, pady=(0, 10))
        ttk.Label(row, text=f"{label}:", style="Field.TLabel", width=12).pack(side=tk.LEFT)
        indicator_canvas = tk.Canvas(
            row,
            width=14,
            height=14,
            bg=SIDEKICK_BG,
            highlightthickness=0,
            bd=0,
        )
        indicator_canvas.create_oval(2, 2, 12, 12, fill=STATUS_DISCONNECTED, outline=STATUS_DISCONNECTED)
        indicator_canvas.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(8, 8))
        if indicator_name == "drop":
            self.drop_indicator_canvas = indicator_canvas
        elif indicator_name == "final":
            self.final_indicator_canvas = indicator_canvas
        ttk.Button(row, text="Connect", style="Secondary.TButton", command=browse_command).pack(side=tk.RIGHT)

    @staticmethod
    def _is_connected(path: str) -> bool:
        return bool(path) and Path(path).is_dir()

    def _set_indicator_color(self, indicator_canvas: tk.Canvas | None, is_connected: bool) -> None:
        if indicator_canvas is None:
            return
        color = STATUS_CONNECTED if is_connected else STATUS_DISCONNECTED
        indicator_canvas.itemconfig(1, fill=color, outline=color)

    def _refresh_connection_indicators(self) -> None:
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
                        if messagebox.askyesno(APP_NAME, "Zipper " + data["version"] + " is available. Download its installer? Close this helper before installing. Your folders and pairing are saved separately."):
                            webbrowser.open(data["url"])
                    elif messagebox.askyesno(APP_NAME, "Could not check for a published zipper update. Open GitHub Releases in your browser? Private repositories require GitHub access."):
                        webbrowser.open(data["url"])
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
