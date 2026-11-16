from pathlib import Path
import os
import re
import json
import minecraft_launcher_lib

APP_DATA_PATH = os.path.join(f"{Path(__file__).resolve().parent}", ".BOX")

def get_instance_path(instance_name):
    instance_path = os.path.join(APP_DATA_PATH, "instances", instance_name)
    return instance_path

def write_instance_data(instance_data):
    try:
        instance_path = get_instance_path(instance_data["instance_name"])
        data_string = json.dumps(instance_data)
        with open(f"{os.path.join(instance_path, 'instance.json')}", "w", encoding="utf-8") as file:
            file.write(data_string)
        return True
    except Exception as e:
        return False

def create_instance(loader_version, version, name, modloader):
    try:
        if not modloader or modloader.lower() == "none":
            modloader = "none"
            loader_version = 0

        instance_data = {
            "instance_name": name,
            "game_version": version,
            "loader": modloader,
            "loader_version": loader_version,
        }

        Path(f"{os.path.join(f'{get_instance_path(name)}')}").mkdir(parents=True, exist_ok=True)

        # writin da data :3
        write_instance_data(instance_data)

        instance_path = get_instance_path(name)

        if modloader != "none":
            loader = minecraft_launcher_lib.mod_loader.get_mod_loader(modloader)
            # Install the mod loader for the selected Minecraft version
            loader.install(version, instance_path)
        else:
            minecraft_launcher_lib.install.install_minecraft_version(
                version,
                instance_path
            )

        return f"Instance '{name}' created successfully!"

    except FileExistsError:
        return "This instance already exists!"
    except Exception as e:
        return f"An error occurred during installation: {e}"
