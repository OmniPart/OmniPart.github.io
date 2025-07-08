import * as SPLAT from "https://cdn.jsdelivr.net/npm/gsplat@latest";

export class GSViewerModule {
  constructor(container, modelBaseNames, modelPath, imagePath) {
    this.container = container;
    this.modelBaseNames = modelBaseNames;
    this.modelPath = modelPath;
    this.imagePath = imagePath;
    this.imageExtension = ".png";
    this.modelExtension = ".ply";
    
    // Left viewer (combined)
    this.canvasLeft = null;
    this.rendererLeft = null;
    this.sceneLeft = null;
    this.cameraLeft = null;
    this.controlsLeft = null;
    
    // Right viewer (exploded)
    this.canvasRight = null;
    this.rendererRight = null;
    this.sceneRight = null;
    this.cameraRight = null;
    this.controlsRight = null;
    
    this.currentModel = this.modelBaseNames[0];
    this.swiper = null;
  }

  init() {
    this.setupViewers();
    this.createImageSlider();
    this.loadModel(this.modelBaseNames[0]);
  }

  setupViewers() {
    // Setup left viewer
    this.canvasLeft = document.getElementById("gs-canvas-left");
    this.rendererLeft = new SPLAT.WebGLRenderer(this.canvasLeft);
    this.sceneLeft = new SPLAT.Scene();
    this.cameraLeft = new SPLAT.Camera();
    this.controlsLeft = new SPLAT.OrbitControls(this.cameraLeft, this.canvasLeft);
    
    // Setup right viewer
    this.canvasRight = document.getElementById("gs-canvas-right");
    this.rendererRight = new SPLAT.WebGLRenderer(this.canvasRight);
    this.sceneRight = new SPLAT.Scene();
    this.cameraRight = new SPLAT.Camera();
    this.controlsRight = new SPLAT.OrbitControls(this.cameraRight, this.canvasRight);
    
    // Start render loops
    this.startRenderLoop();
  }

  async loadModel(baseName) {
    this.currentModel = baseName;
    
    // Clear existing scenes
    this.sceneLeft.reset();
    this.sceneRight.reset();
    
    // Show progress dialogs
    const progressDialogLeft = document.getElementById("gs-progress-dialog-left");
    const progressDialogRight = document.getElementById("gs-progress-dialog-right");
    const progressIndicatorLeft = document.getElementById("gs-progress-indicator-left");
    const progressIndicatorRight = document.getElementById("gs-progress-indicator-right");
    
    progressDialogLeft.style.display = "block";
    progressDialogRight.style.display = "block";
    
    try {
      // Load combined model (left)
      const urlLeft = `${this.modelPath}/${baseName}.ply`;
      await SPLAT.PLYLoader.LoadAsync(urlLeft, this.sceneLeft, (progress) => {
        progressIndicatorLeft.value = progress * 100;
      });
      progressDialogLeft.style.display = "none";
      
      // Load exploded model (right)
      const urlRight = `${this.modelPath}/${baseName}_exploded.ply`;
      await SPLAT.PLYLoader.LoadAsync(urlRight, this.sceneRight, (progress) => {
        progressIndicatorRight.value = progress * 100;
      });
      progressDialogRight.style.display = "none";
      
    } catch (error) {
      console.error("Error loading models:", error);
      progressDialogLeft.style.display = "none";
      progressDialogRight.style.display = "none";
    }
    
    // Update active image
    this.updateActiveImage(baseName);
  }

  createImageSlider() {
    const sliderContainer = document.querySelector(
      `${this.container} #gs-image-slider`
    );
    
    this.modelBaseNames.forEach((baseName, index) => {
      const slide = document.createElement("div");
      slide.classList.add("swiper-slide");

      const img = document.createElement("img");
      img.src = `${this.imagePath}/${baseName}${this.imageExtension}`;
      img.alt = `Model ${index + 1}`;
      img.dataset.model = baseName;
      img.onclick = () => this.loadModel(baseName);

      slide.appendChild(img);
      sliderContainer.appendChild(slide);
    });

    // Initialize Swiper
    this.swiper = new Swiper(`${this.container} .gs-swiper`, {
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

  startRenderLoop() {
    const frame = () => {
      // Update controls
      this.controlsLeft.update();
      this.controlsRight.update();
      
      // Render scenes
      this.rendererLeft.render(this.sceneLeft, this.cameraLeft);
      this.rendererRight.render(this.sceneRight, this.cameraRight);

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  }
}
