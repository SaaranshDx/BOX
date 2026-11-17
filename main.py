from logging import debug
from pathlib import Path
import os
import json
import minecraft_launcher_lib
import webview
webview.create_window('Box', 'public/index.html')
webview.start(debug=True)
