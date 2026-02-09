/**
 * Composant flying-target pour A-Frame
 * Anime une cible avec un mouvement sinusoïdal
 */

AFRAME.registerComponent("flying-target", {
  schema: {
    amplitudeX: { type: "number", default: 0.6 },
    amplitudeY: { type: "number", default: 0.3 },
    amplitudeZ: { type: "number", default: 0.4 },
    speed: { type: "number", default: 1.2 },
  },

  init: function () {
    this.basePosition = this.el.object3D.position.clone();
    this.phaseOffset = Math.random() * Math.PI * 2;
  },

  tick: function (time) {
    const t = time / 1000;
    const offsetX = Math.sin(t * this.data.speed + this.phaseOffset)
      * this.data.amplitudeX;
    const offsetY = Math.sin(t * (this.data.speed * 1.3) + this.phaseOffset)
      * this.data.amplitudeY;
    const offsetZ = Math.cos(t * (this.data.speed * 0.8) + this.phaseOffset)
      * this.data.amplitudeZ;

    this.el.object3D.position.set(
      this.basePosition.x + offsetX,
      this.basePosition.y + offsetY,
      this.basePosition.z + offsetZ,
    );
  },
});
