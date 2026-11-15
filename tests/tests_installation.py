
import json
from pathlib import Path
from datetime import datetime

import minecraft_launcher_lib

ROOT = Path(__file__).resolve().parent.parent
TEST_DIR = ROOT / "test" / "minecraft"
VERSION = "1.21.5"

TEST_DIR.mkdir(parents=True, exist_ok=True)

current_max = 0
last_status = ""

def log(message):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}", flush=True)


def set_status(status):
    global last_status
    last_status = status
    log(f"STATUS: {status}")


def set_max(value):
    global current_max
    current_max = value
    log(f"TOTAL TASKS: {value}")


def set_progress(value):
    if current_max:
        percentage = (value / current_max) * 100
        print(
            f"\r[{value}/{current_max}] {percentage:.1f}% | {last_status}",
            end="",
            flush=True
        )


callback = {
    "setStatus": set_status,
    "setProgress": set_progress,
    "setMax": set_max,
}

log(f"System Minecraft directory: {minecraft_launcher_lib.utils.get_minecraft_directory()}")
log(f"Installation directory: {TEST_DIR}")
log(f"Target version: {VERSION}")

log("Starting installation...")

try:
    minecraft_launcher_lib.install.install_minecraft_version(
        VERSION,
        str(TEST_DIR),
        callback=callback
    )

    print()
    log("INSTALLATION COMPLETE")

except Exception as error:
    print()
    log(f"INSTALLATION FAILED: {error}")
    raise

log("Installed versions:")
print(json.dumps(
    minecraft_launcher_lib.utils.get_installed_versions(str(TEST_DIR)),
    indent=4
))

log("Installation directory contents:")

for path in TEST_DIR.rglob("*"):
    if path.is_file():
        print(f"  FILE  {path.relative_to(TEST_DIR)} ({path.stat().st_size:,} bytes)")
    elif path.is_dir():
        print(f"  DIR   {path.relative_to(TEST_DIR)}/")
