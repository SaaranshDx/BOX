from pathlib import Path
import os
import json
import minecraft_launcher_lib
from path import return_path

def get_instance_path(instance_name):
    app_data_path = return_path()
    instance_path = os.path.join(app_data_path, "instances", instance_name)
    return instance_path

def read_instance(name):
    try:
        instance_path = get_instance_path(name)
        instance_json_path = os.path.join(instance_path, "instance.json")

        if not os.path.exists(instance_json_path):
            return None

        with open(instance_json_path, "r", encoding="utf-8") as file:
            instance_data = json.load(file)

        return instance_data
    except Exception as e:
        print(f"Error reading instance '{name}': {e}")
        return None

def list_instances():
    try:
        app_data_path = return_path()
        instances_dir = os.path.join(app_data_path, "instances")
        index_path = os.path.join(instances_dir, "index.json")

        if not os.path.exists(index_path):
            return []

        with open(index_path, "r", encoding="utf-8") as file:
            index_data = json.load(file)

        return index_data
    except Exception as e:
        print(f"Error listing instances: {e}")
        return []

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

        instance_path = get_instance_path(name)
        Path(instance_path).mkdir(parents=True, exist_ok=True)

        with open(os.path.join(instance_path, 'instance.json'), "w", encoding="utf-8") as file:
            json.dump(instance_data, file, indent=4)

        app_data_path = return_path()
        instances_dir = os.path.join(app_data_path, "instances")
        os.makedirs(instances_dir, exist_ok=True)
        index_path = os.path.join(instances_dir, "index.json")

        if os.path.exists(index_path):
            with open(index_path, "r", encoding="utf-8") as file:
                index_data = json.load(file)
        else:
            index_data = []

        if name not in index_data:
            index_data.append(name)

        with open(index_path, "w", encoding="utf-8") as file:
            json.dump(index_data, file, indent=4)

        if modloader != "none":
            loader = minecraft_launcher_lib.mod_loader.get_mod_loader(modloader)
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
