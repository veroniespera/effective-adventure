"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

/**
 * Install entry point in the user menu, next to the notifications toggle.
 * Lets the user install the PWA even if they previously dismissed the
 * install banner. Hidden when the app is already installed.
 */
export function InstallAppButton() {
	const { canInstall, isIOS, isStandalone, triggerInstall } =
		useInstallPrompt();

	// Already installed → nothing to offer.
	if (isStandalone) return null;

	// Android/desktop: native install prompt available.
	if (canInstall) {
		return (
			<div className="px-2 py-1.5">
				<Button
					variant="outline"
					size="sm"
					className="w-full justify-start gap-2"
					onClick={() => {
						void triggerInstall();
					}}
				>
					<Download className="size-4" />
					Instalează aplicația
				</Button>
			</div>
		);
	}

	// iOS has no programmatic install — show the manual steps.
	if (isIOS) {
		return (
			<div className="px-2 py-1.5">
				<span className="flex items-center gap-2 text-sm">
					<Download className="size-4" />
					Instalează aplicația
				</span>
				<p className="mt-1 ps-6 text-xs text-muted-foreground">
					Apasă Distribuie, apoi „Adaugă la ecranul principal”.
				</p>
			</div>
		);
	}

	return null;
}
