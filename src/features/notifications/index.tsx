"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { Send, CalendarClock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	createNotification,
	deleteNotification,
	getSentNotifications,
	getTargetPreview,
	getDoctorsList,
	getPatientsList,
} from "./actions";
import { categoryOptions } from "@/features/medication/data/schema";

const targetOptions = [
	{ value: "patient", label: "Pacient specific" },
	{ value: "group", label: "Grup de pacienți" },
	{ value: "medication", label: "Pacienți pe un medicament" },
	{ value: "category", label: "Pacienți pe categorie de medicament" },
	{ value: "compliance", label: "Pacienți cu conformitate scăzută" },
	{ value: "all", label: "Toți pacienții" },
	{ value: "doctor", label: "Pacienții unui medic" },
	{ value: "etiology", label: "Pacienți după etiologie" },
] as const;

const severityOptions = [
	{ value: "info", label: "Informare" },
	{ value: "warning", label: "Atenție" },
	{ value: "critical", label: "Critic" },
] as const;

const etiologyOptions = [
	"HBV",
	"HDV",
	"HCV",
	"MASLD",
	"alcool",
	"autoimuna",
	"altele",
];

type SentNotification = Awaited<
	ReturnType<typeof getSentNotifications>
>[number];
type Doctor = { id: string; name: string | null };
type Patient = { id: string; firstName: string; lastName: string };

const severityConfig: Record<string, { label: string; className: string }> = {
	critical: {
		label: "Critic",
		className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
	},
	warning: {
		label: "Atenție",
		className:
			"bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
	},
	info: {
		label: "Info",
		className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
	},
};

const targetLabelMap = Object.fromEntries(
	targetOptions.map((t) => [t.value, t.label]),
);

export function SendNotifications() {
	const [isPending, startTransition] = useTransition();
	const [sent, setSent] = useState<SentNotification[]>([]);
	const [loading, setLoading] = useState(true);
	const [doctors, setDoctors] = useState<Doctor[]>([]);
	const [patients, setPatients] = useState<Patient[]>([]);
	const [now, setNow] = useState(() => Date.now());

	const [title, setTitle] = useState("");
	const [message, setMessage] = useState("");
	const [severity, setSeverity] = useState<"info" | "warning" | "critical">(
		"info",
	);
	const [targetType, setTargetType] = useState<string>("");
	const [targetValue, setTargetValue] = useState("");
	const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
	const [scheduledDate, setScheduledDate] = useState("");
	const [scheduledTime, setScheduledTime] = useState("");
	const [preview, setPreview] = useState<{
		count: number;
		patients: string[];
	} | null>(null);

	const fetchData = useCallback(() => {
		Promise.all([
			getSentNotifications().then(setSent),
			getDoctorsList().then(setDoctors),
			getPatientsList().then(setPatients),
		])
			.catch(() => toast.error("Eroare la încărcarea datelor."))
			.finally(() => setLoading(false));
	}, []);

	useEffect(fetchData, [fetchData]);

	useEffect(() => {
		const interval = setInterval(() => setNow(Date.now()), 30_000);
		return () => clearInterval(interval);
	}, []);

	function handleTargetValueChange(v: string) {
		setTargetValue(v);
		refreshPreview(targetType, v, selectedPatients);
	}

	function handleTogglePatient(id: string) {
		const next = selectedPatients.includes(id)
			? selectedPatients.filter((p) => p !== id)
			: [...selectedPatients, id];
		setSelectedPatients(next);
		refreshPreview(targetType, targetValue, next);
	}

	function refreshPreview(type: string, value: string, patients: string[]) {
		if (!type) {
			setPreview(null);
			return;
		}

		const resolved =
			type === "group"
				? patients.join(",")
				: type === "all"
					? undefined
					: value || undefined;

		if (type !== "all" && !resolved) {
			setPreview(null);
			return;
		}

		getTargetPreview(type as Parameters<typeof getTargetPreview>[0], resolved)
			.then(setPreview)
			.catch(() => setPreview(null));
	}

	function handleDelete(id: string) {
		startTransition(async () => {
			const result = await deleteNotification(id);
			if ("error" in result) {
				toast.error(result.error);
				return;
			}
			toast.success("Notificarea a fost ștearsă.");
			fetchData();
		});
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (!title.trim() || !message.trim() || !targetType) {
			toast.error("Completați toate câmpurile obligatorii.");
			return;
		}

		const value =
			targetType === "group"
				? selectedPatients.join(",")
				: targetType === "all"
					? undefined
					: targetValue || undefined;

		const scheduledAt =
			scheduledDate && scheduledTime
				? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
				: scheduledDate
					? new Date(`${scheduledDate}T00:00`).toISOString()
					: undefined;

		startTransition(async () => {
			const result = await createNotification({
				title: title.trim(),
				message: message.trim(),
				severity,
				targetType: targetType as Parameters<
					typeof createNotification
				>[0]["targetType"],
				targetValue: value,
				scheduledAt,
			});

			if ("error" in result) {
				toast.error(result.error);
				return;
			}

			toast.success(
				scheduledAt
					? `Notificare trimisă către ${result.recipientCount} pacient${result.recipientCount === 1 ? "" : "i"} cu programare pe ${new Date(scheduledAt).toLocaleString("ro-RO")}.`
					: `Notificare trimisă către ${result.recipientCount} pacient${result.recipientCount === 1 ? "" : "i"}.`,
			);
			setTitle("");
			setMessage("");
			setSeverity("info");
			setTargetType("");
			setTargetValue("");
			setSelectedPatients([]);
			setScheduledDate("");
			setScheduledTime("");
			setPreview(null);
			fetchData();
		});
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
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Notificări</h2>
					<p className="text-muted-foreground">
						Trimiteți notificări către pacienți.
					</p>
				</div>

				{loading ? (
					<div className="flex flex-1 items-center justify-center">
						<Spinner className="size-6" />
					</div>
				) : (
					<div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
						<Card>
							<CardHeader>
								<CardTitle>Trimite notificare</CardTitle>
								<CardDescription>
									Selectați destinatarii și compuneți mesajul.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form noValidate onSubmit={handleSubmit} className="space-y-4">
									<div className="space-y-1.5">
										<Label>Destinatari</Label>
										<Select
											value={targetType}
											onValueChange={(v) => {
												setTargetType(v);
												setTargetValue("");
												setSelectedPatients([]);
												if (v === "all") refreshPreview(v, "", []);
												else setPreview(null);
											}}
										>
											<SelectTrigger>
												<SelectValue placeholder="Selectați tipul de destinatar" />
											</SelectTrigger>
											<SelectContent>
												{targetOptions.map((opt) => (
													<SelectItem key={opt.value} value={opt.value}>
														{opt.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									{targetType === "patient" && (
										<div className="space-y-1.5">
											<Label>Selectați pacientul</Label>
											<Select
												value={targetValue}
												onValueChange={handleTargetValueChange}
											>
												<SelectTrigger>
													<SelectValue placeholder="Alegeți un pacient" />
												</SelectTrigger>
												<SelectContent>
													{patients.map((p) => (
														<SelectItem key={p.id} value={p.id}>
															{p.lastName} {p.firstName}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									)}

									{targetType === "group" && (
										<div className="space-y-1.5">
											<Label>
												Selectați pacienții ({selectedPatients.length}{" "}
												selectați)
											</Label>
											<div className="max-h-48 overflow-y-auto rounded-md border p-2 space-y-1">
												{patients.map((p) => (
													<label
														key={p.id}
														className="flex cursor-pointer items-center gap-2 rounded p-1.5 hover:bg-accent"
													>
														<input
															type="checkbox"
															checked={selectedPatients.includes(p.id)}
															onChange={() => handleTogglePatient(p.id)}
															className="rounded"
														/>
														<span className="text-sm">
															{p.lastName} {p.firstName}
														</span>
													</label>
												))}
											</div>
										</div>
									)}

									{targetType === "medication" && (
										<div className="space-y-1.5">
											<Label>Nume medicament</Label>
											<Input
												placeholder="ex: Tacrolimus"
												value={targetValue}
												onChange={(e) =>
													handleTargetValueChange(e.target.value)
												}
											/>
										</div>
									)}

									{targetType === "category" && (
										<div className="space-y-1.5">
											<Label>Categorie medicament</Label>
											<Select
												value={targetValue}
												onValueChange={handleTargetValueChange}
											>
												<SelectTrigger>
													<SelectValue placeholder="Alegeți categoria" />
												</SelectTrigger>
												<SelectContent>
													{categoryOptions.map((opt) => (
														<SelectItem key={opt.value} value={opt.value}>
															{opt.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									)}

									{targetType === "compliance" && (
										<div className="space-y-1.5">
											<Label>Prag conformitate (%)</Label>
											<Input
												type="number"
												placeholder="70"
												value={targetValue}
												onChange={(e) =>
													handleTargetValueChange(e.target.value)
												}
											/>
											<p className="text-xs text-muted-foreground">
												Pacienții cu conformitate sub acest prag vor primi
												notificarea.
											</p>
										</div>
									)}

									{targetType === "doctor" && (
										<div className="space-y-1.5">
											<Label>Selectați medicul</Label>
											<Select
												value={targetValue}
												onValueChange={handleTargetValueChange}
											>
												<SelectTrigger>
													<SelectValue placeholder="Alegeți medicul" />
												</SelectTrigger>
												<SelectContent>
													{doctors.map((d) => (
														<SelectItem key={d.id} value={d.id}>
															{d.name ?? d.id}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									)}

									{targetType === "etiology" && (
										<div className="space-y-1.5">
											<Label>Etiologie</Label>
											<Select
												value={targetValue}
												onValueChange={handleTargetValueChange}
											>
												<SelectTrigger>
													<SelectValue placeholder="Alegeți etiologia" />
												</SelectTrigger>
												<SelectContent>
													{etiologyOptions.map((e) => (
														<SelectItem key={e} value={e}>
															{e}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									)}

									{preview && (
										<div className="rounded-md border bg-muted/50 p-3">
											<p className="text-sm font-medium">
												{preview.count} destinatar
												{preview.count === 1 ? "" : "i"}
											</p>
											{preview.patients.length > 0 && (
												<p className="mt-1 text-xs text-muted-foreground">
													{preview.patients.join(", ")}
													{preview.count > 5 &&
														` și alți ${preview.count - 5}...`}
												</p>
											)}
										</div>
									)}

									<div className="space-y-1.5">
										<Label>Severitate</Label>
										<Select
											value={severity}
											onValueChange={(v) =>
												setSeverity(v as "info" | "warning" | "critical")
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{severityOptions.map((opt) => (
													<SelectItem key={opt.value} value={opt.value}>
														{opt.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-1.5">
										<Label>Titlu</Label>
										<Input
											placeholder="ex: Programare control"
											value={title}
											onChange={(e) => setTitle(e.target.value)}
										/>
									</div>

									<div className="space-y-1.5">
										<Label>Mesaj</Label>
										<Textarea
											placeholder="Conținutul notificării..."
											className="min-h-[100px]"
											value={message}
											onChange={(e) => setMessage(e.target.value)}
											rows={4}
										/>
									</div>

									<div className="space-y-1.5">
										<Label className="flex items-center gap-1.5">
											<CalendarClock className="h-4 w-4" />
											Data și ora programării (opțional)
										</Label>
										<div className="flex gap-2">
											<Input
												type="date"
												value={scheduledDate}
												min={new Date().toISOString().split("T")[0]}
												onChange={(e) => setScheduledDate(e.target.value)}
												className="flex-1"
											/>
											<Input
												type="time"
												value={scheduledTime}
												onChange={(e) => setScheduledTime(e.target.value)}
												className="flex-1"
												disabled={!scheduledDate}
											/>
										</div>
										<p className="text-xs text-muted-foreground">
											Adăugați data și ora la care pacientul trebuie să se
											prezinte.
										</p>
									</div>

									<Button type="submit" disabled={isPending}>
										<Send className="mr-2 h-4 w-4" />
										{isPending
											? "Se trimite..."
											: scheduledDate
												? "Programează notificarea"
												: "Trimite notificarea"}
									</Button>
								</form>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Notificări trimise</CardTitle>
								<CardDescription>
									Istoricul notificărilor trimise.
								</CardDescription>
							</CardHeader>
							<CardContent>
								{sent.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										Nicio notificare trimisă încă.
									</p>
								) : (
									<div className="space-y-3">
										{sent.map((n) => {
											const sev =
												severityConfig[n.severity] ?? severityConfig.info;
											const isScheduled =
												n.scheduledAt && new Date(n.scheduledAt) > new Date();
											const canDelete = n.readCount === 0;
											return (
												<div
													key={n.id}
													className={`rounded-lg border p-3 space-y-1 ${isScheduled ? "border-dashed opacity-75" : ""}`}
												>
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-2">
															<p className="font-medium text-sm">{n.title}</p>
															{isScheduled && (
																<Badge
																	variant="outline"
																	className="text-xs gap-1"
																>
																	<CalendarClock className="h-3 w-3" />
																	Cu programare
																</Badge>
															)}
														</div>
														<div className="flex items-center gap-1.5">
															<Badge className={sev.className}>
																{sev.label}
															</Badge>
															{canDelete && (
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-7 w-7 text-muted-foreground hover:text-red-600"
																	disabled={isPending}
																	onClick={() => handleDelete(n.id)}
																>
																	<Trash2 className="h-3.5 w-3.5" />
																</Button>
															)}
														</div>
													</div>
													<p className="text-sm text-muted-foreground">
														{n.message}
													</p>
													{n.scheduledAt && (
														<p
															className={`text-xs font-medium ${isScheduled ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
														>
															{"Data programării: "}
															{new Date(n.scheduledAt).toLocaleDateString(
																"ro-RO",
																{
																	day: "numeric",
																	month: "long",
																	year: "numeric",
																	hour: "2-digit",
																	minute: "2-digit",
																},
															)}
														</p>
													)}
													<div className="flex items-center gap-2 text-xs text-muted-foreground">
														<span>
															{targetLabelMap[n.targetType] ?? n.targetType}
														</span>
														<span>·</span>
														<span>
															{new Date(n.createdAt).toLocaleDateString(
																"ro-RO",
																{
																	day: "numeric",
																	month: "short",
																	year: "numeric",
																	hour: "2-digit",
																	minute: "2-digit",
																},
															)}
														</span>
														<span>·</span>
														<span>{n.createdByName}</span>
													</div>
													<div className="flex items-center gap-1.5 text-xs">
														{n.readCount === n.totalRecipients ? (
															<span className="text-green-600 dark:text-green-400">
																Confirmat de toți ({n.readCount}/
																{n.totalRecipients})
															</span>
														) : n.readCount > 0 ? (
															<span className="text-orange-600 dark:text-orange-400">
																Confirmat {n.readCount}/{n.totalRecipients}{" "}
																pacienți
															</span>
														) : (
															<span className="text-muted-foreground">
																Necitit · {n.totalRecipients} destinatari
															</span>
														)}
													</div>
												</div>
											);
										})}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				)}
			</Main>
		</>
	);
}
