from pathlib import Path
import shlex

import minecraft_launcher_lib


ROOT = Path(__file__).resolve().parent.parent
MINECRAFT_DIR = ROOT / "test" / "minecraft"
VERSION = "1.21.5"

# Placeholders for command generation only
options = {
    "username": "TestPlayer",
    "uuid": "",
    "token": "",
}


def main():
    print(f"Minecraft directory: {MINECRAFT_DIR}")
    print(f"Target version: {VERSION}")

    if not MINECRAFT_DIR.exists():
        raise FileNotFoundError(MINECRAFT_DIR)

    installed_versions = minecraft_launcher_lib.utils.get_installed_versions(
        str(MINECRAFT_DIR)
    )

    installed_ids = [version["id"] for version in installed_versions]

    if VERSION not in installed_ids:
        raise RuntimeError(
            f"{VERSION} is not installed. Found: {installed_ids}"
        )

    print("Generating launch command...")

    command = minecraft_launcher_lib.command.get_minecraft_command(
        VERSION,
        str(MINECRAFT_DIR),
        options
    )

    print("\nLaunch command generated successfully:")
    print(shlex.join(command))

    print("\nCommand generated only. Minecraft was not launched.")


if __name__ == "__main__":
    main()
