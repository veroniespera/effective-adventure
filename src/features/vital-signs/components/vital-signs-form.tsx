"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	vitalEntryFormSchema,
	type VitalEntryFormValues,
} from "../data/schema";
import { createVitalSign, updateVitalSign } from "../actions";

interface VitalSignsFormProps {
	editId?: string;
	defaultValues?: VitalEntryFormValues;
	onSuccess?: () => void;
	onCancel?: () => void;
}

export function VitalSignsForm({
	editId,
	defaultValues,
	onSuccess,
	onCancel,
}: VitalSignsFormProps) {
	const [isPending, startTransition] = useTransition();
	const [submitted, setSubmitted] = useState(false);

	const emptyValues = {
		systolic: "" as unknown as number,
		diastolic: "" as unknown as number,
		temperature: "" as unknown as number,
		pulse: "" as unknown as number,
		weight: "" as unknown as number,
	};

	const form = useForm<VitalEntryFormValues>({
		resolver: zodResolver(vitalEntryFormSchema),
		defaultValues: defaultValues ?? emptyValues,
	});

	function onSubmit(values: VitalEntryFormValues) {
		startTransition(async () => {
			const result = editId
				? await updateVitalSign(editId, values)
				: await createVitalSign(values);

			if (result.error) {
				toast.error(result.error);
				return;
			}

			toast.success(
				editId
					? "Semnele vitale au fost actualizate cu succes."
					: "Semnele vitale au fost înregistrate cu succes.",
			);

			if (!editId) {
				window.dispatchEvent(
					new CustomEvent("tc:engagement", {
						detail: { type: "vital_signs" },
					}),
				);
			}

			if (result.status === "critical") {
				toast.warning(
					"Valorile introduse sunt critice. Medicul dumneavoastră va fi notificat.",
					{ duration: 6000 },
				);
			} else if (result.status === "warning") {
				toast.warning(
					"Unele valori sunt în afara limitelor normale. Medicul dumneavoastră va fi notificat.",
					{ duration: 5000 },
				);
			}

			form.reset(emptyValues);
			setSubmitted(true);
			setTimeout(() => setSubmitted(false), 4000);
			onSuccess?.();
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{editId ? "Editează semne vitale" : "Înregistrează semne vitale"}
				</CardTitle>
				<CardDescription>Completați valorile măsurate astăzi.</CardDescription>
			</CardHeader>
			<CardContent>
				{submitted && (
					<div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
						{editId
							? "Semnele vitale au fost actualizate cu succes."
							: "Semnele vitale au fost înregistrate cu succes."}
					</div>
				)}
				<Form {...form}>
					<form
						noValidate
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid gap-4 sm:grid-cols-2"
					>
						<FormField
							control={form.control}
							name="systolic"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tensiune sistolică (mmHg)</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="120"
											min={60}
											max={250}
											{...field}
											value={field.value ?? ""}
											onChange={(e) => field.onChange(e.target.valueAsNumber)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="diastolic"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tensiune diastolică (mmHg)</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="80"
											min={40}
											max={150}
											{...field}
											value={field.value ?? ""}
											onChange={(e) => field.onChange(e.target.valueAsNumber)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="temperature"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Temperatura (°C)</FormLabel>
									<FormControl>
										<Input
											type="number"
											step="0.1"
											placeholder="36.6"
											min={35}
											max={42}
											{...field}
											value={field.value ?? ""}
											onChange={(e) => field.onChange(e.target.valueAsNumber)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="pulse"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Puls (bpm)</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="72"
											min={30}
											max={200}
											{...field}
											value={field.value ?? ""}
											onChange={(e) => field.onChange(e.target.valueAsNumber)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="weight"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Greutate (kg)</FormLabel>
									<FormControl>
										<Input
											type="number"
											step="0.1"
											placeholder="75.0"
											min={20}
											max={300}
											{...field}
											value={field.value ?? ""}
											onChange={(e) => field.onChange(e.target.valueAsNumber)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex items-end gap-2">
							<Button type="submit" className="flex-1" disabled={isPending}>
								{isPending
									? "Se salvează..."
									: editId
										? "Actualizează"
										: "Salvează"}
							</Button>
							{onCancel && (
								<Button
									type="button"
									variant="outline"
									onClick={onCancel}
									disabled={isPending}
								>
									Anulează
								</Button>
							)}
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
