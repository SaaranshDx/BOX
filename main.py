from pathlib import Path
import os
import re
import json
import minecraft_launcher_lib

APP_DATA_PATH = os.path.join(f"{Path(__file__).resolve().parent}", ".BOX")

def get_launcher_data(key=None):
    try:
        data_path = os.path.join(APP_DATA_PATH, "data.json")
        default_data = {
            "selectedAccount": None,
            "minRam": "1G",
            "maxRam": "2G"
        }

        os.makedirs(APP_DATA_PATH, exist_ok=True)

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
        data_path = os.path.join(APP_DATA_PATH, "data.json")
        os.makedirs(APP_DATA_PATH, exist_ok=True)

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

#only supportin offline rn ;-;
def add_account(ign):
    try:
        account_data_path = os.path.join(APP_DATA_PATH, "account.json")

        if os.path.exists(account_data_path):
            with open(account_data_path, "r", encoding="utf-8") as file:
                accounts = json.load(file)
        else:
            accounts = []

        accounts.append(ign)

        with open(account_data_path, "w", encoding="utf-8") as file:
            json.dump(accounts, file, indent=4)

        return True

    except Exception as e:
        print(f"Error adding account: {e}")
        return False

def list_accounts():
    try:
        account_data_path = os.path.join(APP_DATA_PATH, "account.json")
        if os.path.exists(account_data_path):
            with open(account_data_path, "r", encoding="utf-8") as file:
                accounts = json.load(file)
        else:
            accounts = []
        return accounts
    except Exception as e:
        return False

def delete_account(ign):
    try:
        account_data_path = os.path.join(APP_DATA_PATH, "account.json")

        if not os.path.exists(account_data_path):
            return False

        with open(account_data_path, "r", encoding="utf-8") as file:
            accounts = json.load(file)

        if ign in accounts:
            accounts.remove(ign)
            with open(account_data_path, "w", encoding="utf-8") as file:
                json.dump(accounts, file, indent=4)
            return True

        return False

    except Exception as e:
        print(f"Error deleting account: {e}")
        return False

def get_instance_path(instance_name):
    instance_path = os.path.join(APP_DATA_PATH, "instances", instance_name)
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
        instances_dir = os.path.join(APP_DATA_PATH, "instances")
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

        instances_dir = os.path.join(APP_DATA_PATH, "instances")
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

def select_account(ign):
    try:
        success = set_launcher_data("selectedAccount", ign)
        if success:
            return True
        return False
    except Exception as e:
        print(f"Error selecting account '{ign}': {e}")
        return False
