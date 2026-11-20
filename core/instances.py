
from pathlib import Path
import os
import json
import shutil
import threading
import minecraft_launcher_lib
from path import return_path

_install_progress = {}
_install_lock = threading.Lock()


def _set_install_progress(name, **updates):
    with _install_lock:
        state = _install_progress.setdefault(name, {
            "instance_name": name,
            "running": True,
            "success": False,
            "status": "",
            "progress": 0,
            "max": 0,
            "percentage": 0,
            "error": None
        })
        state.update(updates)


def _get_install_callback(name):
    return {
        "setStatus": lambda status: _set_install_progress(name, status=status),
        "setProgress": lambda progress: _set_install_progress(name, progress=progress),
        "setMax": lambda maximum: _set_install_progress(name, max=maximum)
    }


def get_install_progress(instance_name):
    """Return the live installation progress state of an instance."""
    try:
        with _install_lock:
            state = _install_progress.get(instance_name)

            if state is None:
                return {
                    "success": False,
                    "message": f"No installation found for instance '{instance_name}'"
                }

            data = dict(state)

        if data["max"] > 0:
            data["percentage"] = round((data["progress"] / data["max"]) * 100, 2)
        else:
            data["percentage"] = 0

        return {
            "success": True,
            "data": data
        }

    except Exception as e:
        print(f"Error reading install progress '{instance_name}': {e}")
        return {
            "success": False,
            "message": "Failed to read installation progress",
            "error": str(e)
        }


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


def delete_instance(instance_name):
    """Delete an instance folder and remove it from the index."""
    try:
        if (
            not instance_name
            or instance_name in (".", "..")
            or "/" in instance_name
            or "\\" in instance_name
            or (os.altsep and os.altsep in instance_name)
        ):
            return {
                "success": False,
                "message": "Invalid instance name"
            }

        instance_path = get_instance_path(instance_name)
        if not os.path.isdir(instance_path):
            return {
                "success": False,
                "message": "Instance does not exist"
            }

        shutil.rmtree(instance_path)

        app_data_path = return_path()
        index_path = os.path.join(app_data_path, "instances", "index.json")
        if os.path.exists(index_path):
            with open(index_path, "r", encoding="utf-8") as file:
                index_data = json.load(file)
            index_data.pop(instance_name, None)
            with open(index_path, "w", encoding="utf-8") as file:
                json.dump(index_data, file, indent=4)

        with _install_lock:
            _install_progress.pop(instance_name, None)

        return {
            "success": True,
            "message": f"Instance '{instance_name}' deleted"
        }

    except Exception as e:
        print(f"Error deleting instance '{instance_name}': {e}")
        return {
            "success": False,
            "message": "Failed to delete instance",
            "error": str(e)
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

        instance_dirs = [
            d for d in os.listdir(instances_dir)
            if os.path.isdir(os.path.join(instances_dir, d))
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

        _set_install_progress(
            name,
            running=True,
            success=False,
            status="Preparing installation",
            progress=0,
            max=0,
            percentage=0,
            error=None
        )

        callback = _get_install_callback(name)

        if modloader != "none":
            loader = minecraft_launcher_lib.mod_loader.get_mod_loader(modloader)
            loader.install(
                version,
                instance_path,
                loader_version=str(loader_version) if loader_version else None,
                callback=callback
            )
        else:
            minecraft_launcher_lib.install.install_minecraft_version(
                version,
                instance_path,
                callback=callback
            )

        _set_install_progress(
            name,
            running=False,
            success=True,
            status="Installation complete",
            percentage=100
        )

        return {
            "success": True,
            "message": f"Instance '{name}' created successfully",
            "data": instance_data
        }

    except Exception as e:
        _set_install_progress(
            name,
            running=False,
            success=False,
            status="Installation failed",
            error=str(e)
        )
        return {
            "success": False,
            "message": "An error occurred during installation",
            "error": e
        }
