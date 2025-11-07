
let fontSelector = document.querySelector(".font-selector") as HTMLSelectElement | null;

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

// Load saved font from localStorage
const savedFont = localStorage.getItem("selectedFont") || "inter";
applyFont(savedFont);

if (fontSelector) {
  fontSelector.value = savedFont;
  fontSelector.addEventListener("change", (_) => {
    if (!fontSelector) return;
    const selectedFont = fontSelector.value;
    localStorage.setItem("selectedFont", selectedFont);
    applyFont(selectedFont);
  });
}