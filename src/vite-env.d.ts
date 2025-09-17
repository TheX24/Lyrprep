/// <reference types="vite/client" />

declare global {
	interface Window {
		onloadHCaptcha: () => void;
		InternalEvent: {
			listen: (event: string, handler: (data: any) => void) => number;
			unListen: (event: string, id: number) => void;
			evoke: (event: string, data: any) => void;
		};
	}
	// Minimal ambient typing for hCaptcha injected by external script
	var hcaptcha: any;
}

export {};
