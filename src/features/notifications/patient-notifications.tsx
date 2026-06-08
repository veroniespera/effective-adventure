"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { CheckCheck, Bell, Trash2, History, BellRing } from "lucide-react";
import { toast } from "sonner";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	getNotificationsForPatient,
	markNotificationAsRead,
	markAllNotificationsAsRead,
	deleteNotificationForPatient,
} from "./actions";

type Notification = Awaited<
	ReturnType<typeof getNotificationsForPatient>
>[number];

const severityConfig: Record<
	string,
	{ label: string; className: string; border: string; dot: string }
> = {
	critical: {
		label: "Critic",
		className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
		border: "border-l-red-500",
		dot: "bg-red-500",
	},
	warning: {
		label: "Atenție",
		className:
			"bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
		border: "border-l-orange-500",
		dot: "bg-orange-500",
	},
	info: {
		label: "Info",
		className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
		border: "border-l-blue-500",
		dot: "bg-blue-500",
	},
};

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

function isInHistory(n: Notification): boolean {
	const now = Date.now();

	if (n.scheduledAt) {
		return now - new Date(n.scheduledAt).getTime() > SEVEN_DAYS;
	}

	if (n.read && n.readAt) {
		return now - new Date(n.readAt).getTime() > FOURTEEN_DAYS;
	}

	return false;
}

export function PatientNotifications() {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(true);
	const [isPending, startTransition] = useTransition();

	const fetchData = useCallback(() => {
		getNotificationsForPatient()
			.then(setNotifications)
			.catch(() => toast.error("Eroare la încărcarea notificărilor."))
			.finally(() => setLoading(false));
	}, []);

	useEffect(fetchData, [fetchData]);

	const activeNotifications = notifications.filter((n) => !isInHistory(n));
	const historyNotifications = notifications.filter((n) => isInHistory(n));
	const unreadCount = activeNotifications.filter((n) => !n.read).length;

	function handleMarkRead(id: string) {
		startTransition(async () => {
			await markNotificationAsRead(id);
			fetchData();
		});
	}

	function handleMarkAllRead() {
		startTransition(async () => {
			await markAllNotificationsAsRead();
			fetchData();
		});
	}

	function handleDelete(id: string) {
		startTransition(async () => {
			await deleteNotificationForPatient(id);
			fetchData();
			toast.success("Notificarea a fost ștearsă din istoric.");
		});
	}

	function renderNotification(n: Notification, inHistory: boolean) {
		const sev = severityConfig[n.severity] ?? severityConfig.info;
		return (
			<Card
				key={n.id}
				className={`${n.read ? "opacity-60" : ""} transition-opacity`}
			>
				<CardContent className="p-4">
					<div className="flex items-start justify-between gap-3">
						<div className="flex-1 space-y-1">
							<div className="flex items-center gap-2">
								<span className={`size-2 shrink-0 rounded-full ${sev.dot}`} />
								<p
									className={`font-medium ${!n.read ? "text-foreground" : "text-muted-foreground"}`}
								>
									{n.title}
								</p>
								<Badge className={sev.className}>{sev.label}</Badge>
								{!n.read && !inHistory && (
									<span className="h-2 w-2 rounded-full bg-blue-500" />
								)}
							</div>
							<p className="text-sm text-muted-foreground">{n.message}</p>
							<p className="text-xs text-muted-foreground">
								{n.createdByName} ·{" "}
								{new Date(n.createdAt).toLocaleDateString("ro-RO", {
									day: "numeric",
									month: "long",
									year: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</p>
							{n.scheduledAt && (
								<p className="text-xs text-muted-foreground">
									Data programării:{" "}
									{new Date(n.scheduledAt).toLocaleDateString("ro-RO", {
										day: "numeric",
										month: "long",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							)}
						</div>
						{inHistory ? (
							<Button
								variant="ghost"
								size="sm"
								disabled={isPending}
								onClick={() => handleDelete(n.id)}
								className="text-destructive hover:text-destructive"
							>
								<Trash2 className="mr-1.5 h-3.5 w-3.5" />
								Șterge
							</Button>
						) : !n.read ? (
							<Button
								variant="outline"
								size="sm"
								disabled={isPending}
								onClick={() => handleMarkRead(n.id)}
							>
								<CheckCheck className="mr-1.5 h-3.5 w-3.5" />
								Confirm primire
							</Button>
						) : (
							<span className="shrink-0 text-xs text-green-600 dark:text-green-400">
								Confirmat
							</span>
						)}
					</div>
				</CardContent>
			</Card>
		);
	}

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
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="min-w-0">
						<h2 className="text-xl font-bold tracking-tight sm:text-2xl">
							Notificări
							{unreadCount > 0 && (
								<Badge variant="destructive" className="ml-2 text-xs">
									{unreadCount} necitite
								</Badge>
							)}
						</h2>
						<p className="text-muted-foreground">
							Notificări de la echipa medicală.
						</p>
					</div>
					{unreadCount > 0 && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleMarkAllRead}
							disabled={isPending}
							className="shrink-0 self-start sm:self-auto"
						>
							<CheckCheck className="mr-1.5 h-4 w-4" />
							Marchează toate ca citite
						</Button>
					)}
				</div>

				{loading ? (
					<div className="flex flex-1 items-center justify-center">
						<Spinner className="size-6" />
					</div>
				) : (
					<Tabs defaultValue="active">
						<TabsList>
							<TabsTrigger value="active">
								<BellRing className="mr-1.5 h-4 w-4" />
								Active
								{activeNotifications.length > 0 && (
									<Badge variant="secondary" className="ml-1.5 text-xs">
										{activeNotifications.length}
									</Badge>
								)}
							</TabsTrigger>
							<TabsTrigger value="history">
								<History className="mr-1.5 h-4 w-4" />
								Istoric
								{historyNotifications.length > 0 && (
									<Badge variant="secondary" className="ml-1.5 text-xs">
										{historyNotifications.length}
									</Badge>
								)}
							</TabsTrigger>
						</TabsList>

						<TabsContent value="active" className="mt-4">
							{activeNotifications.length === 0 ? (
								<Card>
									<CardContent className="flex flex-col items-center justify-center py-12">
										<Bell className="mb-3 h-10 w-10 text-muted-foreground/50" />
										<p className="text-sm text-muted-foreground">
											Nu aveți notificări active.
										</p>
									</CardContent>
								</Card>
							) : (
								<div className="space-y-3">
									{activeNotifications.map((n) => renderNotification(n, false))}
								</div>
							)}
						</TabsContent>

						<TabsContent value="history" className="mt-4">
							{historyNotifications.length === 0 ? (
								<Card>
									<CardContent className="flex flex-col items-center justify-center py-12">
										<History className="mb-3 h-10 w-10 text-muted-foreground/50" />
										<p className="text-sm text-muted-foreground">
											Nu aveți notificări în istoric.
										</p>
									</CardContent>
								</Card>
							) : (
								<div className="space-y-3">
									{historyNotifications.map((n) => renderNotification(n, true))}
								</div>
							)}
						</TabsContent>
					</Tabs>
				)}
			</Main>
		</>
	);
}
