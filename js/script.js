// ===============================================
// Pannellum Viewer Instance
// ===============================================
let viewer;

document.addEventListener('DOMContentLoaded', function () {

    // ===============================================
    // Helper: Street View Chevron Hotspot
    // ===============================================
    const createChevron = (yaw, targetScene) => {
        return {
            pitch: -15,
            yaw: yaw,
            type: "scene",
            sceneId: targetScene,
            cssClass: "street-chevron pulse",
            clickHandlerFunc: (evt, args) => {
                performStreetViewMove(args);
                return false;
            },
            clickHandlerArgs: targetScene
        };
    };

    // ===============================================
    // SCENES (CUBEMAP)
    // IMPORTANT ORDER:
    // RIGHT, LEFT, UP, DOWN, FRONT, BACK
    // ===============================================
    const scenes = {

        node2: {
            title: "Scene 2",
            hfov: 110,
            pitch: 0,
            yaw: 0,
            type: "cubemap",

            // 🔥 Most correct mapping for typical Pano2VR export
            cubeMap: [
                 "/assets/d.jpg",   // DOWN (floor)
                "/assets/l.jpg",   // LEFT
                "/assets/f.jpg",   // FRONT
                "/assets/r.jpg",   // RIGHT
                "/assets/u.jpg",   // UP (ceiling)
                "/assets/b.jpg"    // BACK
            ],

            autoLoad: true,
            hotSpots: [
                createChevron(0, "node3")
            ]
        },

        node3: {
            title: "Scene 3",
            hfov: 110,
            pitch: 0,
            yaw: 0,
            type: "cubemap",
            cubeMap: [
                "/assets/d.jpg",
                "/assets/l.jpg",
                "/assets/f.jpg", 
                "/assets/r.jpg",
               "/assets/u.jpg",
                "/assets/b.jpg"
            ],
            autoLoad: true,
            hotSpots: [
                createChevron(180, "node2")
            ]
        }
    };

    // ===============================================
    // VIEWER INITIALIZATION
    // ===============================================
    viewer = pannellum.viewer('panorama', {
        default: {
            firstScene: "node2",
            sceneFadeDuration: 800,
            autoLoad: true,
            autoRotate: 0,
            showControls: false,
            hfov: 110
        },
        scenes: scenes
    });

    // ===============================================
    // WALK TRANSITION EFFECT
    // ===============================================
    const animateValue = (start, end, duration, updateFn, callback) => {
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const ease = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            const currentVal = start + (end - start) * ease;
            updateFn(currentVal);

            if (progress < 1) requestAnimationFrame(animate);
            else if (callback) callback();
        };

        requestAnimationFrame(animate);
    };

    window.performStreetViewMove = (targetSceneId) => {

        const currentFov = viewer.getHfov();
        const targetFov = 60;

        const overlay = document.getElementById('transition-overlay');

        setTimeout(() => overlay.classList.add('active'), 100);

        animateValue(currentFov, targetFov, 400, (val) => {
            viewer.setHfov(val);
        }, () => {

            const currentYaw = viewer.getYaw();
            const currentPitch = viewer.getPitch();

            setTimeout(() => {
                viewer.loadScene(targetSceneId, currentPitch, currentYaw, 110);
                setTimeout(() => overlay.classList.remove('active'), 100);
            }, 200);
        });
    };

    // ===============================================
    // UI EVENTS
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
            rotateBtn.style.opacity = "0.5";
        } else {
            viewer.startAutoRotate(-2);
            rotateBtn.style.opacity = "1";
        }
        isRotating = !isRotating;
    });

    // ===============================================
    // NEXT / PREV NAVIGATION
    // ===============================================
    const sceneOrder = ['node2', 'node3'];

    document.getElementById('prev-btn').addEventListener('click', () => {
        const current = viewer.getScene();
        let i = sceneOrder.indexOf(current) - 1;
        if (i < 0) i = sceneOrder.length - 1;
        performStreetViewMove(sceneOrder[i]);
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        const current = viewer.getScene();
        let i = sceneOrder.indexOf(current) + 1;
        if (i >= sceneOrder.length) i = 0;
        performStreetViewMove(sceneOrder[i]);
    });

});



