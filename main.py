from logging import debug
from pathlib import Path
from functools import wraps
import os
import json
from unittest import result
import minecraft_launcher_lib
import webview
from core.launcher import *
from core.instances import *
from core.accounts import *


def _json_safe(value):
    """Convert anything pywebview can't dump to JSON into a plain string."""
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(item) for item in value]

    try:
        json.dumps(value)
        return value
    except (TypeError, ValueError):
        return str(value)


def _safe_api(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return _json_safe(func(*args, **kwargs))
        except Exception as e:
            return {"success": False, "message": str(e)}
    return wrapper


class Api():
    @_safe_api
    def is_onboarded(self):
        result = get_launcher_data("isOnboarded")
        if result.get("success"):
            return result
        return False

    @_safe_api
    def create_account(self, ign):
        result = add_account(ign)
        if result.get("success"):
            return result
        return result

    @_safe_api
    def check_accounts_list(self):
        result = list_accounts()
        if result.get("success"):
            return result
        return result

    @_safe_api
    def delete_acc(self, ign):
        result = delete_account(ign)
        if result.get("success"):
            return result
        return result

    @_safe_api
    def get_instance_list(self):
        result = list_instances()
        if result.get("success"):
            return result
        return result

    @_safe_api
    def read_instance_meta(self, name):
        result = read_instance(name)
        if result.get("success"):
            return result
        return result

    @_safe_api
    def delete_instance(self, name):
        result = delete_instance(name)
        if result.get("success"):
            return result
        return result

    @_safe_api
    def install_instance(self, loader_version, version, name, modloader):
        # we keep a registry of the versions and stuff
        result = create_instance(loader_version, version, name, modloader)
        if result.get("success"):
            return result
        return result

    @_safe_api
    def get_instance_install_progress(self, name):
        result = get_install_progress(name)
        if result.get("success"):
            return result
        return result

    @_safe_api
    def pull_launcher_settings(self):
        result = get_launcher_data()
        if result.get("success"):
            return result
        return result

    @_safe_api
    def update_launcher_settings(self, key, value):
        result = set_launcher_data(key, value)
        if result.get("success"):
            return result
        return result

    @_safe_api
    def launch_instance(self, name):
        result = launch_game(name)
        if result.get("success"):
            return result
        return result

webview.create_window('Box', 'public/index.html', js_api=Api(), width=1100, height=700)
webview.start(debug=True)
