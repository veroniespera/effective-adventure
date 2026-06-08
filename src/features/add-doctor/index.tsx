"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { addDoctorWithUser } from "@/features/doctors/actions";
import {
	addDoctorFormSchema,
	type AddDoctorFormValues,
} from "@/features/doctors/data/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";

import { Separator } from "@/components/ui/separator";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";

const defaultValues: AddDoctorFormValues = {
	firstName: "",
	lastName: "",
	email: "",
	specialization: "",
	phone: "",
	licenseNumber: "",
};

export function AddDoctor() {
	const [serverError, setServerError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const form = useForm<AddDoctorFormValues>({
		resolver: zodResolver(addDoctorFormSchema),
		defaultValues,
	});

	function onSubmit(values: AddDoctorFormValues) {
		setServerError(null);

		startTransition(async () => {
			const result = await addDoctorWithUser(values);

			if (!result.success) {
				if (result.fieldErrors) {
					for (const [field, message] of Object.entries(result.fieldErrors)) {
						form.setError(field as keyof AddDoctorFormValues, {
							message,
						});
					}
				}
				setServerError(result.error ?? "Eroare necunoscută");
				toast.error(result.error ?? "Eroare la adăugarea medicului");
				return;
			}

			toast.success("Medicul a fost adăugat cu succes!");
			form.reset(defaultValues);
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

			<Main className="flex flex-1 flex-col gap-4 sm:gap-6">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Adaugă Medic</h2>
					<p className="text-muted-foreground">
						Creați un cont nou pentru un medic.
					</p>
				</div>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-6 pb-10"
					>
						{serverError && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertTitle>Eroare</AlertTitle>
								<AlertDescription>{serverError}</AlertDescription>
							</Alert>
						)}

						<Card>
							<CardHeader>
								<CardTitle>Date personale</CardTitle>
								<CardDescription>
									Informații de bază despre medic.
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4 sm:grid-cols-2">
								<FormField
									control={form.control}
									name="firstName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Prenume *</FormLabel>
											<FormControl>
												<Input placeholder="Ion" {...field} />
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
												<Input placeholder="Popescu" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
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
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Cont utilizator</CardTitle>
								<CardDescription>
									O parolă va fi generată automat și trimisă pe email.
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4 sm:grid-cols-1">
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email *</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="medic@exemplu.com"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						<Separator />

						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => form.reset(defaultValues)}
								disabled={isPending}
							>
								Resetează formularul
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending ? "Se salvează..." : "Adaugă medic"}
							</Button>
						</div>
					</form>
				</Form>
			</Main>
		</>
	);
}
