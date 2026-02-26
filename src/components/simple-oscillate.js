/**
 * TEST ULTRA-SIMPLE : Composant qui fait osciller une entité de haut en bas
 * Si ça ne fonctionne pas, le problème est AILLEURS (pas dans flying-target)
 */

AFRAME.registerComponent("simple-oscillate", {
  schema: {
    amplitude: { type: "number", default: 0.5 },
    speed: { type: "number", default: 1.0 }
  },

  init: function () {
    this.startY = this.el.object3D.position.y;
    this.time = 0;
    console.log("✅ SIMPLE-OSCILLATE INIT: startY=" + this.startY.toFixed(2));
    if (window.vrDebugLog) {
      window.vrDebugLog("Simple-Osc INIT OK");
    }
  },

  tick: function (time, deltaTime) {
    const dt = deltaTime / 1000;
    this.time += dt * this.data.speed;
    
    const offset = Math.sin(this.time) * this.data.amplitude;
    const newY = this.startY + offset;
    
    this.el.object3D.position.y = newY;
    
    // Log toutes les 60 frames
    if (Math.floor(time / 1000) % 2 === 0 && Math.floor(time % 1000) < 50) {
      console.log(`🔵 Simple oscillate: Y=${newY.toFixed(3)} (offset=${offset.toFixed(3)})`);
      if (window.vrDebugLog) {
        window.vrDebugLog(`Osc: Y=${newY.toFixed(2)}`);
      }
    }
  }
});
