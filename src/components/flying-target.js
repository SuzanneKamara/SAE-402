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
    this.basePosition = this.el.object3D.position.clone();
    this.phaseOffset = Math.random() * Math.PI * 2;
    
    console.log(`🎯 Flying-target initialisé: mode=${this.data.mode}, speed=${this.data.speed.toFixed(1)}`);
  },

  tick: function (time) {
    if (!this.data.enabled) return;

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
});
