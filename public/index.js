window.addEventListener('pywebviewready', function() {
    init();
});

async function init() {
    try {
        const isOnboarded = await window.pywebview.api.is_onboarded();
        if (!isOnboarded) {
            console.log("onboarding shown");
        }
    } catch (error) {
        console.error("Failed to fetch onboarding state:", error);
    }
}

window.addEventListener("load", () => {
    const checkPythonBridge = setInterval(async () => {
        if (window.pywebview && window.pywebview.api) {
            clearInterval(checkPythonBridge);

            const isOnboarded = await window.pywebview.api.is_onboarded();
            if (!isOnboarded) {
                console.log("onboarding shown");
            }
        }
    }, 50); // hammer every 50 ms until it wants to exist
});

export const MODLOADER_ICONS = {
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
};

export const MINECRAFT_VERSIONS = {
  "26.3": {
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
  "26.2": {
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
  "26.1.2": {
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
  "26.1.1": {
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
  "26.1": {
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

  "1.21.11": {
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
  "1.21.10": {
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
  "1.21.9": {
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
  "1.21.8": {
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
  "1.21.7": {
    type: "minor",
    name: "Chase the Skies",
    loaders: {
      none: true,
      fabric: { min: "0.16.10", max: "latest" },
      forge: { min: "59.0.0", max: "59.0.x" },
      neoforge: { min: "21.7.0-beta", max: "21.7.x" },
    },
  },
  "1.21.6": {
    type: "minor",
    name: "Chase the Skies",
    loaders: {
      none: true,
      fabric: { min: "0.16.10", max: "latest" },
      forge: { min: "58.0.0", max: "58.0.x" },
      neoforge: { min: "21.6.0-beta", max: "21.6.x" },
    },
  },
  "1.21.5": {
    type: "minor",
    name: "Spring to Life",
    loaders: {
      none: true,
      fabric: { min: "0.16.10", max: "latest" },
      forge: { min: "57.0.0", max: "57.0.x" },
      neoforge: { min: "21.5.0-beta", max: "21.5.x" },
    },
  },
  "1.21.4": {
    type: "minor",
    name: "The Garden Awakens",
    loaders: {
      none: true,
      fabric: { min: "0.16.9", max: "latest" },
      forge: { min: "56.0.0", max: "56.0.x" },
      neoforge: { min: "21.4.0-beta", max: "21.4.x" },
    },
  },
  "1.21.3": {
    type: "minor",
    name: "Bundles of Bravery",
    loaders: {
      none: true,
      fabric: { min: "0.16.7", max: "latest" },
      forge: { min: "53.0.0", max: "53.0.x" },
      neoforge: { min: "21.3.0-beta", max: "21.3.x" },
    },
  },
  "1.21.2": {
    type: "minor",
    name: "Bundles of Bravery",
    loaders: {
      none: true,
      fabric: { min: "0.16.7", max: "latest" },
      forge: null,
      neoforge: { min: "21.2.0-beta", max: "21.2.x" },
    },
  },
  "1.21.1": {
    type: "minor",
    name: "Tricky Trials",
    loaders: {
      none: true,
      fabric: { min: "0.16.0", max: "latest" },
      forge: { min: "52.0.0", max: "52.1.x" },
      neoforge: { min: "21.1.0", max: "21.1.x" },
    },
  },
  "1.21": {
    type: "major",
    name: "Tricky Trials",
    loaders: {
      none: true,
      fabric: { min: "0.15.11", max: "latest" },
      forge: { min: "51.0.0", max: "51.0.x" },
      neoforge: { min: "21.0.0-beta", max: "21.0.x" },
    },
  },

  "1.20.6": {
    type: "minor",
    name: "Trails & Tales",
    loaders: {
      none: true,
      fabric: { min: "0.15.10", max: "latest" },
      forge: { min: "50.0.0", max: "50.2.x" },
      neoforge: { min: "20.6.0-beta", max: "20.6.x" },
    },
  },
  "1.20.5": {
    type: "minor",
    name: "Armored Paws",
    loaders: {
      none: true,
      fabric: { min: "0.15.10", max: "latest" },
      forge: null,
      neoforge: { min: "20.5.0-beta", max: "20.5.x" },
    },
  },
  "1.20.4": {
    type: "minor",
    name: "Trails & Tales",
    loaders: {
      none: true,
      fabric: { min: "0.15.0", max: "latest" },
      forge: { min: "49.0.0", max: "49.2.x" },
      neoforge: { min: "20.4.0-beta", max: "20.4.x" },
    },
  },
  "1.20.3": {
    type: "minor",
    name: "Bats and Pots",
    loaders: {
      none: true,
      fabric: { min: "0.15.0", max: "latest" },
      forge: null,
      neoforge: { min: "20.3.0-beta", max: "20.3.x" },
    },
  },
  "1.20.2": {
    type: "minor",
    name: "Trails & Tales",
    loaders: {
      none: true,
      fabric: { min: "0.14.22", max: "latest" },
      forge: { min: "48.0.0", max: "48.1.x" },
      neoforge: { min: "20.2.3-beta", max: "20.2.x" },
    },
  },
  "1.20.1": {
    type: "minor",
    name: "Trails & Tales",
    loaders: {
      none: true,
      fabric: { min: "0.14.21", max: "latest" },
      forge: { min: "47.0.0", max: "47.4.x" },
      neoforge: { min: "47.1.54", max: "47.1.x" }, // Legacy NeoForge 1.20.1 fork range
    },
  },
  "1.20": {
    type: "major",
    name: "Trails & Tales",
    loaders: {
      none: true,
      fabric: { min: "0.14.21", max: "latest" },
      forge: { min: "46.0.0", max: "46.0.x" },
      neoforge: null,
    },
  },

  "1.19.4": {
    type: "minor",
    name: "The Wild Update",
    loaders: {
      none: true,
      fabric: { min: "0.14.17", max: "latest" },
      forge: { min: "45.0.0", max: "45.4.x" },
      neoforge: null,
    },
  },
  "1.19.3": {
    type: "minor",
    name: "The Wild Update",
    loaders: {
      none: true,
      fabric: { min: "0.14.11", max: "latest" },
      forge: { min: "44.0.0", max: "44.1.x" },
      neoforge: null,
    },
  },
  "1.19.2": {
    type: "minor",
    name: "The Wild Update",
    loaders: {
      none: true,
      fabric: { min: "0.14.9", max: "latest" },
      forge: { min: "43.0.0", max: "43.5.x" },
      neoforge: null,
    },
  },
  "1.19.1": {
    type: "minor",
    name: "The Wild Update",
    loaders: {
      none: true,
      fabric: { min: "0.14.8", max: "latest" },
      forge: { min: "42.0.0", max: "42.0.x" },
      neoforge: null,
    },
  },
  "1.19": {
    type: "major",
    name: "The Wild Update",
    loaders: {
      none: true,
      fabric: { min: "0.14.6", max: "latest" },
      forge: { min: "41.0.0", max: "41.1.x" },
      neoforge: null,
    },
  },

  "1.18.2": {
    type: "minor",
    name: "Caves & Cliffs: Part II",
    loaders: {
      none: true,
      fabric: { min: "0.13.3", max: "latest" },
      forge: { min: "40.0.0", max: "40.3.x" },
      neoforge: null,
    },
  },
  "1.18.1": {
    type: "minor",
    name: "Caves & Cliffs: Part II",
    loaders: {
      none: true,
      fabric: { min: "0.12.11", max: "latest" },
      forge: { min: "39.0.0", max: "39.1.x" },
      neoforge: null,
    },
  },
  "1.18": {
    type: "major",
    name: "Caves & Cliffs: Part II",
    loaders: {
      none: true,
      fabric: { min: "0.12.8", max: "latest" },
      forge: { min: "38.0.0", max: "38.0.x" },
      neoforge: null,
    },
  },

  "1.17.1": {
    type: "minor",
    name: "Caves & Cliffs: Part I",
    loaders: {
      none: true,
      fabric: { min: "0.11.6", max: "latest" },
      forge: { min: "37.0.0", max: "37.1.x" },
      neoforge: null,
    },
  },
  "1.17": {
    type: "major",
    name: "Caves & Cliffs: Part I",
    loaders: {
      none: true,
      fabric: { min: "0.11.3", max: "latest" },
      forge: null,
      neoforge: null,
    },
  },

  "1.16.5": {
    type: "minor",
    name: "Nether Update",
    loaders: {
      none: true,
      fabric: { min: "0.11.0", max: "latest" },
      forge: { min: "36.0.0", max: "36.2.x" },
      neoforge: null,
    },
  },
  "1.16.4": {
    type: "minor",
    name: "Nether Update",
    loaders: {
      none: true,
      fabric: { min: "0.10.6", max: "latest" },
      forge: { min: "35.0.0", max: "35.1.x" },
      neoforge: null,
    },
  },
  "1.16.3": {
    type: "minor",
    name: "Nether Update",
    loaders: {
      none: true,
      fabric: { min: "0.9.3", max: "latest" },
      forge: { min: "34.0.0", max: "34.1.x" },
      neoforge: null,
    },
  },
  "1.16.2": {
    type: "minor",
    name: "Nether Update",
    loaders: {
      none: true,
      fabric: { min: "0.9.1", max: "latest" },
      forge: { min: "33.0.0", max: "33.0.x" },
      neoforge: null,
    },
  },
  "1.16.1": {
    type: "minor",
    name: "Nether Update",
    loaders: {
      none: true,
      fabric: { min: "0.8.8", max: "latest" },
      forge: { min: "32.0.0", max: "32.0.x" },
      neoforge: null,
    },
  },
  "1.16": {
    type: "major",
    name: "Nether Update",
    loaders: {
      none: true,
      fabric: { min: "0.8.8", max: "latest" },
      forge: null,
      neoforge: null,
    },
  },
};
// we would use the icon basesd on the mod loader aweghhgujgiuejagwguuihbwt4
// falls back to da lastest
const defaultVersion = MINECRAFT_VERSIONS.at(-1)
