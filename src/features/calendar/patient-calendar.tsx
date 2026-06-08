"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { CalendarDays, Clock, Bell } from "lucide-react";
import { toast } from "sonner";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { getAppointmentsForPatient } from "./actions";

type Appointment = Awaited<
	ReturnType<typeof getAppointmentsForPatient>
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
			"bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
		border: "border-l-yellow-500",
		dot: "bg-yellow-500",
	},
	info: {
		label: "Info",
		className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
		border: "border-l-blue-500",
		dot: "bg-blue-500",
	},
};

export function PatientCalendar() {
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());

	const fetchData = useCallback(() => {
		getAppointmentsForPatient()
			.then(setAppointments)
			.catch(() => toast.error("Eroare la încărcarea programărilor."))
			.finally(() => setLoading(false));
	}, []);

	useEffect(fetchData, [fetchData]);

	const { byDate, appointmentDates } = useMemo(() => {
		const map = new Map<string, Appointment[]>();

		for (const a of appointments) {
			const key = format(new Date(a.scheduledAt!), "yyyy-MM-dd");
			const list = map.get(key) ?? [];
			list.push(a);
			map.set(key, list);
		}

		return {
			byDate: map,
			appointmentDates: [...map.keys()].map((k) => new Date(k)),
		};
	}, [appointments]);

	const selectedKey = format(selectedDate, "yyyy-MM-dd");
	const selectedAppointments = byDate.get(selectedKey) ?? [];

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
					<h2 className="text-2xl font-bold tracking-tight">
						Calendar programări
					</h2>
					<p className="text-muted-foreground">
						Programările dumneavoastră de la echipa medicală.
					</p>
				</div>

				{loading ? (
					<div className="flex flex-1 items-center justify-center">
						<Spinner className="size-6" />
					</div>
				) : appointments.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-12">
							<Bell className="mb-3 h-10 w-10 text-muted-foreground/50" />
							<p className="text-sm text-muted-foreground">
								Nu aveți programări.
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="flex flex-col gap-6 lg:flex-row lg:items-start">
						<Card className="mx-auto shrink-0 lg:mx-0">
							<CardContent className="p-3">
								<Calendar
									mode="single"
									locale={ro}
									selected={selectedDate}
									onSelect={(date) => date && setSelectedDate(date)}
									modifiers={{ appointment: appointmentDates }}
									classNames={{
										today:
											"rounded-md bg-accent text-accent-foreground [&_button]:border [&_button]:border-primary",
									}}
									modifiersClassNames={{
										appointment:
											"[&_button]:bg-primary/15 [&_button]:font-semibold [&_button]:text-foreground dark:[&_button]:bg-primary/25 dark:[&_button[data-selected-single=true]]:text-white",
									}}
								/>
							</CardContent>
						</Card>

						<div className="flex-1 space-y-3">
							<h3 className="text-sm font-medium text-muted-foreground">
								{format(selectedDate, "d MMMM yyyy", { locale: ro })}
							</h3>

							{selectedAppointments.length === 0 ? (
								<Card>
									<CardContent className="flex flex-col items-center justify-center py-8">
										<CalendarDays className="mb-2 h-8 w-8 text-muted-foreground/50" />
										<p className="text-sm text-muted-foreground">
											Nu aveți programări în această zi.
										</p>
									</CardContent>
								</Card>
							) : (
								selectedAppointments.map((a) => {
									const sev = severityConfig[a.severity] ?? severityConfig.info;
									return (
										<Card key={a.id}>
											<CardContent className="p-4 space-y-1">
												<div className="flex items-center gap-2">
													<p className="flex items-center gap-2 font-medium">
														<span
															className={`size-2 shrink-0 rounded-full ${sev.dot}`}
														/>
														{a.title}
													</p>
													<Badge className={sev.className}>{sev.label}</Badge>
												</div>
												<p className="text-sm text-muted-foreground">
													{a.message}
												</p>
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<Clock className="h-3 w-3" />
													{format(new Date(a.scheduledAt!), "HH:mm")}
													<span>·</span>
													<span>{a.createdByName}</span>
												</div>
												<div className="text-xs">
													{a.read ? (
														<span className="text-green-600 dark:text-green-400">
															Confirmat
														</span>
													) : (
														<span className="text-yellow-600 dark:text-yellow-400">
															Neconfirmat
														</span>
													)}
												</div>
											</CardContent>
										</Card>
									);
								})
							)}
						</div>
					</div>
				)}
			</Main>
		</>
	);
}
