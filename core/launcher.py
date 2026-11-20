
import os
import json
from path import return_path
import minecraft_launcher_lib
from .instances import read_instance
from .log_setup import get_logger
import subprocess
import uuid

logger = get_logger("launcher")

def get_launcher_data(key=None):
    logger.debug("get_launcher_data(key=%r)", key)
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

        logger.debug("LAUNCHER DATA %r", data)
        return {
            "success": True,
            "data": data
        }

    except Exception as e:
        logger.exception("Error reading launcher data")
        return {
            "success": False,
            "message": "Failed to read launcher data",
            "error": str(e)
        }


def set_launcher_data(key, value):
    logger.debug("set_launcher_data(%r, %r)", key, value)
    try:
        app_data_path = return_path()
        data_path = os.path.join(app_data_path, "data.json")

        default_data = {
            "selectedAccount": None,
            "minRam": "1G",
            "maxRam": "2G",
            "resolutionWidth": "1280",
            "resolutionHeight": "720",
            "isOnboarded": False,
            "lastInstancePlayed": None,
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

        logger.info("LAUNCHER SETTING SAVED %s=%r", key, value)
        return {
            "success": True,
            "message": f"Launcher data '{key}' updated successfully",
            "data": data
        }

    except Exception as e:
        logger.exception("Error updating launcher data (%s=%r)", key, value)
        return {
            "success": False,
            "message": "Failed to update launcher data",
            "error": str(e)
        }

# WOULD be used internally so stupid me dont fuck this upin the futuere cuz i know you are still gonna be fucking stupid
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
        "jvmArguments": [f"-Xms{min_ram}", f"-Xmx{max_ram}"],
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

    logger.debug("LAUNCH OPTIONS %r", options)
    return options

def _read_game_logs(instance_path):
    """Read Minecraft's own log files after the game exits."""
    parts = []

    latest = os.path.join(instance_path, "logs", "latest.log")
    if os.path.isfile(latest):
        try:
            with open(latest, "r", encoding="utf-8", errors="replace") as file:
                parts.append(file.read())
            logger.debug("Read game log %r", latest)
        except Exception:
            logger.exception("Error reading game log %r", latest)

    crash_dir = os.path.join(instance_path, "crash-reports")
    if os.path.isdir(crash_dir):
        try:
            reports = [
                os.path.join(crash_dir, name)
                for name in os.listdir(crash_dir)
                if name.endswith(".txt")
            ]
            if reports:
                newest = max(reports, key=os.path.getmtime)
                with open(newest, "r", encoding="utf-8", errors="replace") as file:
                    parts.append("\n---- crash report ----\n" + file.read())
                logger.debug("Read crash report %r", newest)
        except Exception:
            logger.exception("Error reading crash report")

    return "".join(parts)


def launch_game(instance_name):
    logger.info("LAUNCH REQUEST %r", instance_name)
    try:
        appdata_path = return_path()
        instance_path = os.path.join(appdata_path, "instances", instance_name)
        logger.debug("INSTANCE PATH %r", instance_path)

        instance_data_res = read_instance(instance_name)
        logger.debug("INSTANCE META %r", instance_data_res)
        instance_data = instance_data_res["data"]
        instance_game_version = instance_data["game_version"]
        logger.info("GAME VERSION %r", instance_game_version)

        options = get_launch_options(instance_path)
        set_launcher_data("lastInstancePlayed", instance_name)

        instance_launch_command = minecraft_launcher_lib.command.get_minecraft_command(
            instance_game_version, instance_path, options
        )
        logger.info("LAUNCH COMMAND %r", instance_launch_command)

        popen_kwargs = {}
        if os.name == "nt":
            popen_kwargs["creationflags"] = subprocess.CREATE_NEW_CONSOLE
            logger.info("GAME OUTPUT OPENED IN A NEW CONSOLE WINDOW")

        process = subprocess.Popen(
            instance_launch_command,
            cwd=instance_path,
            **popen_kwargs,
        )
        logger.info("GAME PROCESS STARTED pid=%s", process.pid)

        exit_code = process.wait()
        logs = _read_game_logs(instance_path)
        logger.info(
            "GAME PROCESS EXITED pid=%s code=%s log_chars=%d",
            process.pid, exit_code, len(logs),
        )

        return {
            "success": exit_code == 0,
            "message": "Minecraft exited successfully" if exit_code == 0 else "Minecraft crashed or exited with an error",
            "exit_code": exit_code,
            "logs": logs
        }
    except Exception as e:
        logger.exception("Error launching game %r", instance_name)
        return {
            "success": False,
            "message": "oops! looks like the game just crashed",
            "exit_code": None,
            "logs": str(e)
        }
