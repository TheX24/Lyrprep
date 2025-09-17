
let fontSelector = document.getElementById("font-selector") as HTMLSelectElement | null;

// Apply font to body or main content container
const applyFont = (font: string) => {
  let fontName = "Inter";
  if (font === "open-dyslexic") {
    fontName = "'OpenDyslexic', Inter";
  } else if (font === "spicy-lyrics") {
    fontName = "'SpicyLyrics', Inter";
  } else if (font === "josefin-sans") {
    fontName = "'Josefin Sans', Inter"
  }
  document.body.style.setProperty("--font-selection", fontName);
};


window.InternalEvent.listen("segment:load", async (segment) => {
  if (segment === "settings_panel") {
    fontSelector = document.getElementById("font-selector") as HTMLSelectElement | null;
    while (!fontSelector) {
      await new Promise((r) => setTimeout(r, 100))
    }
    // Load saved font from localStorage
    const savedFont = localStorage.getItem("selectedFont") || "inter";
    fontSelector.value = savedFont;
    applyFont(savedFont);

    fontSelector.addEventListener("change", (_) => {
      if (!fontSelector) return;
      const selectedFont = fontSelector.value;
      localStorage.setItem("selectedFont", selectedFont);
      applyFont(selectedFont);
    });
  }
})