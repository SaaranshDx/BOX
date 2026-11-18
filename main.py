from logging import debug
from pathlib import Path
import os
import json
from unittest import result
import minecraft_launcher_lib
import webview
from core.launcher import *
from core.instances import *
from core.accounts import *

class Api():
    def is_onboarded(self):
        result = get_launcher_data("isOnboarded")
        if result.get("success"):
            return result
        return False
    def create_account(self, ign):
        result = add_account(ign)
        if result.get("success"):
            return result
        return result
    def check_accounts_list(self):
        result = list_accounts()
        if result.get("success"):
            return result
        return result
    def delete_acc(self,ign):
        result = delete_account(ign)
        if result.get("success"):
            return result
        return result
    def get_instance_list():
        result = list_instances()
        if result.get("success"):
            return result
        return result


webview.create_window('Box', 'public/index.html', js_api=Api(), width=1100, height=700)
webview.start(debug=True)
