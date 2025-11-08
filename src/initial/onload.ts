import { isFromInterface } from "../wdelivery/main";

function onloadMain() {
  if (!isFromInterface && !import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search);
    const isAppSceneRedirect = params.has("asr");
    const keepCurrentHostParam = params.has("keepHost");
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
    }
  
    if (isAppSceneRedirect) {
      const preAsrHref = sessionStorage.getItem("pre-asr-href");
  
      sessionStorage.setItem("asr-checked", "true");
  
      if (preAsrHref) {
        window.location.href = preAsrHref;
      } else {
        const url = new URL(window.location.href);
        url.searchParams.delete("asr");
        window.location.href = url.toString();
      }
    }
  
    const asrChecked = sessionStorage.getItem("asr-checked") === "true";
  
    if (!asrChecked) {
      sessionStorage.setItem("pre-asr-href", window.location.href);
      const attr = encodeURIComponent(
        `_fp=${window.location.pathname}`
      )
      window.location.href = `https://interface.spicylyrics.org/app-scene/verify_auth?source=lprcs&dest=lprcs_dash&fail_dest=lprcs&attr=${attr}`
    } else {
      const preAsrHref = sessionStorage.getItem("pre-asr-href");
      sessionStorage.removeItem("pre-asr-href");
      if (preAsrHref != null) {
        if (preAsrHref === window.location.href) {
          document.body.classList.add("page-loaded");
        }
      } else {
        document.body.classList.add("page-loaded");
      }
    }
  } else {
    document.body.classList.add("page-loaded");
  }
}

onloadMain();