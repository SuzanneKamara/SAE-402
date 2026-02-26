/**
 * Composant flying-target SIMPLIFIÉ pour A-Frame
 * Mouvement circulaire BASIQUE qui fonctionne à 100%
 * Basé sur la même logique que simple-oscillate qui FONCTIONNE
 */

AFRAME.registerComponent("flying-target-simple", {
  schema: {
    radius: { type: "number", default: 0.5 },
    speed: { type: "number", default: 1.0 },
    plane: { type: "string", default: "xy" }, // xy, xz, ou yz
    enabled: { type: "boolean", default: true },
  },

  init: function () {
    // Position centrale du cercle
    this.centerX = this.el.object3D.position.x;
    this.centerY = this.el.object3D.position.y;
    this.centerZ = this.el.object3D.position.z;
    
    this.time = 0;
    this.tickCount = 0;
    
    console.log(`✅ Flying-target-simple INIT: center=(${this.centerX.toFixed(2)}, ${this.centerY.toFixed(2)}, ${this.centerZ.toFixed(2)})`);
    console.log(`   Rayon=${this.data.radius.toFixed(2)}m, Plan=${this.data.plane}, Speed=${this.data.speed}`);
    
    if (window.vrDebugLog) {
      window.vrDebugLog(`Circular: ${this.data.plane} r=${this.data.radius.toFixed(2)}m`);
    }
    
    // Pause/Resume
    this.el.sceneEl.addEventListener("game-paused", () => {
      this.data.enabled = false;
    });
    this.el.sceneEl.addEventListener("game-resumed", () => {
      this.data.enabled = true;
    });
  },

  tick: function (time, deltaTime) {
    this.tickCount++;
    
    if (!this.data.enabled) {
      return;
    }
    
    // Incrémenter le temps
    const dt = deltaTime ? (deltaTime / 1000) : 0.016;
    this.time += dt * this.data.speed;
    
    // Calculer angle et position
    const angle = this.time;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const radius = this.data.radius;
    
    // Nouvelle position selon le plan
    let newX = this.centerX;
    let newY = this.centerY;
    let newZ = this.centerZ;
    
    switch (this.data.plane) {
      case "xy": // Vertical (X horizontal, Y vertical)
        newX = this.centerX + cosAngle * radius;
        newY = this.centerY + sinAngle * radius;
        break;
        
      case "xz": // Horizontal (X horizontal, Z profondeur)
        newX = this.centerX + cosAngle * radius;
        newZ = this.centerZ + sinAngle * radius;
        break;
        
      case "yz": // Sagittal (Y vertical, Z profondeur)
        newY = this.centerY + cosAngle * radius;
        newZ = this.centerZ + sinAngle * radius;
        break;
    }
    
    // 🔥 APPLIQUER (même technique que simple-oscillate)
    this.el.object3D.position.set(newX, newY, newZ);
    
    // Debug
    if (this.tickCount === 1 && window.vrDebugLog) {
      window.vrDebugLog("Flying-simple: TICK1!");
    }
    
    if (this.tickCount % 60 === 0 && window.vrDebugLog) {
      const angleDeg = (angle * 180 / Math.PI) % 360;
      window.vrDebugLog(`Fly: ${angleDeg.toFixed(0)}deg`);
    }
    
    if (this.tickCount === 5) {
      console.log(`🎯 Flying-target-simple MOVING! Angle=${angle.toFixed(2)}, Pos=(${newX.toFixed(3)}, ${newY.toFixed(3)}, ${newZ.toFixed(3)})`);
    }
  },
  
  pause: function () {
    this.data.enabled = false;
  },
  
  resume: function () {
    this.data.enabled = true;
  }
});
