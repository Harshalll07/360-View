
// Pannellum Viewer Instance
let viewer;

document.addEventListener('DOMContentLoaded', function () {

    // ===============================================
    // Configuration & Data
    // ===============================================

    // Common Placeholder: Replace with real images for production
    const PLACEHOLDER_IMG = "assets/sphere.jpg";

    // Helper: Create a Street View Chevron Hotspot
    // pitch: Fixed at -20 to -30 to appear on floor
    // yaw: direction
    // targetScene: scene ID to load
    const createChevron = (yaw, targetScene) => {
        return {
            pitch: -15, // Closer to center for visibility 
            yaw: yaw,
            type: "scene",
            text: "", // No text for clean look
            sceneId: targetScene,
            cssClass: "street-chevron pulse",
            clickHandlerFunc: (evt, args) => {
                // Custom transition handler
                performStreetViewMove(args);
                return false;
            },
            clickHandlerArgs: targetScene
        };
    };

    /**
     * SCENE GRAPH
     * Mapping physical space.
     * Use placeholders until real assets defined.
     */
   const scenes = {
    node2: {
        title: "Scene 2",
        hfov: 110,
        pitch: 0,
        yaw: 0,
        type: "cubemap",
        cubeMap: [
            "/assets/r.jpg",
            "/assets/l.jpg",
            "/assets/u.jpg",
            "/assets/d.jpg",
            "/assets/f.jpg",
            "/assets/b.jpg"
        ],
        autoLoad: true,
        hotSpots: [
            createChevron(0, "node3")
        ]
    },  // ✅ comma REQUIRED

    node3: {
        title: "Scene 3",
        hfov: 110,
        pitch: 0,
        yaw: 0,
        type: "cubemap",
        cubeMap: [
            "/assets/r.jpg",
            "/assets/l.jpg",
            "/assets/u.jpg",
            "/assets/d.jpg",
            "/assets/f.jpg",
            "/assets/b.jpg"
        ],
        autoLoad: true,
        hotSpots: [
            createChevron(180, "node2")
        ]
    }
};  // ✅ close object properly

    // ===============================================
    // Initialization
    // ===============================================

    viewer = pannellum.viewer('panorama', {
        default: {
            firstScene: "node2",
            sceneFadeDuration: 800,
            autoLoad: true,
            autoRotate: 0,
            compass: false,
            showControls: false, // Custom UI
            hotSpotDebug: false,
            hfov: 110
        },
        scenes: scenes
    });

    // ===============================================
    // Core Logic: The "Walk" Transition
    // ===============================================

    // Helper: Simple linear tween for parameters
    const animateValue = (start, end, duration, updateFn, callback) => {
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease in-out cubic
            const ease = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            const currentVal = start + (end - start) * ease;
            updateFn(currentVal);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (callback) callback();
            }
        };
        requestAnimationFrame(animate);
    };

    window.performStreetViewMove = (targetSceneId) => {
        // 1. Zoom In Effect (FOV reduction) to simulate moving forward
        const currentFov = viewer.getHfov();
        const targetFov = 60; // Zoom in significantly

        // 2. Start Fading Out slightly after zoom starts
        const overlay = document.getElementById('transition-overlay');
        setTimeout(() => {
            overlay.classList.add('active');
        }, 100);

        // Animate FOV
        animateValue(currentFov, targetFov, 400, (val) => {
            viewer.setHfov(val);
        }, () => {
            // 3. Load Next Scene after Zoom completes

            // Get current looking direction to maintain orientation
            const currentYaw = viewer.getYaw();
            const currentPitch = viewer.getPitch();

            // Wait a tiny bit for the fade to be fully opaque if it isn't yet
            setTimeout(() => {
                // Load scene 
                // We load with the *original* wide FOV (110) so it feels like we "stepped back" 
                // into a wide view at the new location
                viewer.loadScene(targetSceneId, currentPitch, currentYaw, 110);

                // 4. Fade In
                setTimeout(() => {
                    overlay.classList.remove('active');
                }, 100);

            }, 200);
        });
    };

    // ===============================================
    // Logic: Auto-Hide Arrows on Look Up
    // ===============================================

    // Auto-Hide Logic removed to ensure visibility



    // ===============================================
    // UI Helpers
    // ===============================================

    viewer.on('scenechange', function (sceneId) {
        const titleEl = document.getElementById('scene-title');
        titleEl.textContent = scenes[sceneId]?.title || "";
        titleEl.classList.add('visible');
    });

    document.getElementById('home-btn').addEventListener('click', () => {
        viewer.loadScene('node2', 0, 0, 110);
    });

    document.getElementById('fullscreen-btn').addEventListener('click', () => {
        viewer.toggleFullscreen();
    });

    const rotateBtn = document.getElementById('autorotate-btn');
    let isRotating = false;
    rotateBtn.addEventListener('click', () => {
        if (isRotating) {
            viewer.stopAutoRotate();
            isRotating = false;
            rotateBtn.style.opacity = "0.5";
        } else {
            viewer.startAutoRotate(-2);
            isRotating = true;
            rotateBtn.style.opacity = "1";
        }
    });

    // ===============================================
    // UI Button Navigation Logic
    // ===============================================
    const sceneOrder = ['node2', 'node3'];

    document.getElementById('prev-btn').addEventListener('click', () => {
        const currentScene = viewer.getScene();
        let currentIndex = sceneOrder.indexOf(currentScene);

        // Wrap around
        let newIndex = currentIndex - 1;
        if (newIndex < 0) newIndex = sceneOrder.length - 1;

        const nextScene = sceneOrder[newIndex];
        window.performStreetViewMove(nextScene);
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        const currentScene = viewer.getScene();
        let currentIndex = sceneOrder.indexOf(currentScene);

        // Wrap around
        let newIndex = currentIndex + 1;
        if (newIndex >= sceneOrder.length) newIndex = 0;

        const nextScene = sceneOrder[newIndex];
        window.performStreetViewMove(nextScene);
    });
});


