from pathlib import Path
import os
import json
from path import return_path
from core.launcher import set_launcher_data
from .log_setup import get_logger

logger = get_logger("accounts")

#only supportin offline rn ;-;
def add_account(ign):
    logger.debug("add_account(%r)", ign)
    try:
        app_data_path = return_path()
        account_data_path = os.path.join(app_data_path, "account.json")

        if os.path.exists(account_data_path):
            with open(account_data_path, "r", encoding="utf-8") as file:
                accounts = json.load(file)
        else:
            accounts = []

        accounts.append(ign)

        with open(account_data_path, "w", encoding="utf-8") as file:
            json.dump(accounts, file, indent=4)

        logger.info("ACCOUNT ADDED %r", ign)
        return { "success" : True, "message" : "Account added successfully" }

    except Exception as e:
        logger.exception("Error adding account %r", ign)
        return { "success" : False, "message" : "Failed to add account", "error" : str(e) }

def list_accounts():
    logger.debug("list_accounts()")
    try:
        app_data_path = return_path()
        account_data_path = os.path.join(app_data_path, "account.json")
        if os.path.exists(account_data_path):
            with open(account_data_path, "r", encoding="utf-8") as file:
                accounts = json.load(file)
        else:
            accounts = []
        logger.debug("ACCOUNTS %r", accounts)
        return { "success" : True, "accounts" : accounts}
    except Exception as e:
        logger.exception("Error listing accounts")
        return { "success" : False, "accounts" : []}

def delete_account(ign):
    logger.debug("delete_account(%r)", ign)
    try:
        app_data_path = return_path()
        account_data_path = os.path.join(app_data_path, "account.json")

        if not os.path.exists(account_data_path):
            return { "success": False, "message": "Account dosent fucking exist shits on fire" }

        with open(account_data_path, "r", encoding="utf-8") as file:
            accounts = json.load(file)

        if ign in accounts:
            accounts.remove(ign)
            with open(account_data_path, "w", encoding="utf-8") as file:
                json.dump(accounts, file, indent=4)
            logger.info("ACCOUNT REMOVED %r", ign)
            return {"success": True, "message": "account removed"}

        return {"success": False, "message": "somethin is fuked"}

    except Exception as e:
        logger.exception("Error deleting account %r", ign)
        return {"success": False, "message": "and error occured removing account"}

def select_account(ign):
    logger.debug("select_account(%r)", ign)
    try:
        success = set_launcher_data("selectedAccount", ign)
        if success.get("success"):
            logger.info("ACCOUNT SELECTED %r", ign)
            return {"success": True, "message": f"Account {ign} selected successfully"}
        return {"success": False, "message": "an error occured changing account"}
    except Exception as e:
        logger.exception("Error selecting account %r", ign)
        return {"success": False, "message": "an error occured changed account"}
