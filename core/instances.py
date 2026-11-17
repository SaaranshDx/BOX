
from pathlib import Path
import os
import json
import minecraft_launcher_lib
from path import return_path


def get_instance_path(instance_name):
    app_data_path = return_path()
    return os.path.join(app_data_path, "instances", instance_name)


def read_instance(name):
    try:
        instance_path = get_instance_path(name)
        instance_json_path = os.path.join(instance_path, "instance.json")

        if not os.path.exists(instance_json_path):
            return {
                "success": False,
                "message": "Instance does not exist"
            }

        with open(instance_json_path, "r", encoding="utf-8") as file:
            instance_data = json.load(file)

        return {
            "success": True,
            "data": instance_data
        }

    except Exception as e:
        print(f"Error reading instance '{name}': {e}")
        return {
            "success": False,
            "message": "Failed to read instance",
            "error": e
        }


def _update_index():
    """Scan instances directory and rebuild index with full metadata."""
    try:
        app_data_path = return_path()
        instances_dir = os.path.join(app_data_path, "instances")
        index_path = os.path.join(instances_dir, "index.json")

        os.makedirs(instances_dir, exist_ok=True)

        if not os.path.exists(index_path):
            with open(index_path, "w", encoding="utf-8") as file:
                json.dump({}, file, indent=4)
            return {}

        instance_dirs = [
            d for d in os.listdir(instances_dir)
            if os.path.isdir(os.path.join(instances_dir, d)) and d != "index.json"
        ]

        index_data = {}
        for instance_name in instance_dirs:
            instance_path = os.path.join(instances_dir, instance_name)
            instance_json_path = os.path.join(instance_path, "instance.json")

            if os.path.exists(instance_json_path):
                with open(instance_json_path, "r", encoding="utf-8") as file:
                    instance_data = json.load(file)
                index_data[instance_name] = instance_data
            else:
                index_data[instance_name] = {
                    "instance_name": instance_name,
                    "game_version": "unknown",
                    "loader": "unknown",
                    "loader_version": 0
                }

        with open(index_path, "w", encoding="utf-8") as file:
            json.dump(index_data, file, indent=4)

        return index_data

    except Exception as e:
        print(f"Error updating index: {e}")
        return {}


def list_instances():
    try:
        index_data = _update_index()
        return {
            "success": True,
            "instances": index_data
        }

    except Exception as e:
        print(f"Error listing instances: {e}")
        return {
            "success": False,
            "instances": {},
            "error": e
        }


def write_instance_data(instance_data):
    try:
        instance_path = get_instance_path(instance_data["instance_name"])
        Path(instance_path).mkdir(parents=True, exist_ok=True)

        with open(
            os.path.join(instance_path, "instance.json"),
            "w",
            encoding="utf-8"
        ) as file:
            json.dump(instance_data, file, indent=4)

        return {
            "success": True,
            "message": "Instance data saved successfully"
        }

    except Exception as e:
        print(f"Error writing instance data: {e}")
        return {
            "success": False,
            "message": "Failed to save instance data",
            "error": e
        }


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

        if os.path.exists(instance_path):
            return {
                "success": False,
                "message": "This instance already exists!"
            }

        Path(instance_path).mkdir(parents=True, exist_ok=True)

        write_result = write_instance_data(instance_data)

        if not write_result["success"]:
            return write_result

        app_data_path = return_path()
        instances_dir = os.path.join(app_data_path, "instances")
        os.makedirs(instances_dir, exist_ok=True)

        index_path = os.path.join(instances_dir, "index.json")

        if os.path.exists(index_path):
            with open(index_path, "r", encoding="utf-8") as file:
                index_data = json.load(file)
        else:
            index_data = {}

        index_data[name] = instance_data

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

        return {
            "success": True,
            "message": f"Instance '{name}' created successfully",
            "data": instance_data
        }

    except Exception as e:
        return {
            "success": False,
            "message": "An error occurred during installation",
            "error": e
        }
