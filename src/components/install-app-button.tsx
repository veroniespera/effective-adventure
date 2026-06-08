"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

/**
 * Install entry point in the user menu, next to the notifications toggle.
 * Always shown while running in the browser (so the user can install even if
 * they dismissed the banner). Hidden only when already running as the app.
 *  - installed but in browser → "Deschide în aplicație"
 *  - native prompt available  → triggers it
 *  - otherwise (iOS / unknown) → shows manual instructions
 */
export function InstallAppButton() {
	const { canInstall, isIOS, isStandalone, isInstalled, triggerInstall } =
		useInstallPrompt();

	// Running inside the installed app → nothing to offer.
	if (isStandalone) return null;

	const label = isInstalled ? "Deschide în aplicație" : "Instalează aplicația";

	function showManualSteps() {
		toast.info(
			isIOS
				? "Apasă Distribuie, apoi „Adaugă la ecranul principal”."
				: "Din meniul browserului alege „Instalează aplicația” / „Adaugă la ecranul principal”.",
		);
	}

	async function handleClick() {
		if (isInstalled) {
			toast.info(
				"Aplicația este instalată — deschide-o din ecranul principal.",
			);
			return;
		}
		if (canInstall) {
			const ok = await triggerInstall();
			if (!ok) showManualSteps();
			return;
		}
		showManualSteps();
	}

	return (
		<div className="px-2 py-1.5">
			<Button
				variant="outline"
				size="sm"
				className="w-full justify-start gap-2"
				onClick={handleClick}
			>
				<Download className="size-4" />
				{label}
			</Button>
		</div>
	);
}
