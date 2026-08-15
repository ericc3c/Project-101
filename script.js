import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- 1. Selection Screen Viewports Setup ---
const boyBox = document.getElementById('canvas-boy-box');
const girlBox = document.getElementById('canvas-girl-box');

const boyScene = new THREE.Scene();
const boyCamera = new THREE.PerspectiveCamera(40, boyBox.clientWidth / boyBox.clientHeight, 0.1, 1000);
boyCamera.position.set(0, 1.4, 1.8);
const boyRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
boyRenderer.setSize(boyBox.clientWidth, boyBox.clientHeight);
boyBox.appendChild(boyRenderer.domElement);

const girlScene = new THREE.Scene();
const girlCamera = new THREE.PerspectiveCamera(40, girlBox.clientWidth / girlBox.clientHeight, 0.1, 1000);
girlCamera.position.set(0, 1.4, 1.8);
const girlRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
girlRenderer.setSize(girlBox.clientWidth, girlBox.clientHeight);
girlBox.appendChild(girlRenderer.domElement);

boyScene.add(new THREE.AmbientLight(0xffffff, 0.9));
const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
dir1.position.set(5, 10, 7);
boyScene.add(dir1);

girlScene.add(new THREE.AmbientLight(0xffffff, 0.9));
const dir2 = new THREE.DirectionalLight(0xffffff, 0.8);
dir2.position.set(5, 10, 7);
girlScene.add(dir2);

const loader = new GLTFLoader();
let previewBoy, previewGirl;

loader.load('boy.glb', (gltf) => {
    previewBoy = gltf.scene;
    previewBoy.rotation.y = Math.PI;
    boyScene.add(previewBoy);
}, undefined, (error) => console.error("Preview boy load error:", error));

loader.load('girl.glb', (gltf) => {
    previewGirl = gltf.scene;
    previewGirl.scale.set(0.45, 0.45, 0.45);
    girlScene.add(previewGirl);
}, undefined, (error) => console.error("Preview girl load error:", error));

// Render loop for selection cards
function animatePreview() {
    requestAnimationFrame(animatePreview);
    boyRenderer.render(boyScene, boyCamera);
    girlRenderer.render(girlScene, girlCamera);
}
animatePreview();

// --- 2. Loading Screen Fade-out ---
window.addEventListener('load', function() {
    const loadingScreen = document.getElementById('loading-screen');
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => loadingScreen.style.display = 'none', 1200);
        }
    }, 3500);
});

// --- 3. Tap-to-Select & Game World Transition ---
let activeGameScene, activeCamera, activeRenderer, activeControls;
let playerCharacter = null;

window.selectCharacter = function(type) {
    const selectScreen = document.getElementById('character-select-screen');
    
    // Highlight effect feedback
    const boyCard = document.getElementById('card-boy');
    const girlCard = document.getElementById('card-girl');
    if (type === 'boy') {
        boyCard.classList.add('selected');
        girlCard.classList.add('dimmed');
    } else {
        girlCard.classList.add('selected');
        boyCard.classList.add('dimmed');
    }

    // Fade out selection UI and launch main 3D game loop
    setTimeout(() => {
        selectScreen.style.opacity = '0';
        setTimeout(() => {
            selectScreen.style.display = 'none';
            initGameWorld(type); // Launch the actual game world!
        }, 500);
    }, 400);
};

// --- 4. Main 3D Game World Initialization ---
function initGameWorld(characterType) {
    const canvas = document.getElementById('game-canvas');
    canvas.style.display = 'block';

    activeGameScene = new THREE.Scene();
    activeGameScene.background = new THREE.Color('#87CEEB'); // Sky blue dawn tone

    activeCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    activeRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    activeRenderer.setSize(window.innerWidth, window.innerHeight);

    // World Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    activeGameScene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(10, 20, 10);
    activeGameScene.add(sunLight);

    // Orbit Controls for testing movement/view
    activeControls = new OrbitControls(activeCamera, activeRenderer.domElement);
    activeControls.enableDamping = true;

    // Load Environment with explicit local path prefix to bypass iOS fetch blocks
    loader.load('./environment.glb', (gltf) => {
        const env = gltf.scene;
        env.scale.set(1, 1, 1);
        env.position.set(0, 0, 0);
        activeGameScene.add(env);
        console.log("Environment loaded successfully!", env);
    }, undefined, (error) => {
        console.error("CRITICAL ERROR loading environment.glb:", error);
    });

    // Load Chosen Character into the Game World
    const modelFileName = characterType === 'boy' ? 'boy.glb' : 'girl.glb';
    loader.load('./' + modelFileName, (gltf) => {
        playerCharacter = gltf.scene;
        
        if (characterType === 'girl') {
            playerCharacter.scale.set(0.45, 0.45, 0.45);
        }
        
        playerCharacter.position.set(0, 0, 0); // Spawn at center
        activeGameScene.add(playerCharacter);

        // Position Camera behind and above player for a third-person view
        activeCamera.position.set(0, 2.5, -3);
        activeControls.target.copy(playerCharacter.position);
    }, undefined, (error) => {
        console.error("Error loading game character:", error);
    });

    // Start Main Game Loop
    gameLoop();
}

// Main Game Animation & Render Loop
function gameLoop() {
    requestAnimationFrame(gameLoop);

    if (activeControls) activeControls.update();
    if (activeRenderer && activeGameScene && activeCamera) {
        activeRenderer.render(activeGameScene, activeCamera);
    }
}

// Handle Window Resizing
window.addEventListener('resize', () => {
    if (activeRenderer && activeCamera) {
        activeCamera.aspect = window.innerWidth / window.innerHeight;
        activeCamera.updateProjectionMatrix();
        activeRenderer.setSize(window.innerWidth, window.innerHeight);
    }
});

document.addEventListener('touchmove', (e) => {
    // Keep interactions stable on mobile
}, { passive: true });
