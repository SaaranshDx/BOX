import logging
import sys

LOGGER_NAME = "BOX"


def setup_logging():
    """Configure one verbose console handler for the whole launcher."""
    root = logging.getLogger()

    if getattr(root, "_box_logging_configured", False):
        return logging.getLogger(LOGGER_NAME)

    try:
        sys.stdout.reconfigure(errors="replace")
    except Exception:
        pass

    root.setLevel(logging.DEBUG)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)
    handler.setFormatter(logging.Formatter(
        "%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
        datefmt="%H:%M:%S",
    ))
    root.addHandler(handler)

    root._box_logging_configured = True
    logging.getLogger(LOGGER_NAME).debug("Console logging configured")
    return logging.getLogger(LOGGER_NAME)


def get_logger(name=None):
    setup_logging()
    if not name:
        return logging.getLogger(LOGGER_NAME)
    return logging.getLogger(f"{LOGGER_NAME}.{name}")
