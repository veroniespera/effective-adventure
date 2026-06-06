"use client";

import { useEffect } from "react";
import { Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { usePushSubscription } from "@/hooks/use-push-subscription";

/**
 * Notifications on/off switch shown in the user menu, next to "Schimbă parola".
 * Always reflects the live browser state: it re-reads notification permission
 * and the push subscription each time it mounts (i.e. when the menu opens), so
 * a permission revoked from the browser is shown correctly instead of leaving
 * the user with no visible control.
 */
export function NotificationToggle() {
	const {
		subscription,
		isSupported,
		permissionDenied,
		isLoading,
		subscribeToPush,
		unsubscribeFromPush,
		refresh,
	} = usePushSubscription();

	useEffect(() => {
		refresh();
	}, [refresh]);

	const enabled = !!subscription;
	const disabled = !isSupported || permissionDenied || isLoading;

	async function handleToggle(next: boolean) {
		if (next) {
			await subscribeToPush();
		} else {
			await unsubscribeFromPush();
		}
	}

	return (
		<div className="px-2 py-1.5">
			<div className="flex items-center justify-between gap-2 text-sm">
				<span className="flex items-center gap-2">
					<Bell className="size-4" />
					Notificări push
				</span>
				<Switch
					checked={enabled}
					disabled={disabled}
					onCheckedChange={handleToggle}
					aria-label="Comută notificările push"
				/>
			</div>
			{!isSupported ? (
				<p className="mt-1 ps-6 text-xs text-muted-foreground">
					Neacceptate de acest browser.
				</p>
			) : permissionDenied ? (
				<p className="mt-1 ps-6 text-xs text-muted-foreground">
					Blocate din browser. Reactivează-le din setările browserului.
				</p>
			) : null}
		</div>
	);
}
