/**
 * Theme accent color - picker controls title, group titles, and accent lines.
 * Boss names and card text stay fixed.
 */
(function () {
  const STORAGE_KEY = "eden-accent-hex";
  const DEFAULT_HEX = "#edebed";

  function hexToRgb(hex) {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
  }

  function lighten(r, g, b, factor = 1.15) {
    return {
      r: Math.min(255, Math.round(r * factor + (1 - factor) * 255 * 0.3)),
      g: Math.min(255, Math.round(g * factor + (1 - factor) * 255 * 0.3)),
      b: Math.min(255, Math.round(b * factor + (1 - factor) * 255 * 0.3)),
    };
  }

  function applyHex(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    const light = lighten(rgb.r, rgb.g, rgb.b);
    const root = document.documentElement;
    root.style.setProperty("--accent-r", rgb.r);
    root.style.setProperty("--accent-g", rgb.g);
    root.style.setProperty("--accent-b", rgb.b);
    root.style.setProperty("--accent", `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    root.style.setProperty("--accent-light", `rgb(${light.r}, ${light.g}, ${light.b})`);
  }

  function getSavedHex() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && /^#[a-f\d]{6}$/i.test(saved) ? saved : DEFAULT_HEX;
    } catch {
      return DEFAULT_HEX;
    }
  }

  function saveHex(hex) {
    try {
      localStorage.setItem(STORAGE_KEY, hex);
    } catch (_) {}
  }

  let colorPickerInstance = null;
  let wheelPopover = null;

  function resetToDefault() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
    applyHex(DEFAULT_HEX);
    if (colorPickerInstance) {
      colorPickerInstance.color.hexString = DEFAULT_HEX;
    }
    const swatch = document.getElementById("theme-swatch");
    if (swatch) swatch.style.backgroundColor = DEFAULT_HEX;
  }

  function closeWheelPopover() {
    if (wheelPopover && wheelPopover.parentNode) {
      wheelPopover.remove();
      wheelPopover = null;
    }
    if (colorPickerInstance) {
      colorPickerInstance = null;
    }
    document.removeEventListener("click", closeOnOutsideClick);
  }

  function closeOnOutsideClick(e) {
    if (!wheelPopover || !e.target) return;
    if (wheelPopover.contains(e.target) || e.target.closest("#theme-swatch")) return;
    closeWheelPopover();
  }

  // Apply accent immediately
  applyHex(getSavedHex());

  function initThemeSwitcher() {
    const container = document.getElementById("theme-switcher");
    if (!container) return;

    const wrapper = document.createElement("span");
    wrapper.className = "inline-flex items-center gap-1";

    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.id = "theme-swatch";
    swatch.className = "theme-picker w-6 h-6 rounded-full cursor-pointer border-2 border-gray-500 hover:border-gray-400 transition-colors flex-shrink-0";
    swatch.title = "Pick accent color";
    swatch.setAttribute("aria-label", "Pick accent color");
    swatch.style.backgroundColor = getSavedHex();

    swatch.addEventListener("click", (e) => {
      e.stopPropagation();
      if (wheelPopover) {
        closeWheelPopover();
        return;
      }
      wheelPopover = document.createElement("div");
      wheelPopover.className = "theme-wheel-popover";
      wheelPopover.style.cssText = "position: fixed; z-index: 9999; background: rgb(26, 32, 46); border: 1px solid rgba(75, 85, 99, 0.6); border-radius: 12px; padding: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);";
      const pickerEl = document.createElement("div");
      pickerEl.id = "iro-wheel-container";
      wheelPopover.appendChild(pickerEl);
      const rect = swatch.getBoundingClientRect();
      wheelPopover.style.left = Math.max(8, rect.left - 80) + "px";
      wheelPopover.style.top = Math.max(8, rect.bottom + 8) + "px";
      document.body.appendChild(wheelPopover);

      if (typeof iro !== "undefined") {
        colorPickerInstance = new iro.ColorPicker("#iro-wheel-container", {
          width: 200,
          color: getSavedHex(),
          layout: [{ component: iro.ui.Wheel }],
        });
        colorPickerInstance.on("color:change", function (color) {
          const hex = color.hexString;
          saveHex(hex);
          applyHex(hex);
          swatch.style.backgroundColor = hex;
        });
      }
      requestAnimationFrame(() => document.addEventListener("click", closeOnOutsideClick));
    });

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "accent-reset text-gray-500 hover:text-gray-400 text-xs focus:outline-none p-0.5 leading-none";
    resetBtn.title = "Reset to default color";
    resetBtn.setAttribute("aria-label", "Reset accent to default");
    resetBtn.textContent = "↺";

    resetBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      resetToDefault();
    });

    wrapper.appendChild(swatch);
    wrapper.appendChild(resetBtn);
    container.appendChild(wrapper);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeSwitcher);
  } else {
    initThemeSwitcher();
  }
})();
