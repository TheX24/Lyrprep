/// <reference types="vite/client" />

declare global {
	interface Window {
		onloadHCaptcha: () => void;
	}
	// Minimal ambient typing for hCaptcha injected by external script
	var hcaptcha: any;
}

export {};
