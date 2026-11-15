from ast import Raise
import os
from pathlib import Path
def getPath():
    app_data_path = os.environ.get('LOCALAPPDATA')
    app_dir_path = os.path.join(app_data_path, ".BOX")
    path = Path("app_dir_path")
    if path.exists():
        return app_data_path
    else:
        Path(app_data_path).mkdir()
        return app_data_path
