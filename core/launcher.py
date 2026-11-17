
import os
import json
from path import return_path
import minecraft_launcher_lib
from instances import read_instance
import subprocess
import uuid

def get_launcher_data(key=None):
    try:
        app_data_path = return_path()
        data_path = os.path.join(app_data_path, "data.json")

        default_data = {
            "selectedAccount": None,
            "minRam": "1G",
            "maxRam": "2G",
            "resolutionWidth": "1280",
            "resolutionHeight": "720",
            "isOnboarded": False
        }

        os.makedirs(app_data_path, exist_ok=True)

        if not os.path.exists(data_path):
            data = default_data.copy()

            with open(data_path, "w", encoding="utf-8") as file:
                json.dump(data, file, indent=4)

        else:
            with open(data_path, "r", encoding="utf-8") as file:
                data = json.load(file)

            for setting, value in default_data.items():
                data.setdefault(setting, value)

        if key is not None:
            if key not in data:
                return {
                    "success": False,
                    "message": f"Launcher setting '{key}' does not exist"
                }

            return {
                "success": True,
                "data": data[key],
                "key": key
            }

        return {
            "success": True,
            "data": data
        }

    except Exception as e:
        print(f"Error reading launcher data: {e}")
        return {
            "success": False,
            "message": "Failed to read launcher data",
            "error": str(e)
        }


def set_launcher_data(key, value):
    try:
        app_data_path = return_path()
        data_path = os.path.join(app_data_path, "data.json")

        default_data = {
            "selectedAccount": None,
            "minRam": "1G",
            "maxRam": "2G",
            "resolutionWidth": "1280",
            "resolutionHeight": "720",
            "isOnboarded": False
        }

        os.makedirs(app_data_path, exist_ok=True)

        if os.path.exists(data_path):
            with open(data_path, "r", encoding="utf-8") as file:
                data = json.load(file)

            for setting, default_value in default_data.items():
                data.setdefault(setting, default_value)
        else:
            data = default_data.copy()

        if key not in default_data:
            return {
                "success": False,
                "message": f"Unknown launcher setting: {key}"
            }

        data[key] = value

        with open(data_path, "w", encoding="utf-8") as file:
            json.dump(data, file, indent=4)

        return {
            "success": True,
            "message": f"Launcher data '{key}' updated successfully",
            "data": data
        }

    except Exception as e:
        print(f"Error updating launcher data ({key}={value}): {e}")
        return {
            "success": False,
            "message": "Failed to update launcher data",
            "error": str(e)
        }

def get_launch_options(instance_path, java_path=None):
    result = get_launcher_data()

    if result["success"]:
        launcher_data = result["data"]

        selected_account = launcher_data["selectedAccount"]
        min_ram = launcher_data["minRam"]
        max_ram = launcher_data["maxRam"]
        width = launcher_data["resolutionWidth"]
        height = launcher_data["resolutionHeight"]

    options = minecraft_launcher_lib.utils.generate_test_options()

    options.update({
        "jvmArguments": [
            min_ram,
            max_ram
        ],
        "username": selected_account,
        #auth lib injector later :3
        "uuid": f"{uuid.uuid4()}",
        "customResolution": True,
        "resolutionWidth": width,
        "resolutionHeight": height,

        "gameDirectory": instance_path,

        # yeaw we keep en false ALWAYS
        "demo": False
    })

    if java_path:
        options["executablePath"] = java_path

    return options

def launch_game(instance_name):
    try:
        appdata_path = return_path()
        instance_path = os.path.join(appdata_path, "instances", instance_name)
        instance_data_res = read_instance(instance_name)
        instance_data = instance_data_res["data"]
        instance_game_version = instance_data["game_version"]
        options = get_launch_options(instance_path)
        instance_launch_command = minecraft_launcher_lib.command.get_minecraft_command(instance_game_version, instance_path, options)
        process = subprocess.Popen(instance_launch_command, cwd=instance_path, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")

        logs, _ = process.communicate()
        exit_code = process.returncode
        return {
            "success": exit_code == 0,
            "message": "Minecraft exited successfully" if exit_code == 0 else "Minecraft crashed or exited with an error",
            "exit_code": exit_code,
            "logs": logs
        }
    except Exception as e:
        return {"success": False, "message": "oops! looks like the game just crashed"}
