"use client";

import { useMemo, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertBadge } from "./alert-badge";
import { dismissAlert } from "../actions";
import type { AlertSortKey } from "../index";

interface AlertItem {
	id: string;
	patientName: string;
	type: "vital" | "simptom" | "laborator" | "medicatie";
	severity: "critical" | "warning" | "info";
	message: string;
	createdAt: Date | string;
	dismissed: boolean;
}

interface AlertsListProps {
	data: AlertItem[];
	onUpdate?: () => void;
	sortBy?: AlertSortKey;
}

const severityOrder = { critical: 0, warning: 1, info: 2 } as const;

function sortAlerts(alerts: AlertItem[], sortBy: AlertSortKey): AlertItem[] {
	return [...alerts].sort((a, b) => {
		switch (sortBy) {
			case "severity":
				return severityOrder[a.severity] - severityOrder[b.severity];
			case "date-desc":
				return (
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
			case "date-asc":
				return (
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
				);
			case "status": {
				if (a.dismissed !== b.dismissed) return a.dismissed ? 1 : -1;
				return severityOrder[a.severity] - severityOrder[b.severity];
			}
		}
	});
}

export function AlertsList({
	data,
	onUpdate,
	sortBy = "severity",
}: AlertsListProps) {
	const [isPending, startTransition] = useTransition();

	function handleDismiss(id: string) {
		startTransition(async () => {
			const result = await dismissAlert(id);
			if ("error" in result) {
				toast.error(String(result.error));
				return;
			}
			toast.success("Alerta a fost respinsă.");
			onUpdate?.();
		});
	}

	const showAsSingleList = sortBy === "status";

	const sorted = useMemo(() => sortAlerts(data, sortBy), [data, sortBy]);

	const active = useMemo(() => sorted.filter((a) => !a.dismissed), [sorted]);
	const dismissedAlerts = useMemo(
		() => sorted.filter((a) => a.dismissed),
		[sorted],
	);

	function renderAlertCard(alert: AlertItem) {
		const isDismissed = alert.dismissed;
		return (
			<Card
				key={alert.id}
				className={`border-l-4 ${isDismissed ? "opacity-50" : ""}`}
				style={{
					borderLeftColor:
						alert.severity === "critical"
							? "var(--destructive)"
							: alert.severity === "warning"
								? "#f97316"
								: "#3b82f6",
				}}
			>
				<CardContent className="flex items-start justify-between gap-4 pt-4">
					<div className="space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<AlertBadge severity={alert.severity} />
							<span className="text-sm font-medium">{alert.patientName}</span>
							{isDismissed && (
								<span className="text-xs rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
									Respinsă
								</span>
							)}
							<span className="text-xs text-muted-foreground">
								{new Date(alert.createdAt).toLocaleString("ro-RO")}
							</span>
						</div>
						<p className="text-sm">{alert.message}</p>
					</div>
					{!isDismissed && (
						<Button
							variant="ghost"
							size="icon"
							className="shrink-0"
							onClick={() => handleDismiss(alert.id)}
							disabled={isPending}
						>
							<X className="h-4 w-4" />
							<span className="sr-only">Respinge</span>
						</Button>
					)}
				</CardContent>
			</Card>
		);
	}

	if (showAsSingleList) {
		return (
			<div className="space-y-3">
				{sorted.length === 0 && (
					<p className="text-sm text-muted-foreground">Nicio alertă.</p>
				)}
				{sorted.map((alert) => renderAlertCard(alert))}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{active.length === 0 && (
				<p className="text-sm text-muted-foreground">Nicio alertă activă.</p>
			)}
			<div className="space-y-3">
				{active.map((alert) => renderAlertCard(alert))}
			</div>
			{dismissedAlerts.length > 0 && (
				<div>
					<p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
						Respinse ({dismissedAlerts.length})
					</p>
					<div className="space-y-2">
						{dismissedAlerts.map((alert) => renderAlertCard(alert))}
					</div>
				</div>
			)}
		</div>
	);
}
