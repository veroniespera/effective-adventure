"use client";

import {
	useState,
	useMemo,
	useTransition,
	useEffect,
	useCallback,
} from "react";
import { Lock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReminderSettingsDialog } from "./reminder-settings-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
	type Medication,
	type MedicationLog,
	type MedicationReminder,
} from "../data/schema";
import { createMedicationLogsBatch, getMedicationReminders } from "../actions";
import {
	isMedicationDueOnDate,
	getDailyDoseCount,
} from "../lib/medication-schedule";

interface DailyLogFormProps {
	medications: Medication[];
	logs: MedicationLog[];
	onSuccess?: () => void;
}

type LogEntry = {
	medicationId: string;
	doseIndex: number;
	status: "luat" | "omis" | "intarziat" | "";
	time: string;
};

const statusOptions = [
	{ value: "luat", label: "Luat" },
	{ value: "omis", label: "Omis" },
	{ value: "intarziat", label: "Întârziat" },
];

function getDoseLabel(doseIndex: number, totalDoses: number): string {
	if (totalDoses <= 1) return "";
	return `Doza ${doseIndex + 1}/${totalDoses}`;
}

function getLocalToday(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function DailyLogForm({
	medications,
	logs,
	onSuccess,
}: DailyLogFormProps) {
	const [reminderMap, setReminderMap] = useState<
		Map<string, MedicationReminder[]>
	>(new Map());
	const [reminderDialogMed, setReminderDialogMed] = useState<{
		id: string;
		name: string;
		frequency: string;
	} | null>(null);

	const [reminderVersion, setReminderVersion] = useState(0);

	useEffect(() => {
		if (medications.length === 0) return;

		let cancelled = false;
		Promise.all(
			medications.map((m) =>
				getMedicationReminders(m.id).then((r) => [m.id, r] as const),
			),
		).then((results) => {
			if (cancelled) return;
			const map = new Map<string, MedicationReminder[]>();
			for (const [id, reminders] of results) {
				const enabled = reminders
					.filter((r) => r.enabled)
					.map((r) => ({
						id: r.id,
						medicationId: r.medicationId,
						doseIndex: r.doseIndex,
						time: r.time,
						enabled: r.enabled,
					}));
				if (enabled.length > 0) {
					map.set(id, enabled);
				}
			}
			setReminderMap(map);
		});

		return () => {
			cancelled = true;
		};
	}, [medications, reminderVersion]);

	const refreshReminders = useCallback(() => {
		setReminderVersion((v) => v + 1);
	}, []);

	const today = getLocalToday();
	const todayLogs = logs.filter((l) => l.takenAt.startsWith(today));

	const activeMeds = medications.filter((m) => isMedicationDueOnDate(m, today));
	const futureMeds = medications.filter((m) => m.startDate > today);
	const notDueToday = medications.filter(
		(m) => m.startDate <= today && !isMedicationDueOnDate(m, today),
	);

	const buildEntries = (): LogEntry[] => {
		const entries: LogEntry[] = [];
		for (const med of activeMeds) {
			const dailyDoses = getDailyDoseCount(med.frequency);
			const medTodayLogs = todayLogs.filter((l) => l.medicationId === med.id);

			for (let i = 0; i < dailyDoses; i++) {
				const existingLog = medTodayLogs[i];
				entries.push({
					medicationId: med.id,
					doseIndex: i,
					status: existingLog ? existingLog.status : "",
					time: existingLog
						? new Date(existingLog.takenAt).toLocaleTimeString("ro-RO", {
								hour: "2-digit",
								minute: "2-digit",
							})
						: new Date().toLocaleTimeString("ro-RO", {
								hour: "2-digit",
								minute: "2-digit",
							}),
				});
			}
		}
		return entries;
	};

	const logsKey = useMemo(
		() => JSON.stringify(logs.map((l) => l.id).sort()),
		[logs],
	);
	const medsKey = useMemo(
		() => JSON.stringify(medications.map((m) => m.id).sort()),
		[medications],
	);

	const [entries, setEntries] = useState<LogEntry[]>(buildEntries);
	const [prevKey, setPrevKey] = useState(`${logsKey}${medsKey}`);
	const [notes, setNotes] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [isPending, startTransition] = useTransition();

	const currentKey = `${logsKey}${medsKey}`;
	if (currentKey !== prevKey) {
		setPrevKey(currentKey);
		setEntries(buildEntries());
	}

	function updateEntry(
		medicationId: string,
		doseIndex: number,
		field: "status" | "time",
		value: string,
	) {
		setEntries((prev) =>
			prev.map((e) =>
				e.medicationId === medicationId && e.doseIndex === doseIndex
					? { ...e, [field]: value }
					: e,
			),
		);
	}

	function isLogged(medicationId: string, doseIndex: number): boolean {
		const medTodayLogs = todayLogs.filter(
			(l) => l.medicationId === medicationId,
		);
		return doseIndex < medTodayLogs.length;
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		const newEntries = entries.filter(
			(entry) =>
				entry.status !== "" && !isLogged(entry.medicationId, entry.doseIndex),
		);

		if (newEntries.length === 0) return;

		const logValues = newEntries.map((entry) => ({
			medicationId: entry.medicationId,
			status: entry.status as "luat" | "omis" | "intarziat",
			takenAt: `${today}T${entry.time}:00`,
		}));

		startTransition(async () => {
			const result = await createMedicationLogsBatch(logValues);
			if (result.error) {
				toast.error(result.error);
				return;
			}
			toast.success("Jurnalul de astăzi a fost salvat cu succes.");
			setSubmitted(true);
			setTimeout(() => setSubmitted(false), 3000);
			onSuccess?.();
		});
	}

	const hasUnlogged = entries.some(
		(e) => !isLogged(e.medicationId, e.doseIndex),
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Jurnal zilnic de medicație</CardTitle>
				<CardDescription>
					Înregistrează medicamentele luate astăzi,{" "}
					{new Date().toLocaleDateString("ro-RO", {
						day: "numeric",
						month: "long",
						year: "numeric",
					})}
					.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{submitted && (
					<div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
						Jurnalul de astăzi a fost salvat cu succes.
					</div>
				)}

				{!hasUnlogged && futureMeds.length === 0 && !submitted && (
					<p className="text-sm text-muted-foreground">
						Toate medicamentele de astăzi au fost deja înregistrate.
					</p>
				)}

				{(hasUnlogged || futureMeds.length > 0) && (
					<form noValidate onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-3">
							{activeMeds.map((med) => {
								const dailyDoses = getDailyDoseCount(med.frequency);
								const medEntries = entries.filter(
									(e) => e.medicationId === med.id,
								);

								return (
									<div key={med.id} className="rounded-lg border p-4">
										<div className="mb-3 flex items-start justify-between">
											<div>
												<p className="font-medium">{med.name}</p>
												<p className="text-sm text-muted-foreground">
													{med.dose} — {med.frequency}
												</p>
												{med.notes && (
													<p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
														📋 {med.notes}
													</p>
												)}
											</div>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-8 w-8 shrink-0"
												onClick={() =>
													setReminderDialogMed({
														id: med.id,
														name: med.name,
														frequency: med.frequency,
													})
												}
											>
												<Bell className="h-4 w-4" />
												<span className="sr-only">Setări notificări</span>
											</Button>
										</div>

										<div className="space-y-3">
											{medEntries.map((entry) => {
												const logged = isLogged(med.id, entry.doseIndex);
												const doseLabel = getDoseLabel(
													entry.doseIndex,
													dailyDoses,
												);

												return (
													<div
														key={`${med.id}-${entry.doseIndex}`}
														className={`rounded-md p-3 ${
															logged
																? "border border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30"
																: dailyDoses > 1
																	? "border border-dashed"
																	: ""
														}`}
													>
														{(() => {
															const reminder = reminderMap
																.get(med.id)
																?.find((r) => r.doseIndex === entry.doseIndex);
															const scheduleInfo = reminder
																? ` — programat la ${reminder.time}`
																: "";
															const label = doseLabel
																? `${doseLabel}${scheduleInfo}`
																: reminder
																	? `Programat la ${reminder.time}`
																	: null;
															return label ? (
																<p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
																	{reminder && <Bell className="h-3 w-3" />}
																	{label}
																</p>
															) : null;
														})()}

														{logged ? (
															<p className="text-sm text-green-700 dark:text-green-400">
																Deja înregistrat astăzi
															</p>
														) : (
															<div className="grid gap-3 sm:grid-cols-2">
																<div className="space-y-1.5">
																	<Label
																		htmlFor={`status-${med.id}-${entry.doseIndex}`}
																	>
																		Status
																	</Label>
																	<Select
																		value={entry.status}
																		onValueChange={(v) =>
																			updateEntry(
																				med.id,
																				entry.doseIndex,
																				"status",
																				v,
																			)
																		}
																		required
																	>
																		<SelectTrigger
																			id={`status-${med.id}-${entry.doseIndex}`}
																			className="w-full"
																		>
																			<SelectValue placeholder="Selectează status" />
																		</SelectTrigger>
																		<SelectContent>
																			{statusOptions.map((opt) => (
																				<SelectItem
																					key={opt.value}
																					value={opt.value}
																				>
																					{opt.label}
																				</SelectItem>
																			))}
																		</SelectContent>
																	</Select>
																</div>
																<div className="space-y-1.5">
																	<Label
																		htmlFor={`time-${med.id}-${entry.doseIndex}`}
																	>
																		Ora
																	</Label>
																	<Input
																		id={`time-${med.id}-${entry.doseIndex}`}
																		type="time"
																		value={entry.time}
																		onChange={(e) =>
																			updateEntry(
																				med.id,
																				entry.doseIndex,
																				"time",
																				e.target.value,
																			)
																		}
																	/>
																</div>
															</div>
														)}
													</div>
												);
											})}
										</div>
									</div>
								);
							})}

							{notDueToday.map((med) => (
								<div
									key={med.id}
									className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4 opacity-70"
								>
									<div className="flex items-start justify-between">
										<div>
											<p className="font-medium">{med.name}</p>
											<p className="text-sm text-muted-foreground">
												{med.dose} — {med.frequency}
											</p>
										</div>
										<Lock className="h-4 w-4 text-muted-foreground" />
									</div>
									<p className="mt-2 text-xs text-muted-foreground">
										Nu este programat astăzi
									</p>
								</div>
							))}

							{futureMeds.map((med) => (
								<div
									key={med.id}
									className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4 opacity-70"
								>
									<div className="flex items-start justify-between">
										<div>
											<p className="font-medium">{med.name}</p>
											<p className="text-sm text-muted-foreground">
												{med.dose} — {med.frequency}
											</p>
											{med.notes && (
												<p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
													📋 {med.notes}
												</p>
											)}
										</div>
										<Lock className="h-4 w-4 text-muted-foreground" />
									</div>
									<p className="mt-2 text-xs text-muted-foreground">
										Înregistrarea va fi posibilă începând cu{" "}
										{new Date(med.startDate).toLocaleDateString("ro-RO", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})}
										.
									</p>
								</div>
							))}
						</div>

						{hasUnlogged && (
							<>
								<div className="space-y-1.5">
									<Label htmlFor="notes">Observații (opțional)</Label>
									<Textarea
										id="notes"
										placeholder="ex: Am luat Tacrolimus cu 30 de minute întârziere din cauza..."
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										rows={3}
									/>
								</div>

								<Button
									type="submit"
									disabled={
										isPending ||
										entries.filter(
											(e) =>
												e.status !== "" &&
												!isLogged(e.medicationId, e.doseIndex),
										).length === 0
									}
								>
									{isPending ? "Se salvează..." : "Salvează jurnalul de astăzi"}
								</Button>
							</>
						)}
					</form>
				)}
			</CardContent>

			{reminderDialogMed && (
				<ReminderSettingsDialog
					medicationId={reminderDialogMed.id}
					medicationName={reminderDialogMed.name}
					frequency={reminderDialogMed.frequency}
					open={!!reminderDialogMed}
					onOpenChange={(open) => {
						if (!open) setReminderDialogMed(null);
					}}
					onSaved={refreshReminders}
				/>
			)}
		</Card>
	);
}
