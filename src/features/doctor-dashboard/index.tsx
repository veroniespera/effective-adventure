"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { PatientOverviewCard } from "./components/patient-overview-card";
import { AlertSummaryWidget } from "./components/alert-summary-widget";
import { ComplianceChart } from "./components/compliance-chart";
import { RecentConversationsCard } from "./components/recent-conversations-card";
import { UpcomingAppointmentsCard } from "./components/upcoming-appointments-card";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getDoctorDashboardData } from "./actions";

type DashboardData = Awaited<ReturnType<typeof getDoctorDashboardData>>;

export function DoctorDashboard() {
	const [data, setData] = useState<DashboardData | null>(null);

	useEffect(() => {
		getDoctorDashboardData()
			.then(setData)
			.catch(() => {
				toast.error("Eroare la încărcarea dashboard-ului.");
			});
	}, []);

	if (!data) {
		return (
			<>
				<Header fixed>
					<Search />
					<div className="ms-auto flex items-center space-x-4">
						<ThemeSwitch />
						<ConfigDrawer />
					</div>
				</Header>
				<Main className="flex flex-1 items-center justify-center">
					<Spinner className="size-6" />
				</Main>
			</>
		);
	}

	const activePatients = data.patients.filter((p) => p.status === "activ");

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
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Dashboard Medic</h2>
					<p className="text-muted-foreground">
						Privire de ansamblu asupra pacienților monitorizați.
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 [&>*]:min-w-0">
					<div className="flex flex-col gap-4">
						<Card>
							<CardContent className="flex items-center justify-around gap-4 py-4">
								<div className="text-center">
									<p className="text-2xl font-bold">{data.patients.length}</p>
									<p className="text-xs text-muted-foreground">
										Total pacienți
									</p>
								</div>
								<div className="h-10 w-px bg-border" />
								<div className="text-center">
									<p className="text-2xl font-bold text-green-600">
										{activePatients.length}
									</p>
									<p className="text-xs text-muted-foreground">
										Pacienți activi
									</p>
								</div>
							</CardContent>
						</Card>
						<AlertSummaryWidget alerts={data.alerts} />
					</div>
					<UpcomingAppointmentsCard appointments={data.upcomingAppointments} />
					<RecentConversationsCard conversations={data.recentConversations} />
				</div>

				<ComplianceChart patients={data.patients} />

				<div>
					<h3 className="mb-3 text-lg font-semibold">Pacienți activi</h3>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
						{activePatients.map((p) => (
							<PatientOverviewCard key={p.id} patient={p} />
						))}
					</div>
				</div>
			</Main>
		</>
	);
}
