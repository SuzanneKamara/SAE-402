/**
 * Composant debug-vr-log
 * Affiche des logs en VR dans un panneau discret
 */

AFRAME.registerComponent("debug-vr-log", {
  schema: {
    maxLines: { type: "number", default: 6 },
    width: { type: "number", default: 1.6 },
  },

  init: function () {
    this.lines = [];

    // Marquer comme élément HUD pour exclure des collisions
    this.el.setAttribute("hud-element", "");

    const panel = document.createElement("a-entity");
    panel.setAttribute("geometry", {
      primitive: "plane",
      width: this.data.width,
      height: 0.5,
    });
    panel.setAttribute("material", {
      color: "#111111",
      opacity: 0.7,
      transparent: true,
      shader: "flat",
    });
    panel.setAttribute("position", "0 0 0");
    this.el.appendChild(panel);

    this.textEl = document.createElement("a-text");
    this.textEl.setAttribute("value", "VR Debug Ready\nWaiting...");
    this.textEl.setAttribute("align", "center");
    this.textEl.setAttribute("color", "#FFFFFF");
    this.textEl.setAttribute("width", this.data.width * 0.9);
    this.textEl.setAttribute("wrap-count", 40);
    this.textEl.setAttribute("position", "0 0 0.01");
    this.el.appendChild(this.textEl);

    window.vrDebugLog = (message) => {
      if (!message) return;
      this.lines.push(message.toString());
      if (this.lines.length > this.data.maxLines) {
        this.lines.shift();
      }
      this.textEl.setAttribute("value", this.lines.join("\n"));
    };
    
    // 🧪 Test immédiat
    console.log("✅ debug-vr-log initialisé");
    window.vrDebugLog("VR Debug Ready!");
    window.vrDebugLog("Waiting for game...");
  },

  tick: function () {
    const camera = this.el.sceneEl.camera;
    if (!camera) return;

    const cameraPos = camera.getWorldPosition(new THREE.Vector3());
    this.el.object3D.lookAt(cameraPos);
  },
});
