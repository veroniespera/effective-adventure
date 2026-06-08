"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteSymptomReport } from "../actions";
import { SymptomsForm } from "./symptoms-form";

interface SymptomReportItem {
	id: string;
	patientId: string;
	date: string;
	symptoms: string[];
	severity: "usoara" | "moderata" | "severa";
	notes: string | null | undefined;
}

interface SymptomsListProps {
	data: SymptomReportItem[];
	onUpdate?: () => void;
}

const severityConfig = {
	usoara: { label: "Usoara", variant: "outline" as const },
	moderata: { label: "Moderata", variant: "secondary" as const },
	severa: { label: "Severa", variant: "destructive" as const },
};

export function SymptomsList({ data, onUpdate }: SymptomsListProps) {
	const [editingReport, setEditingReport] = useState<SymptomReportItem | null>(
		null,
	);
	const [isPending, startTransition] = useTransition();
	// Reports can only be edited/deleted on the same day they were recorded.
	const today = new Date().toISOString().split("T")[0];

	function handleDelete(id: string) {
		startTransition(async () => {
			const result = await deleteSymptomReport(id);
			if (result.error) {
				toast.error(result.error);
				return;
			}
			toast.success("Raportul a fost șters.");
			onUpdate?.();
		});
	}

	return (
		<div className="space-y-3">
			{editingReport && (
				<SymptomsForm
					editId={editingReport.id}
					defaultValues={{
						symptoms: editingReport.symptoms,
						severity: editingReport.severity,
						notes: editingReport.notes ?? "",
					}}
					onSuccess={() => {
						setEditingReport(null);
						onUpdate?.();
					}}
					onCancel={() => setEditingReport(null)}
				/>
			)}
			{data.length === 0 && (
				<p className="text-sm text-muted-foreground">
					Nu exista rapoarte de simptome.
				</p>
			)}
			{data.map((report) => {
				const config = severityConfig[report.severity];
				return (
					<Card key={report.id}>
						<CardHeader className="pb-2">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-medium">
									{report.date}
								</CardTitle>
								<div className="flex items-center gap-2">
									<Badge variant={config.variant}>{config.label}</Badge>
									{onUpdate &&
										(report.date === today ? (
											<>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={() => setEditingReport(report)}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-destructive hover:text-destructive"
															disabled={isPending}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>
																Ștergi acest raport?
															</AlertDialogTitle>
															<AlertDialogDescription>
																Această acțiune este permanentă și nu poate fi
																anulată.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>Anulează</AlertDialogCancel>
															<AlertDialogAction
																onClick={() => handleDelete(report.id)}
																className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
															>
																Șterge
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</>
										) : (
											<span
												className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground"
												title="Se poate modifica doar în ziua înregistrării"
											>
												<Lock className="h-4 w-4" />
											</span>
										))}
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-1.5">
								{report.symptoms.map((s) => (
									<Badge key={s} variant="secondary" className="text-xs">
										{s}
									</Badge>
								))}
							</div>
							{report.notes && (
								<p className="mt-2 text-sm text-muted-foreground">
									{report.notes}
								</p>
							)}
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
