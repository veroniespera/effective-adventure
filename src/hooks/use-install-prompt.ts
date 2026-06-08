"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

function getIsStandalone() {
	// Detect an installed PWA across platforms: display-mode (Android/desktop)
	// and navigator.standalone (iOS Safari home-screen apps).
	return (
		window.matchMedia("(display-mode: standalone)").matches ||
		window.matchMedia("(display-mode: fullscreen)").matches ||
		window.matchMedia("(display-mode: minimal-ui)").matches ||
		("standalone" in navigator &&
			(navigator as Navigator & { standalone?: boolean }).standalone === true)
	);
}

function getIsIOS() {
	return (
		/iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window)
	);
}

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallPrompt() {
	const isStandalone = useSyncExternalStore(
		emptySubscribe,
		getIsStandalone,
		() => false,
	);
	const isIOS = useSyncExternalStore(emptySubscribe, getIsIOS, () => false);

	const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
	const [canInstall, setCanInstall] = useState(false);
	const [isInstalled, setIsInstalled] = useState(false);

	// Detect whether the PWA is already installed while running in the browser
	// (Chrome/Android via getInstalledRelatedApps). Lets us offer "open in app"
	// instead of "install". Unsupported browsers leave this false.
	useEffect(() => {
		const nav = navigator as Navigator & {
			getInstalledRelatedApps?: () => Promise<unknown[]>;
		};
		if (typeof nav.getInstalledRelatedApps === "function") {
			nav
				.getInstalledRelatedApps()
				.then((apps) => setIsInstalled(apps.length > 0))
				.catch(() => {});
		}
	}, []);

	useEffect(() => {
		function handleBeforeInstallPrompt(e: Event) {
			e.preventDefault();
			deferredPromptRef.current = e as BeforeInstallPromptEvent;
			setCanInstall(true);
		}

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
		};
	}, []);

	async function triggerInstall(): Promise<boolean> {
		const prompt = deferredPromptRef.current;
		if (!prompt) return false;

		await prompt.prompt();
		const { outcome } = await prompt.userChoice;
		deferredPromptRef.current = null;

		if (outcome === "accepted") {
			setCanInstall(false);
			return true;
		}
		return false;
	}

	return {
		canInstall,
		isIOS,
		isStandalone,
		isInstalled,
		triggerInstall,
	};
}
