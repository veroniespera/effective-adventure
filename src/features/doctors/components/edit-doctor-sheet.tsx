"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertCircle, Trash2 } from "lucide-react";
import { updateDoctor, deleteDoctor } from "../actions";
import {
	editDoctorFormSchema,
	type EditDoctorFormValues,
	type Doctor,
} from "../data/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
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

interface EditDoctorSheetProps {
	doctor: Doctor | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved?: () => void;
}

function doctorToFormValues(d: Doctor): EditDoctorFormValues {
	return {
		firstName: d.firstName,
		lastName: d.lastName,
		specialization: d.specialization ?? "",
		phone: d.phone ?? "",
		licenseNumber: d.licenseNumber ?? "",
		status: d.status,
	};
}

export function EditDoctorSheet({
	doctor,
	open,
	onOpenChange,
	onSaved,
}: EditDoctorSheetProps) {
	const [serverError, setServerError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const [isDeleting, startDeleteTransition] = useTransition();

	const form = useForm<EditDoctorFormValues>({
		resolver: zodResolver(editDoctorFormSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			specialization: "",
			phone: "",
			licenseNumber: "",
			status: "activ",
		},
	});

	useEffect(() => {
		if (doctor) {
			form.reset(doctorToFormValues(doctor));
		}
	}, [doctor, form]);

	function handleDelete() {
		if (!doctor) return;
		startDeleteTransition(async () => {
			const result = await deleteDoctor(doctor.id);
			if (!result.success) {
				setServerError(result.error ?? "Eroare necunoscută");
				toast.error(result.error ?? "Eroare la ștergerea medicului");
				return;
			}
			toast.success("Medicul a fost șters cu succes!");
			onOpenChange(false);
			onSaved?.();
		});
	}

	function onSubmit(values: EditDoctorFormValues) {
		if (!doctor) return;
		setServerError(null);

		startTransition(async () => {
			const result = await updateDoctor(doctor.id, values);

			if (!result.success) {
				if (result.fieldErrors) {
					for (const [field, message] of Object.entries(result.fieldErrors)) {
						form.setError(field as keyof EditDoctorFormValues, {
							message,
						});
					}
				}
				setServerError(result.error ?? "Eroare necunoscută");
				return;
			}

			toast.success("Medicul a fost actualizat cu succes!");
			onOpenChange(false);
			onSaved?.();
		});
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="overflow-y-auto sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>Editează medic</SheetTitle>
					<SheetDescription>Modificați datele medicului.</SheetDescription>
				</SheetHeader>

				<Form {...form}>
					<form
						noValidate
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4 px-1 pt-4"
					>
						{serverError && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertTitle>Eroare</AlertTitle>
								<AlertDescription>{serverError}</AlertDescription>
							</Alert>
						)}

						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="firstName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Prenume *</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="lastName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nume *</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="specialization"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Specializare</FormLabel>
									<FormControl>
										<Input placeholder="ex. Hepatologie" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="phone"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Telefon *</FormLabel>
									<FormControl>
										<Input placeholder="07xx xxx xxx" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="licenseNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Cod parafă</FormLabel>
									<FormControl>
										<Input placeholder="ex. 12345" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="status"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Status</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="activ">Activ</SelectItem>
											<SelectItem value="inactiv">Inactiv</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-between gap-2 pt-4">
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										type="button"
										variant="destructive"
										disabled={isPending || isDeleting}
									>
										<Trash2 className="mr-2 h-4 w-4" />
										{isDeleting ? "Se șterge..." : "Șterge medicul"}
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Confirmați ștergerea</AlertDialogTitle>
										<AlertDialogDescription>
											Această acțiune este ireversibilă. Contul medicului{" "}
											<strong>
												{doctor?.lastName} {doctor?.firstName}
											</strong>{" "}
											va fi șters definitiv, împreună cu toate datele asociate.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Anulează</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleDelete}
											className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
										>
											Șterge definitiv
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
								>
									Anulează
								</Button>
								<Button type="submit" disabled={isPending || isDeleting}>
									{isPending ? "Se salvează..." : "Salvează"}
								</Button>
							</div>
						</div>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
