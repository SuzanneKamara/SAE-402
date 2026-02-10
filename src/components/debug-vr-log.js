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
    this.textEl.setAttribute("value", "VR Debug\n...");
    this.textEl.setAttribute("align", "left");
    this.textEl.setAttribute("color", "#00ff99");
    this.textEl.setAttribute("width", this.data.width);
    this.textEl.setAttribute("position", "-0.75 0.2 0.01");
    this.el.appendChild(this.textEl);

    window.vrDebugLog = (message) => {
      if (!message) return;
      this.lines.push(message.toString());
      if (this.lines.length > this.data.maxLines) {
        this.lines.shift();
      }
      this.textEl.setAttribute("value", this.lines.join("\n"));
    };
  },

  tick: function () {
    const camera = this.el.sceneEl.camera;
    if (!camera) return;

    const cameraPos = camera.getWorldPosition(new THREE.Vector3());
    this.el.object3D.lookAt(cameraPos);
  },
});
