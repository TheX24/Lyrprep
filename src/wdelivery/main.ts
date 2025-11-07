const queryParams = new URLSearchParams(window.location.search);
export const isFromInterface = true;//queryParams.get("wdelivery-source") === "interface" && (window.self !== window.top);
export const interfaceHost = "https://interface.spicylyrics.org";
const wDeliveryClientContextString = queryParams.get("wdeliveryclient-context");
const wDeliveryClientContext = wDeliveryClientContextString != null && isFromInterface ? JSON.parse(wDeliveryClientContextString) : {};
export const wd_UserId = wDeliveryClientContext?.tUserId ?? "default";

if (isFromInterface) {
  document.body.classList.add("wdelivery-source_interface");
}

const guideBtn = document.querySelector(".help-btn") as HTMLAnchorElement | null;

if (guideBtn) {
  guideBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const guideHref = guideBtn.getAttribute("href");
    window.location.href = `${guideHref?.toString()}${window.location.search}`
  })
}

const callbacksPerId = new Map();

window.addEventListener("message", (event) => {
  if (event.origin !== interfaceHost) return;

  try {
    if (!event.data || typeof event.data !== "object") return;
    if (event.data.type === "response") {
      if (!event.data.id) {
        console.warn("[wdelivery] Received response event without id");
        return;
      }
      const callback = callbacksPerId.get(event.data.id);
      if (typeof callback === "function") {
        callback(event.data.data);
        callbacksPerId.delete(event.data.id);
      } else {
        // Unknown callback, ignore but warn
        console.warn(`[wdelivery] No callback found for id: ${event.data.id}`);
      }
    }
  } catch (err) {
    console.error("[wdelivery] Error handling postMessage event:", err);
  }
});

/**
 * Requests content from the parent window.
 * @param {string} type - Request type.
 * @param {any} body - Request body.
 * @returns {Promise<any>} The data received from the parent.
 */
export const requestContent = async (type: string, body: any): Promise<any> => {
  const id = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');

  return new Promise((resolve, reject) => {
    try {
      callbacksPerId.set(id, (data: any) => {
        resolve(data);
      });

      window.parent.postMessage({
        type: "request",
        id,
        metadata: {
          type: type,
          body
        }
      }, interfaceHost);
    } catch (err) {
      callbacksPerId.delete(id);
      console.error("[wdelivery] Failed to postMessage to parent:", err);
      reject(err);
    }
  });
}