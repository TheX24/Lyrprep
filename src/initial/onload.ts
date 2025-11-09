import { instantStore } from "../instantStore";
import { stringCompress } from "../pako/utils";
import { isFromInterface } from "../wdelivery/main";

const asrHost = import.meta.env.VITE_ASR_HOST ?? "https://interface.spicylyrics.org";

async function onloadMain() {
  if (!isFromInterface && !import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search);
    const appSceneRedirectToken = params.get("asr");
   /*  const keepCurrentHostParam = params.has("keepHost");
    const keepCurrentHostStorage = localStorage.getItem("keep-current-host") === "true";

    if (keepCurrentHostStorage) {
      document.body.classList.add("page-loaded");
      return;
    }

    if (keepCurrentHostParam) {
      localStorage.setItem("keep-current-host", "true");
      const url = new URL(window.location.href);
      url.searchParams.delete("keepHost");
      window.location.href = url.toString();
      return;
    } */
  
    if (appSceneRedirectToken) {
      console.log("token", appSceneRedirectToken);

      const data = await asrVerifyToken(appSceneRedirectToken);
      console.log("[asr.verify result]", data)

      instantStore.Items.asrCheck.token = appSceneRedirectToken;
      instantStore.SaveChanges();

      const preAsrHref = sessionStorage.getItem("pre-asr-href")
  
      const url = new URL(preAsrHref ?? window.location.href);
      url.searchParams.delete("asr");
      window.location.href = url.toString();
      return;
    }
  
    await checkAsrStatus();
  } else {
    onFinish();
  }
}

onloadMain();

async function asrVerifyToken(token: string) {
  const formData = new FormData();
  formData.append("t", token);

  const request = await fetch(`${asrHost}/api/generic/asr.verify?t=${Date.now()}`, {
    method: "POST",
    body: formData,
  })

  return await request.text();
}

async function checkAsrStatus() {
  const asrStatus = await asrVerifyToken(instantStore.Items.asrCheck.token);

  if (asrStatus !== "valid") {
    sessionStorage.setItem("pre-asr-href", window.location.href);

    let compressedItems: string;
    try {
      compressedItems = stringCompress(JSON.stringify(instantStore.Items));
    } catch (err) {
      console.error("[asr] Error compressing instantStore.Items:", err);
      compressedItems = "";
    }

    let attr: string | null;
    const storeDataAlreadyTransferred = localStorage.getItem("store-data-transferred") === "true";
    try {
      attr = encodeURIComponent(
        `_fp=${window.location.pathname}` +
        !storeDataAlreadyTransferred ? `&_pu=${compressedItems}` : ""
      );
      localStorage.setItem("store-data-transferred", "true");
    } catch (err) {
      console.error("[asr] Error encoding attr parameter:", err);
      attr = null;
    }
    window.location.href = `${asrHost}/app-scene/verify_auth?source=lprcs&dest=lprcs_dash&fail_dest=lprcs${attr ? `&attr=${attr}` : ""}`
  } else {
    const preAsrHref = sessionStorage.getItem("pre-asr-href");
    sessionStorage.removeItem("pre-asr-href");
    if (preAsrHref != null) {
      if (preAsrHref === window.location.href) {
        onFinish();
      }
    } else {
      onFinish();
    }
  }
}


function onFinish() {
  try {
    const initLoader = document.querySelector(".main__init-Loader") as HTMLElement | null;
    const initLoaderSpinner = initLoader?.querySelector(".spinning-loader") as HTMLElement | null;
    const searchModal = document.querySelector('.search-modal') as HTMLElement | null;
    const settingsPanel = document.querySelector('.settings-panel') as HTMLElement | null;
    const overlay = document.querySelector('.overlay') as HTMLElement | null;

    if (!initLoader || !initLoaderSpinner || !searchModal || !settingsPanel || !overlay) {
      document.body.classList.add("page-loaded");
      return;
    }

    if (!searchModal.classList.contains("active") && !settingsPanel.classList.contains("active")) {
      document.body.classList.add("page-loaded");
      overlay.classList.remove("active");
      initLoader.classList.remove("active");
      setTimeout(() => {
        try {
          initLoaderSpinner.classList.remove("activeAnimation");
        } catch (removeErr) {
          console.error("[onFinish] Error removing class from initLoaderSpinner:", removeErr);
        }
      }, 1000);
    }
  } catch (err) {
    console.error("[onFinish] Unexpected error:", err);
  }
}