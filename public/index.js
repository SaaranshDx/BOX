let settings = null
let lastPlayedInstance = null
let selectedInstance = null
let selectedVersion = null
let installedInstances = {}
let loaderByVersion = {}
let initStarted = false
let installState = null
let drawerNameDirty = false

function isPywebviewApiReady() {
  const api = window.pywebview?.api;
  return typeof api?.is_onboarded === "function"
    && typeof api?.pull_launcher_settings === "function"
    && typeof api?.read_instance_meta === "function"
    && typeof api?.get_instance_list === "function";
}

// The bridge object can appear before its methods are injected, so wait for
// the real methods instead of just checking that `api` is truthy.
function whenPywebviewApiReady(callback) {
  if (isPywebviewApiReady()) return callback();

  const check = setInterval(() => {
    if (isPywebviewApiReady()) {
      clearInterval(check);
      callback();
    }
  }, 50);
}

function getInstanceMajorRelease(version) {
  if (typeof version !== "string") return null;

  const versionArray = version.split(".");
  return versionArray.length >= 3
    ? versionArray.slice(0, 2).join(".")
    : version;
}

// Every release maps onto the artwork for its major version.
const LOCAL_ARTWORK = new Set([
  "26.3", "26.2", "26.1", "1.21", "1.20", "1.19", "1.18", "1.17", "1.16",
]);

function getArtworkPath(version) {
  const majorRelease = getInstanceMajorRelease(version);
  const artwork = LOCAL_ARTWORK.has(majorRelease) ? majorRelease : "26.3";
  return `assets/artwork/${artwork}.png`;
}

// The registry below is the source of truth for update names ("Chaos Cubed").
function getVersionInfo(version) {
  return MINECRAFT_VERSIONS.find((entry) => entry.version === version)
    ?? MINECRAFT_VERSIONS.find(
      (entry) => getInstanceMajorRelease(entry.version) === getInstanceMajorRelease(version)
    )
    ?? null;
}

function getUpdateName(version) {
  return getVersionInfo(version)?.name ?? "Vanilla Minecraft";
}

const LOADER_LABELS = {
  none: "Vanilla",
  fabric: "Fabric",
  forge: "Forge",
  neoforge: "NeoForge",
};

const MODLOADER_ICONS = {
  none: {
    name: "Vanilla",
    icon: "https://minecraft.wiki/images/Grass_Block_JE7_BE6.png",
  },
  fabric: {
    name: "Fabric",
    icon: "https://fabricmc.net/assets/logo.png",
  },
  forge: {
    name: "Forge",
    icon: "https://avatars.githubusercontent.com/u/1390178?s=200&v=4",
  },
  neoforge: {
    name: "NeoForge",
    icon: "https://github.com/neoforged.png?size=200",
  },
};

function getSupportedLoaders(version) {
  const loaders = getVersionInfo(version)?.loaders ?? { none: true };
  return Object.keys(loaders).filter((loader) => loaders[loader]);
}

function getLoaderForVersion(version) {
  const supported = getSupportedLoaders(version);
  const saved = loaderByVersion[version];
  if (saved && supported.includes(saved)) return saved;

  const installed = Object.entries(installedInstances)
    .find(([, meta]) => meta?.game_version === version)?.[1]?.loader;
  if (installed && supported.includes(installed)) return installed;

  return supported.includes("none") ? "none" : supported[0] ?? "none";
}

function getLoaderLabel(loader) {
  return LOADER_LABELS[loader] ?? loader;
}

const INSTALL_STEPS = [
  "Downloading libraries",
  "Downloading assets",
  "Downloading Java",
  "Setting up instance",
  "Preparing launch files",
  "Almost ready",
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[character]));
}

function setStatus(message) {
  const element = document.getElementById("statusText");
  if (element) element.textContent = message ?? "";
}

function updateHero() {
  const version = selectedVersion ?? defaultVersion;
  const loader = getLoaderForVersion(version);
  const app = document.getElementById("app");
  const title = document.getElementById("versionTitle");
  const subtitle = document.getElementById("updateName");
  const versionLabel = document.getElementById("versionLabel");

  if (app) app.style.backgroundImage = `url('${getArtworkPath(version)}')`;
  if (title) title.textContent = `${version} ${getLoaderLabel(loader)}`;
  if (subtitle) subtitle.textContent = getUpdateName(version);
  if (versionLabel) versionLabel.textContent = version;
}

function selectVersion(version) {
  if (!version) return;

  selectedVersion = version;
  const loader = getLoaderForVersion(version);
  selectedInstance = Object.keys(installedInstances)
    .find((name) => installedInstances[name]?.game_version === version
      && (installedInstances[name]?.loader ?? "none") === loader) ?? null;

  document.querySelectorAll(".version-card").forEach((card) => {
    const major = getInstanceMajorRelease(card.dataset.version);
    card.classList.toggle("selected", major === getInstanceMajorRelease(version));
  });

  toggleVersionMenu(false);
  renderVersionMenu();
  updateHero();
}

function renderVersionList() {
  const list = document.getElementById("versionList");
  if (!list) return;

  const majorVersions = MINECRAFT_VERSIONS.filter((entry) => entry.type === "major");

  list.innerHTML = majorVersions.map((entry) => `
    <button class="version-card" type="button" data-version="${entry.version}"
      style="background-image: url('${getArtworkPath(entry.version)}')">
      <span class="version-card-label">${entry.version} ${getLoaderLabel(getLoaderForVersion(entry.version))}</span>
    </button>
  `).join("");

  list.querySelectorAll(".version-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectVersion(card.dataset.version);
      setStatus("");
    });
  });

  selectVersion(selectedVersion ?? defaultVersion);
}

function getVersionsForMajor(major) {
  return MINECRAFT_VERSIONS.filter((entry) => getInstanceMajorRelease(entry.version) === major);
}

function renderVersionMenu() {
  const menu = document.getElementById("versionMenu");
  if (!menu) return;

  const version = selectedVersion ?? defaultVersion;
  const options = getVersionsForMajor(getInstanceMajorRelease(version));

  menu.innerHTML = options.map((entry) => `
    <button class="version-option" type="button" role="option" data-version="${entry.version}"
      aria-selected="${entry.version === version}">
      <span>${entry.version}</span>
      <span class="version-option-check" aria-hidden="true">✓</span>
    </button>
  `).join("");

  menu.querySelectorAll(".version-option").forEach((option) => {
    option.addEventListener("click", () => {
      selectVersion(option.dataset.version);
      setStatus("");
    });
  });
}

function toggleVersionMenu(forceOpen) {
  const menu = document.getElementById("versionMenu");
  const button = document.getElementById("versionButton");
  if (!menu || !button) return;

  const shouldOpen = forceOpen ?? menu.hidden;
  menu.hidden = !shouldOpen;
  button.setAttribute("aria-expanded", String(shouldOpen));
}

function getDrawerMajor() {
  return getInstanceMajorRelease(selectedVersion ?? defaultVersion);
}

function renderDrawerInstances() {
  const container = document.getElementById("drawerInstances");
  if (!container) return;

  const major = getDrawerMajor();
  const entries = Object.entries(installedInstances).filter(([, meta]) =>
    meta?.game_version && getInstanceMajorRelease(meta.game_version) === major
  );

  container.innerHTML = entries.map(([name, meta]) => {
    const loader = meta.loader ?? "none";
    const loaderVersion = meta.loader_version && meta.loader_version !== 0
      ? ` ${meta.loader_version}` : "";
    const icon = MODLOADER_ICONS[loader] ?? MODLOADER_ICONS.none;
    const iconLabel = icon.name ?? getLoaderLabel(loader);

    return `
      <div class="instance-card">
        <div class="instance-card-icon">
          <img src="${escapeHtml(icon.icon)}" alt="${escapeHtml(iconLabel)}">
          <span class="instance-card-icon-fallback" hidden>${escapeHtml(iconLabel.charAt(0))}</span>
        </div>
        <div class="instance-card-name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
        <div class="instance-card-meta">${escapeHtml(meta.game_version)} · ${getLoaderLabel(loader)}${escapeHtml(loaderVersion)}</div>
        <div class="instance-card-actions">
          <button class="instance-card-launch" type="button" data-name="${escapeHtml(name)}">Launch</button>
          <button class="instance-card-delete" type="button" data-name="${escapeHtml(name)}"
            aria-label="Delete ${escapeHtml(name)}" title="Delete instance">Delete</button>
        </div>
      </div>
    `;
  }).join("");

  container.querySelectorAll(".instance-card-icon img").forEach((img) => {
    img.addEventListener("error", () => {
      img.hidden = true;
      if (img.nextElementSibling) img.nextElementSibling.hidden = false;
    });
  });

  container.querySelectorAll(".instance-card-launch").forEach((button) => {
    button.addEventListener("click", () => launchInstanceByName(button.dataset.name));
  });

  container.querySelectorAll(".instance-card-delete").forEach((button) => {
    button.addEventListener("click", async () => {
      if (installState) return;

      if (!button.classList.contains("confirming")) {
        container.querySelectorAll(".instance-card-delete.confirming").forEach((other) => {
          other.classList.remove("confirming");
          other.textContent = "Delete";
        });
        button.classList.add("confirming");
        button.textContent = "Confirm?";
        return;
      }

      const name = button.dataset.name;
      button.disabled = true;
      button.textContent = "Deleting...";

      try {
        const result = await window.pywebview.api.delete_instance(name);
        if (!result?.success) throw new Error(result?.message ?? "Could not delete instance");

        delete installedInstances[name];
        if (lastPlayedInstance === name) lastPlayedInstance = null;

        renderDrawerInstances();
        renderVersionList();
        setDrawerStatus(`Deleted ${name}`);
      } catch (error) {
        button.disabled = false;
        button.classList.remove("confirming");
        button.textContent = "Delete";
        setDrawerStatus(error?.message ?? "Could not delete instance");
      }
    });
  });
}

function syncDrawerName() {
  if (drawerNameDirty) return;

  const version = document.getElementById("instanceVersion").value;
  const loader = document.getElementById("instanceLoader").value;
  document.getElementById("instanceName").value = `${version}-${loader}`.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function syncLoaderVersion() {
  const version = document.getElementById("instanceVersion").value;
  const loader = document.getElementById("instanceLoader").value;
  const input = document.getElementById("instanceLoaderVersion");
  const range = getVersionInfo(version)?.loaders?.[loader];

  input.disabled = loader === "none";
  input.value = loader === "none" ? "" : (range?.min ?? "");
}

function syncDrawerLoaders(preferredLoader) {
  const version = document.getElementById("instanceVersion").value;
  const loaderSelect = document.getElementById("instanceLoader");
  const loaders = getSupportedLoaders(version);

  loaderSelect.innerHTML = loaders.map((loader) => `
    <option value="${loader}">${getLoaderLabel(loader)}</option>
  `).join("");

  const loader = loaders.includes(preferredLoader) ? preferredLoader
    : (loaders.includes("none") ? "none" : loaders[0]);
  loaderSelect.value = loader;

  syncLoaderVersion();
  syncDrawerName();
}

function prepareCreateForm() {
  const major = getDrawerMajor();
  const versions = getVersionsForMajor(major);
  const current = selectedVersion ?? defaultVersion;

  document.getElementById("instanceVersion").innerHTML = versions.map((version) => `
    <option value="${version.version}">${version.version}</option>
  `).join("");
  document.getElementById("instanceVersion").value = current;

  drawerNameDirty = false;
  syncDrawerLoaders(getLoaderForVersion(current));
  setCreateStatus("");
}

function openInstanceDrawer() {
  if (installState) return;

  const major = getDrawerMajor();
  const versions = getVersionsForMajor(major);
  document.getElementById("drawerVersion").textContent = `Minecraft ${major} · ${versions.length} versions`;

  prepareCreateForm();
  renderDrawerInstances();
  setDrawerStatus("");

  toggleVersionMenu(false);
  document.getElementById("instanceDrawer").classList.add("open");
  document.getElementById("instanceDrawer").setAttribute("aria-hidden", "false");
  document.getElementById("drawerScrim").classList.add("open");
}

function showCreatePopup() {
  const popup = document.getElementById("createPopup");
  popup.classList.add("open");
  popup.setAttribute("aria-hidden", "false");
  document.getElementById("instanceName").focus();
}

function openCreatePopup() {
  if (installState) return;

  prepareCreateForm();
  showCreatePopup();
}

function closeCreatePopup() {
  const popup = document.getElementById("createPopup");
  popup.classList.remove("open");
  popup.setAttribute("aria-hidden", "true");
  setCreateStatus("");
}

function closeInstanceDrawer(force = false) {
  if (installState && !force) return;

  closeCreatePopup();
  document.getElementById("popupGuard").hidden = true;
  document.getElementById("instanceDrawer").classList.remove("open");
  document.getElementById("instanceDrawer").setAttribute("aria-hidden", "true");
  document.getElementById("drawerScrim").classList.remove("open");

  if (force) hideInstallPopup();
}

function attemptCloseDrawer() {
  if (installState) {
    document.getElementById("popupGuard").hidden = false;
    return;
  }
  closeCreatePopup();
  closeInstanceDrawer();
}

function setDrawerStatus(message) {
  const status = document.getElementById("drawerStatus");
  if (status) status.textContent = message ?? "";
}

function setCreateStatus(message) {
  const status = document.getElementById("createStatus");
  if (status) status.textContent = message ?? "";
}

function setInstallControlsBusy(busy) {
  document.getElementById("installInstance").disabled = busy;
  document.getElementById("instanceVersion").disabled = busy;
  document.getElementById("instanceName").disabled = busy;
  document.getElementById("instanceLoader").disabled = busy;
  document.getElementById("instanceLoaderVersion").disabled = busy;
}

function showInstallPopup(name) {
  document.getElementById("installPopupName").textContent = name;
  document.getElementById("installPopupStep").textContent = INSTALL_STEPS[0];
  document.getElementById("installPopup").classList.add("open");
  document.getElementById("installPopup").setAttribute("aria-hidden", "false");
}

function hideInstallPopup() {
  document.getElementById("installPopup").classList.remove("open");
  document.getElementById("installPopup").setAttribute("aria-hidden", "true");
  document.getElementById("popupGuard").hidden = true;
}

function startInstallPolling(name, promise) {
  installState = { name, promise, result: null, error: null, timer: null, stepTimer: null };

  closeCreatePopup();
  setInstallControlsBusy(true);
  setDrawerStatus("");
  showInstallPopup(name);

  let step = 1;
  installState.stepTimer = setInterval(() => {
    const label = document.getElementById("installPopupStep");
    if (label) label.textContent = INSTALL_STEPS[step % INSTALL_STEPS.length];
    step += 1;
  }, 650);

  promise
    .then((result) => { if (installState) installState.result = result; })
    .catch((error) => { if (installState) installState.error = error; });

  const poll = async () => {
    if (!installState) return;

    let state = null;
    try {
      const response = await window.pywebview.api.get_instance_install_progress(name);
      if (response?.success) state = response.data;
    } catch (error) {
      console.error("[BOX] Failed to read install progress", error);
    }

    const settled = installState.result || installState.error;
    if (state && state.running === false && settled) {
      finishInstall(state.success && !installState.error, state.error);
      return;
    }

    if (installState.error) {
      finishInstall(false, installState.error);
    }
  };

  installState.timer = setInterval(poll, 250);
  poll();
}

function finishInstall(success, error) {
  if (!installState) return;

  const { name, timer, stepTimer } = installState;
  clearInterval(timer);
  clearInterval(stepTimer);
  installState = null;

  hideInstallPopup();
  setInstallControlsBusy(false);
  syncLoaderVersion();

  if (success) {
    const version = document.getElementById("instanceVersion").value;
    const loader = document.getElementById("instanceLoader").value;
    const loaderVersion = document.getElementById("instanceLoaderVersion").value.trim();

    installedInstances[name] = {
      instance_name: name,
      game_version: version,
      loader,
      loader_version: loader === "none" ? 0 : loaderVersion,
    };
    loaderByVersion[version] = loader;
    selectVersion(version);
    renderVersionList();
    renderDrawerInstances();
    setDrawerStatus(`Installed ${name}`);
    setStatus(`Installed ${name}`);
  } else {
    showCreatePopup();
    setCreateStatus(error?.message ?? "Installation failed");
  }
}

function installInstance() {
  const version = document.getElementById("instanceVersion").value;
  const name = document.getElementById("instanceName").value.trim();
  const loader = document.getElementById("instanceLoader").value;
  const loaderVersion = document.getElementById("instanceLoaderVersion").value.trim();

  if (!name) return setCreateStatus("Give the instance a name.");
  if (installedInstances[name]) return setCreateStatus("An instance with that name already exists.");
  if (loader !== "none" && !loaderVersion) return setCreateStatus("Choose a loader version.");

  const promise = window.pywebview.api.install_instance(
    loader === "none" ? 0 : loaderVersion, version, name, loader
  );
  startInstallPolling(name, promise);
}

function showCrashDialog(name, result) {
  const exitCode = result?.exit_code;
  const details = exitCode === null || exitCode === undefined
    ? name
    : `${name} · exit code ${exitCode}`;

  document.getElementById("crashDetails").textContent = details;
  document.getElementById("crashMessage").textContent = result?.message ?? "Minecraft crashed.";
  document.getElementById("crashLogs").textContent = result?.logs || "No logs were captured.";

  const logs = document.getElementById("crashLogs");
  const toggle = document.getElementById("crashToggle");
  logs.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
  document.getElementById("crashToggleLabel").textContent = "Show logs";

  const popup = document.getElementById("crashPopup");
  popup.classList.add("open");
  popup.setAttribute("aria-hidden", "false");
}

function hideCrashDialog() {
  const popup = document.getElementById("crashPopup");
  popup.classList.remove("open");
  popup.setAttribute("aria-hidden", "true");
}

function toggleCrashLogs() {
  const logs = document.getElementById("crashLogs");
  const toggle = document.getElementById("crashToggle");
  const expanded = logs.hidden;

  logs.hidden = !expanded;
  toggle.setAttribute("aria-expanded", String(expanded));
  document.getElementById("crashToggleLabel").textContent = expanded ? "Hide logs" : "Show logs";
}

async function launchInstanceByName(name) {
  if (installState) return;
  hideCrashDialog();
  closeInstanceDrawer();
  setStatus(`Launching ${name}...`);
  try {
    const result = await window.pywebview.api.launch_instance(name);
    if (result?.success) {
      setStatus("Game closed.");
    } else {
      setStatus(result?.message ?? "Game crashed");
      showCrashDialog(name, result);
    }
  } catch (error) {
    setStatus("Could not launch this instance");
    showCrashDialog(name, {
      message: error?.message ?? "Could not launch this instance",
      logs: "",
    });
  }
}

// lastInstancePlayed holds an instance NAME, not a version. Read that
// instance's metadata so the artwork follows its game_version.
async function getInstanceVersion(instanceName) {
  if (!instanceName || typeof instanceName !== "string") return null;

  try {
    const result = await window.pywebview.api.read_instance_meta(instanceName);
    if (result?.success && typeof result.data?.game_version === "string") {
      return result.data.game_version;
    }
  } catch (error) {
    console.error("[BOX] Failed to read instance metadata for", instanceName, error);
  }

  return null;
}

// Older settings may have stored a version string directly.
function looksLikeVersion(value) {
  return typeof value === "string" && /^\d+\.\d+/.test(value);
}

async function loadInstances() {
  try {
    const result = await window.pywebview.api.get_instance_list();
    installedInstances = result?.instances ?? {};
  } catch (error) {
    installedInstances = {};
  }
}

function launchSelected() {
  openInstanceDrawer();
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseRamGb(value, fallback) {
  const match = String(value ?? "").trim().match(/^(\d+(?:\.\d+)?)\s*([kmgt]?)b?$/i);
  if (!match) return fallback;

  const amount = Number.parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === "T") return Math.round(amount * 1024);
  if (unit === "M") return Math.max(1, Math.round(amount / 1024));
  if (unit === "K") return 1;
  return Math.round(amount);
}

function parseNumber(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function updateSliderLabels() {
  const min = document.getElementById("settingMinRam").value;
  const max = document.getElementById("settingMaxRam").value;
  const width = document.getElementById("settingWidth").value;
  const height = document.getElementById("settingHeight").value;

  document.getElementById("minRamValue").textContent = `${min} GB`;
  document.getElementById("maxRamValue").textContent = `${max} GB`;
  document.getElementById("widthValue").textContent = `${width} px`;
  document.getElementById("heightValue").textContent = `${height} px`;
}

function syncSettingsInputs() {
  const minInput = document.getElementById("settingMinRam");
  const maxInput = document.getElementById("settingMaxRam");
  const widthInput = document.getElementById("settingWidth");
  const heightInput = document.getElementById("settingHeight");

  const min = clampNumber(
    parseRamGb(settings?.minRam, 1), Number(minInput.min), Number(minInput.max)
  );
  const max = clampNumber(
    parseRamGb(settings?.maxRam, 2), Number(maxInput.min), Number(maxInput.max)
  );

  minInput.value = String(Math.min(min, max));
  maxInput.value = String(Math.max(min, max));
  widthInput.value = String(clampNumber(
    parseNumber(settings?.resolutionWidth, 1280),
    Number(widthInput.min), Number(widthInput.max)
  ));
  heightInput.value = String(clampNumber(
    parseNumber(settings?.resolutionHeight, 720),
    Number(heightInput.min), Number(heightInput.max)
  ));

  updateSliderLabels();
}

function switchSettingsTab(tab) {
  const accounts = tab === "accounts";
  document.getElementById("settingsTabPanel").hidden = accounts;
  document.getElementById("accountsTabPanel").hidden = !accounts;

  const settingsTab = document.getElementById("tabSettings");
  const accountsTab = document.getElementById("tabAccounts");
  settingsTab.classList.toggle("active", !accounts);
  accountsTab.classList.toggle("active", accounts);
  settingsTab.setAttribute("aria-selected", String(!accounts));
  accountsTab.setAttribute("aria-selected", String(accounts));

  if (accounts) loadAccounts();
}

function toggleSettings(forceOpen) {
  const panel = document.getElementById("settingsPanel");
  if (!panel) return;

  const shouldOpen = forceOpen ?? panel.hidden;
  panel.hidden = !shouldOpen;
  if (!shouldOpen) return;

  syncSettingsInputs();

  const status = document.getElementById("settingsStatus");
  if (status) status.textContent = "";
  const accountStatus = document.getElementById("accountStatus");
  if (accountStatus) accountStatus.textContent = "";

  if (!document.getElementById("accountsTabPanel").hidden) loadAccounts();
}

async function saveSettings() {
  const status = document.getElementById("settingsStatus");
  const values = {
    minRam: `${document.getElementById("settingMinRam").value}G`,
    maxRam: `${document.getElementById("settingMaxRam").value}G`,
    resolutionWidth: document.getElementById("settingWidth").value,
    resolutionHeight: document.getElementById("settingHeight").value,
  };

  try {
    for (const [key, value] of Object.entries(values)) {
      const result = await window.pywebview.api.update_launcher_settings(key, value);
      if (!result?.success) throw new Error(result?.message ?? `Could not update ${key}`);
    }

    settings = { ...(settings ?? {}), ...values };
    if (status) status.textContent = "Saved";
  } catch (error) {
    if (status) status.textContent = error?.message ?? "Could not save settings";
  }
}

function setAccountStatus(message) {
  const status = document.getElementById("accountStatus");
  if (status) status.textContent = message ?? "";
}

function renderAccounts(accounts) {
  const container = document.getElementById("accountList");
  if (!container) return;

  const list = Array.isArray(accounts) ? accounts : [];
  if (!list.length) {
    container.innerHTML = '<p class="account-empty">No accounts yet</p>';
    return;
  }

  const selected = settings?.selectedAccount ?? null;
  container.innerHTML = list.map((name) => `
    <div class="account-row">
      <div class="account-name">
        ${escapeHtml(name)}${name === selected ? '<span class="account-badge">ACTIVE</span>' : ""}
      </div>
      <div class="account-actions">
        <button class="account-select" type="button" data-name="${escapeHtml(name)}"
          ${name === selected ? "disabled" : ""}>Use</button>
        <button class="account-delete" type="button" data-name="${escapeHtml(name)}">Delete</button>
      </div>
    </div>
  `).join("");

  container.querySelectorAll(".account-select").forEach((button) => {
    button.addEventListener("click", () => selectAccount(button.dataset.name));
  });

  container.querySelectorAll(".account-delete").forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.classList.contains("confirming")) {
        container.querySelectorAll(".account-delete.confirming").forEach((other) => {
          other.classList.remove("confirming");
          other.textContent = "Delete";
        });
        button.classList.add("confirming");
        button.textContent = "Confirm?";
        return;
      }
      deleteAccount(button.dataset.name);
    });
  });
}

async function loadAccounts() {
  try {
    const result = await window.pywebview.api.check_accounts_list();
    if (!result?.success) throw new Error(result?.message ?? "Could not load accounts");
    renderAccounts(result.accounts ?? []);
  } catch (error) {
    setAccountStatus(error?.message ?? "Could not load accounts");
  }
}

async function addAccount() {
  const input = document.getElementById("newAccountName");
  const name = input.value.trim();
  if (!name) return setAccountStatus("Enter a player name.");

  try {
    const result = await window.pywebview.api.create_account(name);
    if (!result?.success) throw new Error(result?.message ?? "Could not add account");
    input.value = "";
    setAccountStatus(`Added ${name}`);
    await loadAccounts();
  } catch (error) {
    setAccountStatus(error?.message ?? "Could not add account");
  }
}

async function selectAccount(name) {
  try {
    const result = await window.pywebview.api.select_account(name);
    if (!result?.success) throw new Error(result?.message ?? "Could not select account");

    settings = { ...(settings ?? {}), selectedAccount: name };
    setAccountStatus(`Using ${name}`);
    await loadAccounts();
  } catch (error) {
    setAccountStatus(error?.message ?? "Could not select account");
  }
}

async function deleteAccount(name) {
  try {
    const result = await window.pywebview.api.delete_acc(name);
    if (!result?.success) throw new Error(result?.message ?? "Could not delete account");

    if (settings?.selectedAccount === name) {
      await window.pywebview.api.update_launcher_settings("selectedAccount", null);
      settings = { ...settings, selectedAccount: null };
    }

    setAccountStatus(`Deleted ${name}`);
  } catch (error) {
    setAccountStatus(error?.message ?? "Could not delete account");
  }
  await loadAccounts();
}

async function init() {
  if (initStarted) return;
  initStarted = true;

  try {
    settings = await getSettings();
    await loadInstances();

    // lastInstancePlayed is a name; fall back to a raw version setting if present.
    lastPlayedInstance = settings?.lastInstancePlayed ?? null;
    const instanceVersion = await getInstanceVersion(lastPlayedInstance);
    const initialVersion = instanceVersion
      ?? (looksLikeVersion(lastPlayedInstance) ? lastPlayedInstance : null)
      ?? defaultVersion;

    renderVersionList();
    selectVersion(initialVersion);

    const isOnboarded = await window.pywebview.api.is_onboarded();
    if (!isOnboarded) console.log("onboarding shown");
  } catch (error) {
    console.error("Failed to initialize launcher:", error);
    renderVersionList();
    selectVersion(defaultVersion);
  }
}

window.addEventListener("pywebviewready", () => whenPywebviewApiReady(init));
window.addEventListener("load", () => whenPywebviewApiReady(init));

document.getElementById("launchButton")?.addEventListener("click", launchSelected);
document.getElementById("settingsButton")?.addEventListener("click", () => toggleSettings());
document.getElementById("versionButton")?.addEventListener("click", () => toggleVersionMenu());
document.getElementById("closeSettings")?.addEventListener("click", () => toggleSettings(false));
document.getElementById("saveSettings")?.addEventListener("click", saveSettings);
document.getElementById("tabSettings")?.addEventListener("click", () => switchSettingsTab("settings"));
document.getElementById("tabAccounts")?.addEventListener("click", () => switchSettingsTab("accounts"));
document.getElementById("addAccount")?.addEventListener("click", addAccount);
document.getElementById("newAccountName")?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addAccount();
});

document.getElementById("settingMinRam")?.addEventListener("input", () => {
  const minInput = document.getElementById("settingMinRam");
  const maxInput = document.getElementById("settingMaxRam");
  if (Number(minInput.value) > Number(maxInput.value)) maxInput.value = minInput.value;
  updateSliderLabels();
});
document.getElementById("settingMaxRam")?.addEventListener("input", () => {
  const minInput = document.getElementById("settingMinRam");
  const maxInput = document.getElementById("settingMaxRam");
  if (Number(maxInput.value) < Number(minInput.value)) minInput.value = maxInput.value;
  updateSliderLabels();
});
document.getElementById("settingWidth")?.addEventListener("input", updateSliderLabels);
document.getElementById("settingHeight")?.addEventListener("input", updateSliderLabels);

document.getElementById("closeDrawer")?.addEventListener("click", attemptCloseDrawer);
document.getElementById("drawerScrim")?.addEventListener("click", attemptCloseDrawer);
document.getElementById("newInstanceButton")?.addEventListener("click", openCreatePopup);
document.getElementById("closeCreatePopup")?.addEventListener("click", closeCreatePopup);
document.getElementById("installInstance")?.addEventListener("click", installInstance);
document.getElementById("popupKeep")?.addEventListener("click", () => {
  document.getElementById("popupGuard").hidden = true;
});
document.getElementById("popupCloseAnyway")?.addEventListener("click", () => closeInstanceDrawer(true));
document.getElementById("crashToggle")?.addEventListener("click", toggleCrashLogs);
document.getElementById("closeCrashPopup")?.addEventListener("click", hideCrashDialog);
document.getElementById("crashCloseButton")?.addEventListener("click", hideCrashDialog);
document.getElementById("crashPopup")?.addEventListener("click", (event) => {
  if (event.target === event.currentTarget) hideCrashDialog();
});

document.getElementById("instanceVersion")?.addEventListener("change", () => {
  const version = document.getElementById("instanceVersion").value;
  selectVersion(version);
  syncDrawerLoaders(getLoaderForVersion(version));
  setCreateStatus("");
});

document.getElementById("instanceLoader")?.addEventListener("change", () => {
  syncLoaderVersion();
  syncDrawerName();
  setCreateStatus("");
});

document.getElementById("instanceName")?.addEventListener("input", () => {
  drawerNameDirty = true;
});

document.addEventListener("click", (event) => {
  if (!document.getElementById("versionPicker")?.contains(event.target)) {
    toggleVersionMenu(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    toggleVersionMenu(false);
    if (document.getElementById("crashPopup")?.classList.contains("open")) {
      hideCrashDialog();
      return;
    }
    if (document.getElementById("createPopup")?.classList.contains("open")) {
      closeCreatePopup();
      return;
    }
    toggleSettings(false);
    attemptCloseDrawer();
  }
});

const MINECRAFT_VERSIONS = [
  {
    version: "26.3",
    type: "major",
    name: "Wilderness Bound",
    backgroundImage: "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/MC_26-3_WildernessBound_KeyArt.jpg",
    icon: "https://minecraft.wiki/images/Compass_JE3_BE3.gif",
    loaders: {
      none: true,
      fabric: { min: "0.18.0", max: "latest" },
      forge: { min: "66.0.0", max: "66.0.x" },
      neoforge: { min: "26.3.0.1-beta", max: "26.3.0.x" },
    },
  },
  {
    version: "26.2",
    type: "major",
    name: "Chaos Cubed",
    backgroundImage: "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/MC_26-2_ChaosCubed_KeyArt.jpg",
    icon: "https://minecraft.wiki/images/Slime_Block_JE2_BE3.png",
    loaders: {
      none: true,
      fabric: { min: "0.18.0", max: "latest" },
      forge: { min: "65.0.0", max: "65.1.x" },
      neoforge: { min: "26.2.0.1-beta", max: "26.2.0.x" },
    },
  },
  {
    version: "26.1.2",
    type: "minor",
    name: "Tiny Takeover",
    backgroundImage: "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/MC_26-1_TinyTakeover_KeyArt.jpg",
    icon: "https://minecraft.wiki/images/Dandelion_JE8_BE2.png",
    loaders: {
      none: true,
      fabric: { min: "0.18.0", max: "latest" },
      forge: { min: "64.2.0", max: "64.2.x" },
      neoforge: { min: "26.1.2.1-beta", max: "26.1.2.x" },
    },
  },
  {
    version: "26.1.1",
    type: "minor",
    name: "Tiny Takeover",
    backgroundImage: "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/MC_26-1_TinyTakeover_KeyArt.jpg",
    icon: "https://minecraft.wiki/images/Dandelion_JE8_BE2.png",
    loaders: {
      none: true,
      fabric: { min: "0.18.0", max: "latest" },
      forge: { min: "64.1.0", max: "64.1.x" },
      neoforge: { min: "26.1.1.1-beta", max: "26.1.1.x" },
    },
  },
  {
    version: "26.1",
    type: "major",
    name: "Tiny Takeover",
    backgroundImage: "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/MC_26-1_TinyTakeover_KeyArt.jpg",
    icon: "https://minecraft.wiki/images/Name_Tag_JE2_BE2.png",
    loaders: {
      none: true,
      fabric: { min: "0.18.0", max: "latest" },
      forge: { min: "64.0.0", max: "64.0.x" },
      neoforge: { min: "26.1.0.1-beta", max: "26.1.0.x" },
    },
  },
  {
    version: "1.21.11",
    type: "minor",
    name: "Mounts of Mayhem",
    backgroundImage: "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/MC_1-21-11_MountsOfMayhem_KeyArt.jpg",
    icon: "https://minecraft.wiki/images/Nautilus_Shell_JE1_BE2.png",
    loaders: {
      none: true,
      fabric: { min: "0.17.0", max: "latest" },
      forge: { min: "63.0.0", max: "63.0.x" },
      neoforge: { min: "21.11.0-beta", max: "21.11.x" },
    },
  },
  {
    version: "1.21.10",
    type: "minor",
    name: "The Copper Age",
    backgroundImage: "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/MC_1-21-9_CopperAge_KeyArt.jpg",
    icon: "https://minecraft.wiki/images/Copper_Ingot_JE2_BE1.png",
    loaders: {
      none: true,
      fabric: { min: "0.17.0", max: "latest" },
      forge: { min: "62.0.0", max: "62.0.x" },
      neoforge: { min: "21.10.0-beta", max: "21.10.x" },
    },
  },
  {
    version: "1.21.9",
    type: "minor",
    name: "The Copper Age",
    backgroundImage: "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/MC_1-21-9_CopperAge_KeyArt.jpg",
    icon: "https://minecraft.wiki/images/Copper_Ingot_JE2_BE1.png",
    loaders: {
      none: true,
      fabric: { min: "0.17.0", max: "latest" },
      forge: { min: "61.0.0", max: "61.0.x" },
      neoforge: { min: "21.9.0-beta", max: "21.9.x" },
    },
  },
  {
    version: "1.21.8",
    type: "minor",
    name: "Chase the Skies",
    backgroundImage: "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/MC_1-21-6_ChaseTheSkies_KeyArt.jpg",
    icon: "https://minecraft.wiki/images/Ghast_Tear_JE2_BE2.png",
    loaders: {
      none: true,
      fabric: { min: "0.16.10", max: "latest" },
      forge: { min: "60.0.0", max: "60.0.x" },
      neoforge: { min: "21.8.0-beta", max: "21.8.x" },
    },
  },
  {
    version: "1.21.7",
    type: "minor",
    name: "Chase the Skies",
    loaders: {
      none: true,
      fabric: { min: "0.16.10", max: "latest" },
      forge: { min: "59.0.0", max: "59.0.x" },
      neoforge: { min: "21.7.0-beta", max: "21.7.x" },
    },
  },
  {
    version: "1.21.6",
    type: "minor",
    name: "Chase the Skies",
    loaders: {
      none: true,
      fabric: { min: "0.16.10", max: "latest" },
      forge: { min: "58.0.0", max: "58.0.x" },
      neoforge: { min: "21.6.0-beta", max: "21.6.x" },
    },
  },
  {
    version: "1.21.5",
    type: "minor",
    name: "Spring to Life",
    loaders: {
      none: true,
      fabric: { min: "0.16.10", max: "latest" },
      forge: { min: "57.0.0", max: "57.0.x" },
      neoforge: { min: "21.5.0-beta", max: "21.5.x" },
    },
  },
  {
    version: "1.21.4",
    type: "minor",
    name: "The Garden Awakens",
    loaders: {
      none: true,
      fabric: { min: "0.16.9", max: "latest" },
      forge: { min: "56.0.0", max: "56.0.x" },
      neoforge: { min: "21.4.0-beta", max: "21.4.x" },
    },
  },
  {
    version: "1.21.3",
    type: "minor",
    name: "Bundles of Bravery",
    loaders: {
      none: true,
      fabric: { min: "0.16.7", max: "latest" },
      forge: { min: "53.0.0", max: "53.0.x" },
      neoforge: { min: "21.3.0-beta", max: "21.3.x" },
    },
  },
  {
    version: "1.21.2",
    type: "minor",
    name: "Bundles of Bravery",
    loaders: {
      none: true,
      fabric: { min: "0.16.7", max: "latest" },
      forge: null,
      neoforge: { min: "21.2.0-beta", max: "21.2.x" },
    },
  },
  {
    version: "1.21.1",
    type: "minor",
    name: "Tricky Trials",
    loaders: {
      none: true,
      fabric: { min: "0.16.0", max: "latest" },
      forge: { min: "52.0.0", max: "52.1.x" },
      neoforge: { min: "21.1.0", max: "21.1.x" },
    },
  },
  {
    version: "1.21",
    type: "major",
    name: "Tricky Trials",
    loaders: {
      none: true,
      fabric: { min: "0.15.11", max: "latest" },
      forge: { min: "51.0.0", max: "51.0.x" },
      neoforge: { min: "21.0.0-beta", max: "21.0.x" },
    },
  },
  {
    version: "1.20.6",
    type: "minor",
    name: "Trails & Tales",
    loaders: {
      none: true,
      fabric: { min: "0.15.10", max: "latest" },
      forge: { min: "50.0.0", max: "50.2.x" },
      neoforge: { min: "20.6.0-beta", max: "20.6.x" },
    },
  },
  {
    version: "1.20.5",
    type: "minor",
    name: "Armored Paws",
    loaders: {
      none: true,
      fabric: { min: "0.15.10", max: "latest" },
      forge: null,
      neoforge: { min: "20.5.0-beta", max: "20.5.x" },
    },
  },
  {
    version: "1.20.4",
    type: "minor",
    name: "Trails & Tales",
    loaders: {
      none: true,
      fabric: { min: "0.15.0", max: "latest" },
      forge: { min: "49.0.0", max: "49.2.x" },
      neoforge: { min: "20.4.0-beta", max: "20.4.x" },
    },
  },
  {
    version: "1.20.3",
    type: "minor",
    name: "Bats and Pots",
    loaders: {
      none: true,
      fabric: { min: "0.15.0", max: "latest" },
      forge: null,
      neoforge: { min: "20.3.0-beta", max: "20.3.x" },
    },
  },
  {
    version: "1.20.2",
    type: "minor",
    name: "Trails & Tales",
    loaders: {
      none: true,
      fabric: { min: "0.14.22", max: "latest" },
      forge: { min: "48.0.0", max: "48.1.x" },
      neoforge: { min: "20.2.3-beta", max: "20.2.x" },
    },
  },
  {
    version: "1.20.1",
    type: "minor",
    name: "Trails & Tales",
    loaders: {
      none: true,
      fabric: { min: "0.14.21", max: "latest" },
      forge: { min: "47.0.0", max: "47.4.x" },
      neoforge: { min: "47.1.54", max: "47.1.x" }, // Legacy NeoForge 1.20.1 fork range
    },
  },
  {
    version: "1.20",
    type: "major",
    name: "Trails & Tales",
    loaders: {
      none: true,
      fabric: { min: "0.14.21", max: "latest" },
      forge: { min: "46.0.0", max: "46.0.x" },
      neoforge: null,
    },
  },
  {
    version: "1.19.4",
    type: "minor",
    name: "The Wild Update",
    loaders: {
      none: true,
      fabric: { min: "0.14.17", max: "latest" },
      forge: { min: "45.0.0", max: "45.4.x" },
      neoforge: null,
    },
  },
  {
    version: "1.19.3",
    type: "minor",
    name: "The Wild Update",
    loaders: {
      none: true,
      fabric: { min: "0.14.11", max: "latest" },
      forge: { min: "44.0.0", max: "44.1.x" },
      neoforge: null,
    },
  },
  {
    version: "1.19.2",
    type: "minor",
    name: "The Wild Update",
    loaders: {
      none: true,
      fabric: { min: "0.14.9", max: "latest" },
      forge: { min: "43.0.0", max: "43.5.x" },
      neoforge: null,
    },
  },
  {
    version: "1.19.1",
    type: "minor",
    name: "The Wild Update",
    loaders: {
      none: true,
      fabric: { min: "0.14.8", max: "latest" },
      forge: { min: "42.0.0", max: "42.0.x" },
      neoforge: null,
    },
  },
  {
    version: "1.19",
    type: "major",
    name: "The Wild Update",
    loaders: {
      none: true,
      fabric: { min: "0.14.6", max: "latest" },
      forge: { min: "41.0.0", max: "41.1.x" },
      neoforge: null,
    },
  },
  {
    version: "1.18.2",
    type: "minor",
    name: "Caves & Cliffs: Part II",
    loaders: {
      none: true,
      fabric: { min: "0.13.3", max: "latest" },
      forge: { min: "40.0.0", max: "40.3.x" },
      neoforge: null,
    },
  },
  {
    version: "1.18.1",
    type: "minor",
    name: "Caves & Cliffs: Part II",
    loaders: {
      none: true,
      fabric: { min: "0.12.11", max: "latest" },
      forge: { min: "39.0.0", max: "39.1.x" },
      neoforge: null,
    },
  },
  {
    version: "1.18",
    type: "major",
    name: "Caves & Cliffs: Part II",
    loaders: {
      none: true,
      fabric: { min: "0.12.8", max: "latest" },
      forge: { min: "38.0.0", max: "38.0.x" },
      neoforge: null,
    },
  },
  {
    version: "1.17.1",
    type: "minor",
    name: "Caves & Cliffs: Part I",
    loaders: {
      none: true,
      fabric: { min: "0.11.6", max: "latest" },
      forge: { min: "37.0.0", max: "37.1.x" },
      neoforge: null,
    },
  },
  {
    version: "1.17",
    type: "major",
    name: "Caves & Cliffs: Part I",
    loaders: {
      none: true,
      fabric: { min: "0.11.3", max: "latest" },
      forge: null,
      neoforge: null,
    },
  },
  {
    version: "1.16.5",
    type: "minor",
    name: "Nether Update",
    loaders: {
      none: true,
      fabric: { min: "0.11.0", max: "latest" },
      forge: { min: "36.0.0", max: "36.2.x" },
      neoforge: null,
    },
  },
  {
    version: "1.16.4",
    type: "minor",
    name: "Nether Update",
    loaders: {
      none: true,
      fabric: { min: "0.10.6", max: "latest" },
      forge: { min: "35.0.0", max: "35.1.x" },
      neoforge: null,
    },
  },
  {
    version: "1.16.3",
    type: "minor",
    name: "Nether Update",
    loaders: {
      none: true,
      fabric: { min: "0.9.3", max: "latest" },
      forge: { min: "34.0.0", max: "34.1.x" },
      neoforge: null,
    },
  },
  {
    version: "1.16.2",
    type: "minor",
    name: "Nether Update",
    loaders: {
      none: true,
      fabric: { min: "0.9.1", max: "latest" },
      forge: { min: "33.0.0", max: "33.0.x" },
      neoforge: null,
    },
  },
  {
    version: "1.16.1",
    type: "minor",
    name: "Nether Update",
    loaders: {
      none: true,
      fabric: { min: "0.8.8", max: "latest" },
      forge: { min: "32.0.0", max: "32.0.x" },
      neoforge: null,
    },
  },
  {
    version: "1.16",
    type: "major",
    name: "Nether Update",
    loaders: {
      none: true,
      fabric: { min: "0.8.8", max: "latest" },
      forge: null,
      neoforge: null,
    },
  },
];

// we would use the icon basesd on the mod loader aweghhgujgiuejagwguuihbwt4
// falls back to da lastest (the list is sorted newest-first)
const defaultVersion = MINECRAFT_VERSIONS[0]?.version ?? "26.3"

async function getSettings() {
  try {
    const res = await window.pywebview.api.pull_launcher_settings();
    return res?.data ?? null
  } catch (error) {
    console.error("[BOX] An error occured pulling settings")
    return null
  }
}
