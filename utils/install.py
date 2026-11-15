import minecraft_launcher_lib
# module contains the installation code with logs streaming which is gonna be implimented some time later trust me


current_max = 0

def set_status(status):
    print(f"[BOX] {status}")

def set_progress(progress):
    if current_max:
        percentage = progress / current_max * 100
        print(f"[BOX] Progress: {progress}/{current_max} ({percentage:.1f}%)")

def set_max(new_max):
    global current_max
    current_max = new_max
    print(f"[BOX] Total tsaks: {current_max}")

# using camelcase here cuz docs use it other wise i hate it trust
callback = {
    "setStatus": set_status,
    "setProgress": set_progress,
    "setMax": set_max
}


def install_version(version, minecraft_dir):
    minecraft_launcher_lib.install.install_minecraft_version(
        version,
        str(minecraft_dir),
        callback=callback
    )
