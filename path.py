import os
from pathlib import Path

try:
    from core.log_setup import get_logger
except ImportError:
    from log_setup import get_logger

logger = get_logger("path")


def return_path():
    APP_DATA_PATH = os.path.join(f"{Path(__file__).resolve().parent}", ".BOX")
    logger.debug("APP DATA PATH %r", APP_DATA_PATH)
    return APP_DATA_PATH
