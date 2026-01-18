import { instantStore, instantStoreNamingScheme } from "../instantStore";

const queryParams = new URLSearchParams(window.location.search);
export const isFromInterface = queryParams.get("wdelivery-source") === "interface" && (window.self !== window.top);
export const interfaceHost = "https://interface.spicylyrics.org";
const wDeliveryClientContextString = queryParams.get("wdeliveryclient-context");
const wDeliveryClientContext = wDeliveryClientContextString != null && isFromInterface ? JSON.parse(wDeliveryClientContextString) : {};
export const wd_UserId = wDeliveryClientContext?.tUserId ?? "default";

if (isFromInterface) {
  document.body.classList.add("wdelivery-source_interface");

  window.parent.postMessage({
    type: "queryUpdates"
  }, interfaceHost);
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
    } /* else if (event.data.type === "local_pack_update") {
      try {
        const data = event.data.data;

        let contents: string;
        try {
          contents = decompressString(data);
        } catch (decompressErr) {
          console.error("[wdelivery] Failed to decompress data in local_pack_update:", decompressErr);
          return;
        }

        let objContents: any;
        try {
          objContents = JSON.parse(contents);
        } catch (parseErr) {
          console.error("[wdelivery] Failed to parse JSON from decompressed data in local_pack_update:", parseErr);
          return;
        }

        let isCurrentInStorage: boolean = false;
        let areLyricsInStorage: boolean = false;

        try {
          const storageItem = localStorage.getItem(instantStoreNamingScheme);
          isCurrentInStorage = storageItem != null;

          // Only try to JSON.parse if exists
          if (isCurrentInStorage) {
            let parsed: any;
            try {
              parsed = JSON.parse(storageItem as string);
              areLyricsInStorage = parsed?.Items?.lastLyrics != "";
            } catch (parseErr) {
              // If parsing failed, warn and do not set areLyricsInStorage
              console.warn("[wdelivery] Failed to parse instantStore from localStorage:", parseErr);
            }
          }
        } catch (err) {
          console.error("[wdelivery] Error accessing localStorage in local_pack_update:", err);
        }

        if (isCurrentInStorage && (areLyricsInStorage || objContents.lastLyrics == "")) {
          return;
        }

        try {
          if (isCurrentInStorage && !areLyricsInStorage) {
            instantStore.Items.lastLyrics = objContents.lastLyrics
          } else {
            instantStore.Overwrite(objContents);
          }
          instantStore.SaveChanges();
        } catch (updateErr) {
          console.error("[wdelivery] Error updating instantStore from local_pack_update:", updateErr);
          return;
        }

        window.location.reload();
      } catch (err) {
        console.error("[wdelivery] Unexpected error during local_pack_update handling:", err);
      }
    } */
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