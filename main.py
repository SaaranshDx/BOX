from logging import debug
from pathlib import Path
import os
import json
import minecraft_launcher_lib
import webview
from core.launcher import *
from core.instances import *
from core.accounts import *

class Api():
    def is_onboarded(self):
        result = get_launcher_data("isOnboarded")
        if result.get("success"):
            return result["data"]
        return False

webview.create_window('Box', 'public/index.html', js_api=Api())
webview.start(debug=True)
