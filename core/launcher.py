from pathlib import Path
import os
import json
import minecraft_launcher_lib
from path import return_path

def get_launcher_data(key=None):
    try:
        app_data_path = return_path()
        data_path = os.path.join(app_data_path, "data.json")
        default_data = {
            "selectedAccount": None,
            "minRam": "1G",
            "maxRam": "2G"
        }

        os.makedirs(app_data_path, exist_ok=True)

        if not os.path.exists(data_path):
            with open(data_path, "w", encoding="utf-8") as file:
                json.dump(default_data, file, indent=4)
            data = default_data
        else:
            with open(data_path, "r", encoding="utf-8") as file:
                data = json.load(file)

        if key is not None:
            return data.get(key)
        return data

    except Exception as e:
        print(f"Error reading launcher data: {e}")
        return None

def set_launcher_data(key, value):
    try:
        app_data_path = return_path()
        data_path = os.path.join(app_data_path, "data.json")
        os.makedirs(app_data_path, exist_ok=True)

        if os.path.exists(data_path):
            with open(data_path, "r", encoding="utf-8") as file:
                data = json.load(file)
        else:
            data = {
                "selectedAccount": None,
                "minRam": "1G",
                "maxRam": "2G"
            }

        data[key] = value

        with open(data_path, "w", encoding="utf-8") as file:
            json.dump(data, file, indent=4)

        return True

    except Exception as e:
        print(f"Error updating launcher data ({key}={value}): {e}")
        return False
