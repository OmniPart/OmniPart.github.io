export class ViewerModule {
  constructor(container, modelBaseNames, modelPath, imagePath) {
    this.container = container;
    this.modelBaseNames = modelBaseNames;
    this.modelPath = modelPath;
    this.imagePath = imagePath;
    this.imageExtension = ".png";
    this.modelExtension = ".glb";
    
    // Left viewer
    this.sceneLeft = null;
    this.cameraLeft = null;
    this.rendererLeft = null;
    this.modelLeft = null;
    this.controlsLeft = null;
    
    // Right viewer
    this.sceneRight = null;
    this.cameraRight = null;
    this.rendererRight = null;
    this.modelRight = null;
    this.controlsRight = null;
  }

  init() {
    this.setupScenes();
    this.createImageSlider();
    this.loadModel(this.modelBaseNames[0]);
  }

  setupScenes() {
    this.setupLeftViewer();
    this.setupRightViewer();
    this.setupResizeListener();
    this.animate();
  }

  setupResizeListener() {
    window.addEventListener("resize", () => {
      const containerElement = document.querySelector(this.container);
      
      // Update left viewer
      const viewerLeft = containerElement.querySelector("#viewer-left, #viewer-left-2");
      if (viewerLeft && this.rendererLeft && this.cameraLeft) {
        const newWidthLeft = viewerLeft.clientWidth;
        const newHeightLeft = viewerLeft.clientHeight;
        this.rendererLeft.setSize(newWidthLeft, newHeightLeft);
        this.cameraLeft.aspect = newWidthLeft / newHeightLeft;
        this.cameraLeft.updateProjectionMatrix();
      }

      // Update right viewer
      const viewerRight = containerElement.querySelector("#viewer-right, #viewer-right-2");
      if (viewerRight && this.rendererRight && this.cameraRight) {
        const newWidthRight = viewerRight.clientWidth;
        const newHeightRight = viewerRight.clientHeight;
        this.rendererRight.setSize(newWidthRight, newHeightRight);
        this.cameraRight.aspect = newWidthRight / newHeightRight;
        this.cameraRight.updateProjectionMatrix();
      }
    });
  }

  setupLeftViewer() {
    const containerElement = document.querySelector(this.container);
    const viewerLeft = containerElement.querySelector("#viewer-left, #viewer-left-2");
    const width = viewerLeft.clientWidth;
    const height = viewerLeft.clientHeight;

    this.sceneLeft = new THREE.Scene();
    this.cameraLeft = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    this.cameraLeft.position.set(0, 1, 5);

    this.rendererLeft = new THREE.WebGLRenderer({ antialias: true });
    this.rendererLeft.setSize(width, height);
    this.rendererLeft.setClearColor(0xffffff);
    this.rendererLeft.outputEncoding = THREE.sRGBEncoding;
    this.rendererLeft.physicallyCorrectLights = true;
    viewerLeft.appendChild(this.rendererLeft.domElement);

    this.controlsLeft = new THREE.OrbitControls(
      this.cameraLeft,
      this.rendererLeft.domElement
    );
    this.controlsLeft.enableDamping = true;
    this.controlsLeft.dampingFactor = 0.25;

    this.addLights(this.sceneLeft);
  }

  setupRightViewer() {
    const containerElement = document.querySelector(this.container);
    const viewerRight = containerElement.querySelector("#viewer-right, #viewer-right-2");
    const width = viewerRight.clientWidth;
    const height = viewerRight.clientHeight;

    this.sceneRight = new THREE.Scene();
    this.cameraRight = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    this.cameraRight.position.set(0, 1, 5);

    this.rendererRight = new THREE.WebGLRenderer({ antialias: true });
    this.rendererRight.setSize(width, height);
    this.rendererRight.setClearColor(0xffffff);
    this.rendererRight.outputEncoding = THREE.sRGBEncoding;
    this.rendererRight.physicallyCorrectLights = true;
    viewerRight.appendChild(this.rendererRight.domElement);

    this.controlsRight = new THREE.OrbitControls(
      this.cameraRight,
      this.rendererRight.domElement
    );
    this.controlsRight.enableDamping = true;
    this.controlsRight.dampingFactor = 0.25;

    this.addLights(this.sceneRight);
  }

  addLights(scene) {
    // Increase directional light intensity
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    // Increase point light intensity
    const lightIntensity = 25;
    const lightDistance = 100;

    const directions = [
      [10, 0, 0], // +x
      [-10, 0, 0], // -x
      [0, 10, 0], // +y
      [0, -10, 0], // -y
      [0, 0, 10], // +z
      [0, 0, -10], // -z
    ];

    directions.forEach((dir, index) => {
      const pointLight = new THREE.PointLight(
        0xffffff,
        lightIntensity,
        lightDistance
      );
      pointLight.position.set(...dir);
      pointLight.castShadow = true;
      scene.add(pointLight);

      pointLight.name = `PointLight_${index}`;
    });
  }

  loadModel(baseName, index) {
    // Remove existing models
    if (this.modelLeft) this.sceneLeft.remove(this.modelLeft);
    if (this.modelRight) this.sceneRight.remove(this.modelRight);

    // Update active image
    this.updateActiveImage(baseName);

    // Show loading overlays
    const containerElement = document.querySelector(this.container);
    const overlayLeft = containerElement.querySelector("#loading-overlay-left, #loading-overlay-left-2");
    const overlayRight = containerElement.querySelector("#loading-overlay-right, #loading-overlay-right-2");
    overlayLeft.style.display = "block";
    overlayRight.style.display = "block";

    const loader = new THREE.GLTFLoader();
    let loadedCount = 0;
    
    const onModelLoaded = () => {
      loadedCount++;
      if (loadedCount === 2) {
        // Both models loaded
        overlayLeft.style.display = "none";
        overlayRight.style.display = "none";
        
        // Reset cameras
        this.cameraLeft.position.set(0, 1, 5);
        this.cameraRight.position.set(0, 1, 5);

        // Create explode slider
        this.createExplodeSlider();
      }
    };

    // Load bbox model for left viewer
    loader.load(
      `${this.modelPath}/${baseName}_bbox${this.modelExtension}`,
      (gltf) => {
        this.modelLeft = gltf.scene.clone();
        
        // Scale the model to 2x to go from -0.5->0.5 range to -1->1 range
        this.modelLeft.scale.set(1.7, 1.7, 1.7);
        
        this.sceneLeft.add(this.modelLeft);

        this.modelLeft.traverse((child) => {
          if (child.isMesh) child.visible = true;
        });

        this.changeModelColor(this.modelLeft, 0xffffff);
        onModelLoaded();
      }
    );

    // Load original model for right viewer
    loader.load(
      `${this.modelPath}/${baseName}${this.modelExtension}`,
      (gltf) => {
        this.modelRight = gltf.scene.clone();
        
        // Scale the model to 2x to go from -0.5->0.5 range to -1->1 range
        this.modelRight.scale.set(1.7, 1.7, 1.7);
        
        this.sceneRight.add(this.modelRight);

        this.modelRight.traverse((child) => {
          if (child.isMesh) child.visible = true;
        });

        this.changeModelColor(this.modelRight, 0xffffff);
        onModelLoaded();
      }
    );
  }

  changeModelColor(model, color) {
    if (model) {
      model.traverse((child) => {
        if (child.isMesh) {
          child.material.color.set(color);
        }
      });
    }
  }

  createImageSlider() {
    const sliderContainer = document.querySelector(
      `${this.container} #image-slider, ${this.container} #image-slider-2`
    );
    this.modelBaseNames.forEach((baseName, index) => {
      const slide = document.createElement("div");
      slide.classList.add("swiper-slide");

      const img = document.createElement("img");
      img.src = `${this.imagePath}/${baseName}${this.imageExtension}`;
      img.alt = `Model ${index + 1}`;
      img.dataset.model = baseName;
      img.onclick = () => this.loadModel(baseName, index);

      slide.appendChild(img);
      sliderContainer.appendChild(slide);
    });

    this.swiper = new Swiper(`${this.container} .scene-swiper`, {
      slidesPerView: "auto",
      slidesPerGroup: 2,
      spaceBetween: 10,
      rewind: true,
      navigation: {
        nextEl: `${this.container} .swiper-button-next`,
        prevEl: `${this.container} .swiper-button-prev`,
      },
    });

    // Set first image as active
    if (this.modelBaseNames.length > 0) {
      this.updateActiveImage(this.modelBaseNames[0]);
    }
  }

  createExplodeSlider() {
    const controlsDiv = document.querySelector(
      `${this.container} #button-block, ${this.container} #button-block-2`
    );
    controlsDiv.innerHTML = ""; // Clear existing buttons

    const sliderContainer = document.createElement("div");
    sliderContainer.style.display = "flex";
    sliderContainer.style.alignItems = "center";
    sliderContainer.style.justifyContent = "center";
    sliderContainer.style.margin = "10px";

    const label = document.createElement("span");
    label.textContent = "Explode: ";
    label.style.marginRight = "10px";
    label.style.fontWeight = "bold"; // Make the label bold

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "1";
    slider.step = "0.01";
    slider.value = "0";
    slider.style.width = "300px";

    slider.oninput = (event) => {
      const explodeAmount = parseFloat(event.target.value);
      this.applyExplodeEffect(explodeAmount);
    };

    sliderContainer.appendChild(label);
    sliderContainer.appendChild(slider);
    controlsDiv.appendChild(sliderContainer);
  }

  applyExplodeEffect(explodeAmount) {
    this.applyExplodeToModel(this.modelLeft, explodeAmount);
    this.applyExplodeToModel(this.modelRight, explodeAmount);
  }

  applyExplodeToModel(model, explodeAmount) {
    if (!model) return;

    const root = model.children[0];
    root.children.forEach((part, index) => {
      const bbox = new THREE.Box3().setFromObject(part);
      const center = bbox.getCenter(new THREE.Vector3());
      const direction = center.clone().sub(new THREE.Vector3(0, 0, 0)).normalize();

      // Calculate the new position based on the explode amount
      const originalPosition = new THREE.Vector3().copy(part.userData.originalPosition || part.position);
      const offset = direction.multiplyScalar(explodeAmount * 2);
      const newPosition = originalPosition.clone().add(offset);

      // Store the original position if not already stored
      if (!part.userData.originalPosition) {
        part.userData.originalPosition = originalPosition.clone();
      }

      part.position.copy(newPosition);
    });
  }

  updateActiveImage(baseName) {
    // Remove active class from all images
    const allImages = document.querySelectorAll(`${this.container} .swiper-slide img`);
    allImages.forEach(img => img.classList.remove('active'));
    
    // Add active class to current image
    const activeImage = document.querySelector(`${this.container} .swiper-slide img[data-model="${baseName}"]`);
    if (activeImage) {
      activeImage.classList.add('active');
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Update controls
    if (this.controlsLeft) this.controlsLeft.update();
    if (this.controlsRight) this.controlsRight.update();
    
    // Render scenes
    if (this.rendererLeft && this.sceneLeft && this.cameraLeft) {
      this.rendererLeft.render(this.sceneLeft, this.cameraLeft);
    }
    if (this.rendererRight && this.sceneRight && this.cameraRight) {
      this.rendererRight.render(this.sceneRight, this.cameraRight);
    }
  }
}
