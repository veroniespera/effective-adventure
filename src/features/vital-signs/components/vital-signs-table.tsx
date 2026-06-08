"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type VitalEntry } from "../data/schema";
import { deleteVitalSign } from "../actions";
import { VitalSignsForm } from "./vital-signs-form";

interface VitalSignsTableProps {
	data: VitalEntry[];
	onUpdate?: () => void;
}

export function VitalSignsTable({ data, onUpdate }: VitalSignsTableProps) {
	const [editingEntry, setEditingEntry] = useState<VitalEntry | null>(null);
	const [isPending, startTransition] = useTransition();

	function handleDelete(id: string) {
		startTransition(async () => {
			const result = await deleteVitalSign(id);
			if (result.error) {
				toast.error(result.error);
				return;
			}
			toast.success("Înregistrarea a fost ștearsă.");
			onUpdate?.();
		});
	}

	return (
		<>
			{editingEntry && (
				<VitalSignsForm
					editId={editingEntry.id}
					defaultValues={{
						systolic: editingEntry.systolic,
						diastolic: editingEntry.diastolic,
						temperature: editingEntry.temperature,
						pulse: editingEntry.pulse,
						weight: editingEntry.weight,
					}}
					onSuccess={() => {
						setEditingEntry(null);
						onUpdate?.();
					}}
					onCancel={() => setEditingEntry(null)}
				/>
			)}
			<Card>
				<CardHeader>
					<CardTitle>Istoric semne vitale</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Data</TableHead>
								<TableHead>Stare</TableHead>
								<TableHead>Tensiune (mmHg)</TableHead>
								<TableHead>Temperatură (°C)</TableHead>
								<TableHead>Puls (bpm)</TableHead>
								<TableHead>Greutate (kg)</TableHead>
								{onUpdate && <TableHead className="w-20">Acțiuni</TableHead>}
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={onUpdate ? 7 : 6}
										className="text-center text-muted-foreground"
									>
										Nu există înregistrări.
									</TableCell>
								</TableRow>
							)}
							{data.map((entry) => {
								const isWarning = entry.status === "warning";
								const isCritical = entry.status === "critical";
								const rowClass = isCritical
									? "bg-destructive/5"
									: isWarning
										? "bg-orange-500/5"
										: "";

								return (
									<TableRow key={entry.id} className={rowClass}>
										<TableCell>{entry.date}</TableCell>
										<TableCell>
											<StatusBadge status={entry.status} />
										</TableCell>
										<TableCell>
											<span
												className={
													entry.systolic >= 140 ||
													entry.diastolic >= 90 ||
													entry.systolic < 90 ||
													entry.diastolic < 60
														? "font-semibold text-destructive"
														: ""
												}
											>
												{entry.systolic}/{entry.diastolic}
											</span>
										</TableCell>
										<TableCell>
											<span
												className={
													entry.temperature >= 37.5 || entry.temperature < 35
														? "font-semibold text-destructive"
														: ""
												}
											>
												{entry.temperature.toFixed(1)}
											</span>
										</TableCell>
										<TableCell>
											<span
												className={
													entry.pulse > 100 || entry.pulse < 50
														? "font-semibold text-destructive"
														: ""
												}
											>
												{entry.pulse}
											</span>
										</TableCell>
										<TableCell>{entry.weight.toFixed(1)}</TableCell>
										{onUpdate && (
											<TableCell>
												<div className="flex gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														onClick={() => setEditingEntry(entry)}
													>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-destructive hover:text-destructive"
														onClick={() => handleDelete(entry.id)}
														disabled={isPending}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										)}
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</>
	);
}

const statusConfig = {
	normal: {
		label: "Normal",
		className: "bg-green-500 text-white hover:bg-green-500/90",
	},
	warning: {
		label: "Atenție",
		className: "bg-orange-500 text-white hover:bg-orange-500/90",
	},
	critical: {
		label: "Critic",
		className:
			"bg-destructive text-destructive-foreground hover:bg-destructive/90",
	},
};

function StatusBadge({
	status,
}: {
	status: "normal" | "warning" | "critical";
}) {
	const { label, className } = statusConfig[status];
	return <Badge className={className}>{label}</Badge>;
}
