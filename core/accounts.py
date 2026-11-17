from pathlib import Path
import os
import json
from path import return_path
from core.launcher import set_launcher_data

#only supportin offline rn ;-;
def add_account(ign):
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

        return { "success" : True, "message" : "Account added successfully" }

    except Exception as e:
        print(f"Error adding account: {e}")
        return { "success" : False, "message" : "Failed to add account", "error" : e }

def list_accounts():
    try:
        app_data_path = return_path()
        account_data_path = os.path.join(app_data_path, "account.json")
        if os.path.exists(account_data_path):
            with open(account_data_path, "r", encoding="utf-8") as file:
                accounts = json.load(file)
        else:
            accounts = []
        return { "success" : True, "accounts" : accounts}
    except Exception as e:
        return { "success" : False, "accounts" : accounts}

def delete_account(ign):
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
            return {"success": True, "message": "account removed"}

        return {"success": False, "message": "somethin is fuked"}

    except Exception as e:
        print(f"Error deleting account: {e}")
        return {"success": False, "message": "and error occured removing account"}

def select_account(ign):
    try:
        success = set_launcher_data("selectedAccount", ign)
        if success:
            return {"success": True, "message": f"Account {ign} selected successfully"}
        return {"success": False, "message": "an error occured changing account"}
    except Exception as e:
        print(f"Error selecting account '{ign}': {e}")
        return {"success": False, "message": "an error occured changed account"}
