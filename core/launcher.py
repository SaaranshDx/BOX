
import os
import json
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
            return {
                "success": True,
                "data": data.get(key),
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
            "error": e
        }


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
            "error": e
        }
