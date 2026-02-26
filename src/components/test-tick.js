/**
 * Composant de test ultra-simple pour vérifier que tick() fonctionne
 */

AFRAME.registerComponent("test-tick", {
  schema: {
    enabled: { type: "boolean", default: true },
  },

  init: function () {
    this.tickCount = 0;
    console.log("🧪 TEST-TICK INIT");
    if (window.vrDebugLog) {
      window.vrDebugLog("TEST-TICK INIT OK");
    }
  },

  tick: function (time, deltaTime) {
    this.tickCount++;
    
    if (this.tickCount === 1) {
      console.log("🧪 TEST-TICK: TICK1");
      if (window.vrDebugLog) {
        window.vrDebugLog("TEST-TICK: TICK1 OK!");
      }
    }
    
    if (this.tickCount === 30) {
      console.log("🧪 TEST-TICK: TICK30");
      if (window.vrDebugLog) {
        window.vrDebugLog("TEST-TICK: TICK30 OK!");
      }
    }
  },
});
