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

        return True

    except Exception as e:
        print(f"Error adding account: {e}")
        return False

def list_accounts():
    try:
        app_data_path = return_path()
        account_data_path = os.path.join(app_data_path, "account.json")
        if os.path.exists(account_data_path):
            with open(account_data_path, "r", encoding="utf-8") as file:
                accounts = json.load(file)
        else:
            accounts = []
        return accounts
    except Exception as e:
        return False

def delete_account(ign):
    try:
        app_data_path = return_path()
        account_data_path = os.path.join(app_data_path, "account.json")

        if not os.path.exists(account_data_path):
            return False

        with open(account_data_path, "r", encoding="utf-8") as file:
            accounts = json.load(file)

        if ign in accounts:
            accounts.remove(ign)
            with open(account_data_path, "w", encoding="utf-8") as file:
                json.dump(accounts, file, indent=4)
            return True

        return False

    except Exception as e:
        print(f"Error deleting account: {e}")
        return False

def select_account(ign):
    try:
        success = set_launcher_data("selectedAccount", ign)
        if success:
            return True
        return False
    except Exception as e:
        print(f"Error selecting account '{ign}': {e}")
        return False
