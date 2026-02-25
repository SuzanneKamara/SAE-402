/**
 * Composant flying-target pour A-Frame
 * Anime une cible avec un mouvement sinusoïdal
 * Modes : 'horizontal' (plan X-Z), 'vertical' (plan Y-Z), 'free' (3D)
 */

AFRAME.registerComponent("flying-target", {
  schema: {
    // Mode de mouvement : 'horizontal' (mur/sol), 'vertical' (devant/bas), 'free' (tous axes)
    mode: { type: "string", default: "horizontal" },
    
    // Amplitudes de mouvement
    amplitudeX: { type: "number", default: 0.6 },
    amplitudeY: { type: "number", default: 0.3 },
    amplitudeZ: { type: "number", default: 0.4 },
    
    // Vitesse de mouvement
    speed: { type: "number", default: 1.2 },
    
    // Activé/Désactivé
    enabled: { type: "boolean", default: true },
  },

  init: function () {
    this.basePosition = null; // Sera capturé au premier tick
    this.basePositionCaptured = false;
    this.phaseOffset = Math.random() * Math.PI * 2;
    
    // Écouteurs d'événements pour la pause/reprise du jeu
    this.onGamePaused = this.pause.bind(this);
    this.onGameResumed = this.resume.bind(this);
    
    this.el.sceneEl.addEventListener("game-paused", this.onGamePaused);
    this.el.sceneEl.addEventListener("game-resumed", this.onGameResumed);
    
    console.log(`🎯 Flying-target initialisé: enabled=${this.data.enabled}, mode=${this.data.mode}, speed=${this.data.speed.toFixed(1)}`);
  },

  tick: function (time) {
    if (!this.data.enabled) return;

    // Capturer la position de base au premier tick (quand l'élément est dans la scène)
    if (!this.basePositionCaptured) {
      this.basePosition = this.el.object3D.position.clone();
      this.basePositionCaptured = true;
      console.log(`📍 Base position capturée: [${this.basePosition.x.toFixed(2)}, ${this.basePosition.y.toFixed(2)}, ${this.basePosition.z.toFixed(2)}]`);
    }

    const t = time / 1000;
    let newX = this.basePosition.x;
    let newY = this.basePosition.y;
    let newZ = this.basePosition.z;

    // Appliquer le mouvement selon le mode
    switch (this.data.mode) {
      // Plan horizontal (X-Z) : murs et plafonds
      case "horizontal":
        newX += Math.sin(t * this.data.speed + this.phaseOffset) * this.data.amplitudeX;
        newZ += Math.cos(t * (this.data.speed * 0.8) + this.phaseOffset) * this.data.amplitudeZ;
        break;

      // Plan vertical (Y-Z) : devant/bas
      case "vertical":
        newY += Math.sin(t * this.data.speed + this.phaseOffset) * this.data.amplitudeY;
        newZ += Math.cos(t * (this.data.speed * 0.8) + this.phaseOffset) * this.data.amplitudeZ;
        break;

      // Plan sagittal (X-Y) : gauche/droite et haut/bas
      case "sagittal":
        newX += Math.sin(t * this.data.speed + this.phaseOffset) * this.data.amplitudeX;
        newY += Math.sin(t * (this.data.speed * 1.3) + this.phaseOffset) * this.data.amplitudeY;
        break;

      // Mouvement 3D libre (tous les axes)
      case "free":
      default:
        newX += Math.sin(t * this.data.speed + this.phaseOffset) * this.data.amplitudeX;
        newY += Math.sin(t * (this.data.speed * 1.3) + this.phaseOffset) * this.data.amplitudeY;
        newZ += Math.cos(t * (this.data.speed * 0.8) + this.phaseOffset) * this.data.amplitudeZ;
        break;
    }

    this.el.object3D.position.set(newX, newY, newZ);

    // Log periodically to verify movement (every 2000ms)
    if (!this.lastLogTime) this.lastLogTime = time;
    if (time - this.lastLogTime > 2000) {
      console.log(`✈️ Moving: pos=[${newX.toFixed(2)}, ${newY.toFixed(2)}, ${newZ.toFixed(2)}], base=[${this.basePosition.x.toFixed(2)}, ${this.basePosition.y.toFixed(2)}, ${this.basePosition.z.toFixed(2)}], amplitudes=[${this.data.amplitudeX.toFixed(2)}, ${this.data.amplitudeY.toFixed(2)}, ${this.data.amplitudeZ.toFixed(2)}], mode=${this.data.mode}, enabled=${this.data.enabled}`);
      this.lastLogTime = time;
    }
  },

  // Pause/Reprendre le mouvement
  pause: function () {
    this.data.enabled = false;
    console.log("⏸️ Mouvement cible pausé");
  },

  resume: function () {
    this.data.enabled = true;
    console.log("▶️ Mouvement cible repris");
  },

  // Changer le mode de mouvement dynamiquement
  setMode: function (newMode) {
    if (["horizontal", "vertical", "sagittal", "free"].includes(newMode)) {
      this.data.mode = newMode;
      console.log(`🔄 Mode de mouvement changé: ${newMode}`);
    }
  },

  // Nettoyer les écouteurs d'événements
  remove: function () {
    if (this.onGamePaused) {
      this.el.sceneEl.removeEventListener("game-paused", this.onGamePaused);
    }
    if (this.onGameResumed) {
      this.el.sceneEl.removeEventListener("game-resumed", this.onGameResumed);
    }
    console.log("🧹 Flying-target nettoyé");
  },
});
