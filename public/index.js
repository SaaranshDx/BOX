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
