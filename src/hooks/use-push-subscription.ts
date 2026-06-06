"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import {
	subscribeUser,
	unsubscribeUser,
} from "@/app/actions/push-notifications";

function urlBase64ToUint8Array(base64String: string) {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

const emptySubscribe = () => () => {};

function getIsSupported() {
	return "serviceWorker" in navigator && "PushManager" in window;
}

export function usePushSubscription() {
	const isSupported = useSyncExternalStore(
		emptySubscribe,
		getIsSupported,
		() => false,
	);
	const [subscription, setSubscription] = useState<PushSubscription | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [permissionDenied, setPermissionDenied] = useState(false);

	// Read the live browser state: notification permission + whether a push
	// subscription currently exists. The permission can change at any time from
	// the browser's own settings (the user can revoke it), so we always re-derive
	// `permissionDenied` from the actual value rather than latching it once.
	const syncState = useCallback(async (syncOwnership: boolean) => {
		if (!getIsSupported()) return;
		setPermissionDenied(Notification.permission === "denied");
		try {
			const registration = await navigator.serviceWorker.register("/sw.js", {
				scope: "/",
				updateViaCache: "none",
			});
			const sub = await registration.pushManager.getSubscription();
			setSubscription(sub);
			// Ensure the current user owns this browser subscription (server-side
			// dedupes). Only on initial mount — not on every manual refresh.
			if (sub && syncOwnership) {
				const serialized = JSON.parse(JSON.stringify(sub));
				subscribeUser(serialized).catch(() => {});
			}
		} catch {
			// ignore — leave state as-is
		}
	}, []);

	useEffect(() => {
		if (isSupported) {
			void syncState(true);
		}
	}, [isSupported, syncState]);

	// Re-read the live browser state on demand (e.g. when the toggle is shown),
	// so a permission revoked outside the app is reflected without a reload.
	const refresh = useCallback(() => {
		void syncState(false);
	}, [syncState]);

	async function subscribeToPush() {
		setError(null);
		setIsLoading(true);
		try {
			const permission = await Notification.requestPermission();
			if (permission !== "granted") {
				setPermissionDenied(true);
				return false;
			}
			setPermissionDenied(false);

			const registration = await navigator.serviceWorker.ready;
			const sub = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(
					process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
				),
			});
			const serializedSub = JSON.parse(JSON.stringify(sub));
			await subscribeUser(serializedSub);
			setSubscription(sub);
			return true;
		} catch (err) {
			const msg = err instanceof Error ? err.message : JSON.stringify(err);
			setError(`Eroare: ${msg}`);
			return false;
		} finally {
			setIsLoading(false);
		}
	}

	async function unsubscribeFromPush() {
		try {
			await unsubscribeUser();
			await subscription?.unsubscribe();
			setSubscription(null);
		} catch {
			setError("Eroare la dezabonare.");
		}
	}

	return {
		subscription,
		isSupported,
		permissionDenied,
		isLoading,
		error,
		subscribeToPush,
		unsubscribeFromPush,
		refresh,
	};
}
