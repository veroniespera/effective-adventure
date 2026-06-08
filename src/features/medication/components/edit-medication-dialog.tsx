"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	medicationFormSchema,
	frequencyOptions,
	categoryOptions,
	type MedicationFormValues,
	type Medication,
} from "../data/schema";
import {
	updateMedication,
	updateMedicationForPatient,
	deleteMedication,
	deleteMedicationForPatient,
} from "../actions";
import { ReminderTimesEditor } from "./reminder-times-editor";

interface EditMedicationDialogProps {
	medication: Medication | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	patientId?: string;
	onSuccess?: () => void;
}

export function EditMedicationDialog({
	medication: med,
	open,
	onOpenChange,
	patientId,
	onSuccess,
}: EditMedicationDialogProps) {
	const [isPending, startTransition] = useTransition();

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors },
	} = useForm<MedicationFormValues>({
		resolver: zodResolver(medicationFormSchema),
	});

	const frequencyValue = watch("frequency");
	const categoryValue = watch("category");

	useEffect(() => {
		if (med && open) {
			reset({
				name: med.name,
				dose: med.dose,
				frequency: med.frequency,
				notes: med.notes ?? "",
				startDate: med.startDate,
				endDate: med.endDate ?? "",
				category: med.category ?? "altele",
			});
		}
	}, [med, open, reset]);

	function onSubmit(values: MedicationFormValues) {
		if (!med) return;

		startTransition(async () => {
			const result = patientId
				? await updateMedicationForPatient(patientId, med.id, values)
				: await updateMedication(med.id, values);

			if (result.error) {
				toast.error(result.error);
				return;
			}

			toast.success("Medicamentul a fost actualizat.");
			onOpenChange(false);
			onSuccess?.();
		});
	}

	function handleDelete() {
		if (!med) return;

		startTransition(async () => {
			const result = patientId
				? await deleteMedicationForPatient(patientId, med.id)
				: await deleteMedication(med.id);

			if (result.error) {
				toast.error(result.error);
				return;
			}

			toast.success("Medicamentul a fost șters.");
			onOpenChange(false);
			onSuccess?.();
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Editează medicament</DialogTitle>
					<DialogDescription>
						Modificați detaliile medicamentului.
					</DialogDescription>
				</DialogHeader>
				<form
					noValidate
					onSubmit={handleSubmit(onSubmit)}
					className="grid gap-4 sm:grid-cols-2"
				>
					<div className="space-y-1.5 sm:col-span-2">
						<Label>Categorie</Label>
						<Select
							value={categoryValue}
							onValueChange={(v) => setValue("category", v)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Selectați categoria" />
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
					<div className="space-y-1.5 sm:col-span-2">
						<Label htmlFor="edit-name">Nume medicament</Label>
						<Input id="edit-name" {...register("name")} />
						{errors.name && (
							<p className="text-sm text-destructive">{errors.name.message}</p>
						)}
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="edit-dose">Doza</Label>
						<Input id="edit-dose" {...register("dose")} />
						{errors.dose && (
							<p className="text-sm text-destructive">{errors.dose.message}</p>
						)}
					</div>
					<div className="space-y-1.5">
						<Label>Frecvență</Label>
						<Select
							value={frequencyValue}
							onValueChange={(v) => setValue("frequency", v)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Selectați frecvența" />
							</SelectTrigger>
							<SelectContent>
								{frequencyOptions.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors.frequency && (
							<p className="text-sm text-destructive">
								{errors.frequency.message}
							</p>
						)}
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="edit-startDate">Data începere</Label>
						<Input id="edit-startDate" type="date" {...register("startDate")} />
						{errors.startDate && (
							<p className="text-sm text-destructive">
								{errors.startDate.message}
							</p>
						)}
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="edit-endDate">Data expirare (opțional)</Label>
						<Input id="edit-endDate" type="date" {...register("endDate")} />
					</div>
					<div className="space-y-1.5 sm:col-span-2">
						<Label htmlFor="edit-notes">Notițe (opțional)</Label>
						<Textarea
							id="edit-notes"
							className="min-h-[60px]"
							{...register("notes")}
						/>
					</div>
					{med && !patientId && (
						<div className="sm:col-span-2 border-t pt-4">
							<ReminderTimesEditor
								medicationId={med.id}
								frequency={frequencyValue || med.frequency}
							/>
						</div>
					)}
					<DialogFooter className="sm:col-span-2 flex gap-2">
						<Button
							type="button"
							variant="destructive"
							onClick={handleDelete}
							disabled={isPending}
						>
							Șterge
						</Button>
						<div className="flex-1" />
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							Anulează
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Se salvează..." : "Salvează"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
