import os
from pathlib import Path
def return_path():
    APP_DATA_PATH = os.path.join(f"{Path(__file__).resolve().parent}", ".BOX")
    return APP_DATA_PATH
