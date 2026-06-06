"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
	Activity,
	Pill,
	MessageSquare,
	ArrowRight,
	Phone,
	BellRing,
	CalendarDays,
	BookOpen,
	Info,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getPatientDashboardData } from "./actions";

type DashboardData = Awaited<ReturnType<typeof getPatientDashboardData>>;

export function PatientDashboard() {
	const [data, setData] = useState<DashboardData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getPatientDashboardData()
			.then((d) => {
				setData(d);
			})
			.catch(() => {
				toast.error("Eroare la încărcarea dashboard-ului.");
			})
			.finally(() => setLoading(false));
	}, []);

	return (
		<>
			<Header fixed>
				<div className="ms-auto flex items-center space-x-4">
					<ThemeSwitch />
					<ConfigDrawer />
				</div>
			</Header>

			{loading ? (
				<Main className="flex flex-1 items-center justify-center">
					<Spinner className="size-6" />
				</Main>
			) : (
				<Main className="flex flex-1 flex-col gap-6">
					<div>
						<h2 className="text-2xl font-bold tracking-tight">Bună ziua!</h2>
						<p className="text-muted-foreground">
							{data?.isPreTransplant
								? "Iată informațiile disponibile în perioada de dinaintea transplantului."
								: "Iată un rezumat al stării tale de sănătate."}
						</p>
					</div>

					{data?.isPreTransplant ? (
						<>
							<div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-900 dark:bg-blue-950/40">
								<Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
								<p className="text-muted-foreground">
									Te afli în etapa pre-transplant. Secțiunile de monitorizare
									(semne vitale, medicație, simptome, analize și jurnal) vor
									deveni disponibile după transplant. Până atunci poți folosi
									mesageria, notificările, calendarul și materialele educative.
								</p>
							</div>

							<div className="grid gap-4 md:grid-cols-3">
								<div className="rounded-lg border p-4 flex items-start gap-3">
									<MessageSquare className="mt-1 h-5 w-5 text-purple-500 shrink-0" />
									<div>
										<p className="text-sm text-muted-foreground">
											Mesaje necitite
										</p>
										<p className="text-2xl font-bold">
											{data ? data.unreadMessages : "—"}
										</p>
										<p className="text-xs text-muted-foreground">
											{data?.doctorName
												? `de la ${data.doctorName}`
												: "de la medic"}
										</p>
									</div>
								</div>

								<div className="rounded-lg border p-4 flex items-start gap-3">
									<BellRing className="mt-1 h-5 w-5 text-amber-500 shrink-0" />
									<div>
										<p className="text-sm text-muted-foreground">
											Notificări necitite
										</p>
										<p className="text-2xl font-bold">
											{data ? data.unreadNotifications : "—"}
										</p>
										<p className="text-xs text-muted-foreground">
											de la echipa medicală
										</p>
									</div>
								</div>

								<div className="rounded-lg border p-4 flex items-start gap-3">
									<CalendarDays className="mt-1 h-5 w-5 text-blue-500 shrink-0" />
									<div>
										<p className="text-sm text-muted-foreground">
											Următoarea programare
										</p>
										{data?.nextAppointment ? (
											<>
												<p className="text-lg font-bold leading-tight">
													{data.nextAppointment.title}
												</p>
												<p className="text-xs text-muted-foreground">
													{new Date(
														data.nextAppointment.scheduledAt,
													).toLocaleDateString("ro-RO", {
														day: "numeric",
														month: "long",
														hour: "2-digit",
														minute: "2-digit",
													})}
												</p>
											</>
										) : (
											<>
												<p className="text-2xl font-bold text-muted-foreground">
													—
												</p>
												<p className="text-xs text-muted-foreground">
													nicio programare viitoare
												</p>
											</>
										)}
									</div>
								</div>
							</div>

							<div>
								<h3 className="mb-3 text-lg font-semibold">Acțiuni rapide</h3>
								<div className="grid gap-3 sm:grid-cols-3">
									<Button
										variant="outline"
										className="justify-between h-auto py-3"
										asChild
									>
										<Link href="/messaging">
											<span>Deschide mesaje</span>
											<ArrowRight className="h-4 w-4" />
										</Link>
									</Button>
									<Button
										variant="outline"
										className="justify-between h-auto py-3"
										asChild
									>
										<Link href="/notifications">
											<span>Vezi notificările</span>
											<BellRing className="h-4 w-4" />
										</Link>
									</Button>
									<Button
										variant="outline"
										className="justify-between h-auto py-3"
										asChild
									>
										<Link href="/calendar">
											<span>Calendar programări</span>
											<CalendarDays className="h-4 w-4" />
										</Link>
									</Button>
									<Button
										variant="outline"
										className="justify-between h-auto py-3"
										asChild
									>
										<Link href="/education">
											<span>Materiale educative</span>
											<BookOpen className="h-4 w-4" />
										</Link>
									</Button>
									{data?.doctorPhone && (
										<Button
											variant="outline"
											className="justify-between h-auto py-3"
											asChild
										>
											<a href={`tel:${data.doctorPhone}`}>
												<span>Sună medicul</span>
												<Phone className="h-4 w-4" />
											</a>
										</Button>
									)}
								</div>
							</div>
						</>
					) : (
						<>
							<div className="grid gap-4 md:grid-cols-3">
								<div className="rounded-lg border p-4 flex items-start gap-3">
									<Activity className="mt-1 h-5 w-5 text-blue-500 shrink-0" />
									<div>
										<p className="text-sm text-muted-foreground">
											Ultima tensiune
										</p>
										{data?.latestVital ? (
											<p className="text-2xl font-bold">
												{data.latestVital.systolic}/{data.latestVital.diastolic}
											</p>
										) : (
											<p className="text-2xl font-bold text-muted-foreground">
												—
											</p>
										)}
										{data?.latestVital && (
											<p className="text-xs text-muted-foreground">
												{data.latestVital.date}
											</p>
										)}
									</div>
								</div>

								<div className="rounded-lg border p-4 flex items-start gap-3">
									<Pill className="mt-1 h-5 w-5 text-green-500 shrink-0" />
									<div>
										<p className="text-sm text-muted-foreground">
											Medicamente active
										</p>
										<p className="text-2xl font-bold">
											{data ? data.activeMedsCount : "—"}
										</p>
										<p className="text-xs text-muted-foreground">
											prescriptii active
										</p>
									</div>
								</div>

								<div className="rounded-lg border p-4 flex items-start gap-3">
									<MessageSquare className="mt-1 h-5 w-5 text-purple-500 shrink-0" />
									<div>
										<p className="text-sm text-muted-foreground">
											Mesaje necitite
										</p>
										<p className="text-2xl font-bold">
											{data ? data.unreadMessages : "—"}
										</p>
										<p className="text-xs text-muted-foreground">
											{data?.doctorName
												? `de la ${data.doctorName}`
												: "de la medic"}
										</p>
									</div>
								</div>
							</div>

							<div>
								<h3 className="mb-3 text-lg font-semibold">Acțiuni rapide</h3>
								<div className="grid gap-3 sm:grid-cols-3">
									<Button
										variant="outline"
										className="justify-between h-auto py-3"
										asChild
									>
										<Link href="/vital-signs">
											<span>Înregistrează semne vitale</span>
											<ArrowRight className="h-4 w-4" />
										</Link>
									</Button>
									<Button
										variant="outline"
										className="justify-between h-auto py-3"
										asChild
									>
										<Link href="/symptoms">
											<span>Raportează simptome</span>
											<ArrowRight className="h-4 w-4" />
										</Link>
									</Button>
									<Button
										variant="outline"
										className="justify-between h-auto py-3"
										asChild
									>
										<Link href="/messaging">
											<span>Deschide mesaje</span>
											<ArrowRight className="h-4 w-4" />
										</Link>
									</Button>
									{data?.doctorPhone && (
										<Button
											variant="outline"
											className="justify-between h-auto py-3"
											asChild
										>
											<a href={`tel:${data.doctorPhone}`}>
												<span>Sună medicul</span>
												<Phone className="h-4 w-4" />
											</a>
										</Button>
									)}
								</div>
							</div>
						</>
					)}
				</Main>
			)}
		</>
	);
}
