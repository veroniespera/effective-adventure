"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Spinner } from "@/components/ui/spinner";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { AlertsList } from "./components/alerts-list";
import { getAlerts } from "./actions";

export type AlertSortKey = "severity" | "date-desc" | "date-asc" | "status";

type AlertRow = Awaited<ReturnType<typeof getAlerts>>[number];

export function Alerts() {
	const [alerts, setAlerts] = useState<AlertRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [sortBy, setSortBy] = useState<AlertSortKey>("severity");

	const fetchData = useCallback(() => {
		getAlerts()
			.then((data) => {
				setAlerts(data);
			})
			.catch(() => {
				toast.error("Eroare la încărcarea alertelor.");
			})
			.finally(() => setLoading(false));
	}, []);

	useEffect(fetchData, [fetchData]);

	const activeCount = alerts.filter((a) => !a.dismissed).length;

	return (
		<>
			<Header fixed>
				<Search />
				<div className="ms-auto flex items-center space-x-4">
					<ThemeSwitch />
					<ConfigDrawer />
				</div>
			</Header>

			<Main className="flex flex-1 flex-col gap-6">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<h2 className="text-2xl font-bold tracking-tight">
							Alerte{" "}
							{activeCount > 0 && (
								<span className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-sm font-normal text-destructive-foreground">
									{activeCount}
								</span>
							)}
						</h2>
						<p className="text-muted-foreground">
							Alerte clinice prioritizate pentru pacienții monitorizați.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground whitespace-nowrap">
							Sortare:
						</span>
						<Select
							value={sortBy}
							onValueChange={(v) => setSortBy(v as AlertSortKey)}
						>
							<SelectTrigger className="w-[150px] sm:w-[200px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="severity">Severitate</SelectItem>
								<SelectItem value="date-desc">Dată (cele mai noi)</SelectItem>
								<SelectItem value="date-asc">Dată (cele mai vechi)</SelectItem>
								<SelectItem value="status">Status (active primele)</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				{loading ? (
					<div className="flex flex-1 items-center justify-center">
						<Spinner className="size-6" />
					</div>
				) : (
					<AlertsList data={alerts} onUpdate={fetchData} sortBy={sortBy} />
				)}
			</Main>
		</>
	);
}
