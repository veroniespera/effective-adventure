"use client";

import { useEffect, useState, useTransition } from "react";
import { z } from "zod";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import {
	addPatientWithUser,
	getRecentPatients,
} from "@/features/patients/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Spinner } from "@/components/ui/spinner";
import {
	frequencyOptions,
	categoryOptions,
	suggestedDrugs,
} from "@/features/medication/data/schema";

const sexValues = ["masculin", "feminin", "nespecificat"] as const;
const languageValues = ["ro", "en", "it", "fr", "de"] as const;
const etiologyValues = [
	"HBV",
	"HDV",
	"HCV",
	"MASLD",
	"alcool",
	"autoimuna",
	"altele",
] as const;
const donorTypeValues = ["cadaveric", "viu"] as const;
const donorStatusValues = ["pozitiv", "negativ", "necunoscut"] as const;
const rejectionTypeValues = ["acut", "cronic"] as const;
const medicationEntrySchema = z.object({
	name: z.string().min(1, "Câmpul este obligatoriu."),
	dose: z.string().min(1, "Câmpul este obligatoriu."),
	frequency: z.string().min(1, "Câmpul este obligatoriu."),
	notes: z.string().optional(),
	startDate: z.string().min(1, "Câmpul este obligatoriu."),
	endDate: z.string().optional(),
	category: z.string().optional(),
});

const patientFormSchema = z.object({
	firstName: z.string().min(1, "Câmpul este obligatoriu."),
	lastName: z.string().min(1, "Câmpul este obligatoriu."),
	patientId: z.string().min(1, "Câmpul este obligatoriu."),
	age: z.number().min(0).max(130).optional(),
	sex: z.enum(sexValues),
	weightKg: z.number().min(0).optional(),
	heightCm: z.number().min(0).optional(),
	bmi: z.number().min(0).optional(),
	nationality: z.string().optional(),
	preferredLanguage: z.enum(languageValues),
	transplantDate: z.string().optional(),
	etiology: z.enum(etiologyValues),
	etiologyOther: z.string().optional(),
	donorType: z.enum(donorTypeValues),
	donorAntiHbc: z.enum(donorStatusValues),
	donorHbsAg: z.enum(donorStatusValues),
	rejectionHistory: z.boolean(),
	rejectionDate: z.string().optional(),
	rejectionType: z.enum(rejectionTypeValues),
	majorComplications: z.string().optional(),
	medications: z.array(medicationEntrySchema).default([]),
	patientPhone: z.string().min(1, "Câmpul este obligatoriu."),
	patientEmail: z
		.string()
		.email("Adresa de email invalidă.")
		.min(1, "Câmpul este obligatoriu."),
	doctorAccount: z.string().min(1, "Câmpul este obligatoriu."),
});

type PatientFormValues = z.input<typeof patientFormSchema>;

const defaultValues: PatientFormValues = {
	firstName: "",
	lastName: "",
	patientId: "",
	age: undefined,
	sex: "nespecificat",
	weightKg: undefined,
	heightCm: undefined,
	bmi: undefined,
	nationality: "",
	preferredLanguage: "ro",
	transplantDate: "",
	etiology: "HBV",
	etiologyOther: "",
	donorType: "cadaveric",
	donorAntiHbc: "necunoscut",
	donorHbsAg: "necunoscut",
	rejectionHistory: false,
	rejectionDate: "",
	rejectionType: "acut",
	majorComplications: "",
	medications: [],
	patientPhone: "",
	patientEmail: "",
	doctorAccount: undefined as unknown as string,
};

const REQUIRED_FIELD_LABELS: Record<string, string> = {
	firstName: "Prenume",
	lastName: "Nume",
	patientId: "ID pacient",
	patientEmail: "Email pacient",
	doctorAccount: "Medic responsabil",
	sex: "Sex",
	preferredLanguage: "Limba preferată",
	etiology: "Etiologia bolii hepatice",
	donorType: "Tip donator",
};

function updateNumberField(
	value: string,
	onChange: (value: number | undefined) => void,
) {
	if (value === "") {
		onChange(undefined);
		return;
	}
	const parsed = Number(value);
	onChange(Number.isNaN(parsed) ? undefined : parsed);
}

interface Admin {
	id: string;
	name: string;
	email: string;
}

interface RecentPatient {
	id: string;
	firstName: string;
	lastName: string;
	patientCode: string;
	etiology: string | null;
	transplantDate: string | null;
	status: string;
}

export function DoctorPatients({ admins }: { admins: Admin[] }) {
	const [isPending, startTransition] = useTransition();
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
	const [loadingRecent, setLoadingRecent] = useState(true);

	const form = useForm<PatientFormValues>({
		resolver: zodResolver(patientFormSchema),
		defaultValues,
	});

	const weight = useWatch({ control: form.control, name: "weightKg" });
	const height = useWatch({ control: form.control, name: "heightCm" });
	const rejectionHistory = useWatch({
		control: form.control,
		name: "rejectionHistory",
	});
	const etiology = useWatch({ control: form.control, name: "etiology" });
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "medications",
	});

	const formErrors = form.formState.errors;
	const hasValidationErrors =
		form.formState.isSubmitted && Object.keys(formErrors).length > 0;

	const missingRequiredFields = Object.entries(REQUIRED_FIELD_LABELS)
		.filter(([key]) => key in formErrors)
		.map(([, label]) => label);

	useEffect(() => {
		if (!weight || !height) {
			if (form.getValues("bmi") !== undefined) {
				form.setValue("bmi", undefined);
			}
			return;
		}
		const heightMeters = height / 100;
		if (heightMeters <= 0) {
			return;
		}
		const bmiValue = weight / (heightMeters * heightMeters);
		const rounded = Number(bmiValue.toFixed(1));
		if (form.getValues("bmi") !== rounded) {
			form.setValue("bmi", rounded);
		}
	}, [form, height, weight]);

	useEffect(() => {
		getRecentPatients()
			.then(setRecentPatients)
			.catch(() => {})
			.finally(() => setLoadingRecent(false));
	}, []);

	function onSubmit(data: PatientFormValues) {
		setSubmitError(null);
		startTransition(async () => {
			const result = await addPatientWithUser(data);

			if (!result.success) {
				setSubmitError(result.error ?? "Eroare necunoscută");
				toast.error(result.error ?? "Eroare la salvarea pacientului");
				return;
			}

			toast.success("Pacientul a fost adăugat cu succes!");
			form.reset(defaultValues);
			getRecentPatients()
				.then(setRecentPatients)
				.catch(() => {});
		});
	}

	function onInvalid() {
		setSubmitError(null);
		toast.error("Completați toate câmpurile obligatorii înainte de salvare.");
	}

	return (
		<>
			<Header>
				<Search />
				<div className="ms-auto flex items-center space-x-4">
					<ThemeSwitch />
					<ConfigDrawer />
				</div>
			</Header>

			<Main className="flex flex-1 flex-col gap-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Panou medic - adaugare pacient
					</h1>
					<p className="text-muted-foreground">
						Seteaza profilul pacientului si detaliile initiale despre
						transplantul hepatic.
					</p>
				</div>

				<div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
					<Card>
						<CardHeader>
							<CardTitle>Fișă inițială pacient</CardTitle>
						</CardHeader>
						<CardContent>
							{hasValidationErrors && (
								<Alert variant="destructive" className="mb-6">
									<AlertCircle className="h-4 w-4" />
									<AlertTitle>Câmpuri obligatorii necompletate</AlertTitle>
									<AlertDescription>
										<p>Următoarele câmpuri obligatorii trebuie completate:</p>
										<ul className="mt-2 list-disc pl-4">
											{missingRequiredFields.map((label) => (
												<li key={label} className="font-medium">
													{label}
												</li>
											))}
											{Object.entries(formErrors)
												.filter(
													([key, err]) =>
														!(key in REQUIRED_FIELD_LABELS) &&
														typeof err?.message === "string",
												)
												.map(([key, err]) => (
													<li key={key} className="font-medium">
														{(err?.message as string) ?? key}
													</li>
												))}
										</ul>
									</AlertDescription>
								</Alert>
							)}

							{submitError && (
								<Alert variant="destructive" className="mb-6">
									<AlertCircle className="h-4 w-4" />
									<AlertTitle>Eroare la salvare</AlertTitle>
									<AlertDescription>{submitError}</AlertDescription>
								</Alert>
							)}

							<Form {...form}>
								<form
									onSubmit={form.handleSubmit(onSubmit, onInvalid)}
									className="space-y-8"
								>
									<section className="space-y-4">
										<h2 className="text-lg font-semibold">Conturi</h2>
										<div className="grid gap-4 md:grid-cols-2">
											<FormField
												control={form.control}
												name="patientPhone"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Număr de telefon *</FormLabel>
														<FormControl>
															<Input
																type="tel"
																placeholder="Ex: 07xx xxx xxx"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="doctorAccount"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															Medic responsabil{" "}
															<span className="text-destructive">*</span>
														</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Selectează medicul" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{admins.map((admin) => (
																	<SelectItem key={admin.id} value={admin.id}>
																		{admin.name} ({admin.email})
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="grid gap-4 md:grid-cols-2">
											<FormField
												control={form.control}
												name="patientEmail"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															Email pacient{" "}
															<span className="text-destructive">*</span>
														</FormLabel>
														<FormControl>
															<Input
																type="email"
																placeholder="ex: pacient@email.com"
																className={
																	formErrors.patientEmail
																		? "border-destructive"
																		: ""
																}
																{...field}
															/>
														</FormControl>
														<FormDescription>
															Folosit pentru autentificarea pacientului.
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
											<p className="text-sm text-muted-foreground pt-2">
												O parolă va fi generată automat și trimisă pe email.
											</p>
										</div>
									</section>

									<Separator />

									<section className="space-y-4">
										<h2 className="text-lg font-semibold">Profil pacient</h2>
										<div className="grid gap-4 md:grid-cols-2">
											<FormField
												control={form.control}
												name="firstName"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															Prenume{" "}
															<span className="text-destructive">*</span>
														</FormLabel>
														<FormControl>
															<Input
																placeholder="Prenumele pacientului"
																className={
																	formErrors.firstName
																		? "border-destructive"
																		: ""
																}
																{...field}
															/>
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
														<FormLabel>
															Nume <span className="text-destructive">*</span>
														</FormLabel>
														<FormControl>
															<Input
																placeholder="Numele pacientului"
																className={
																	formErrors.lastName
																		? "border-destructive"
																		: ""
																}
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
											<FormField
												control={form.control}
												name="patientId"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															ID pacient{" "}
															<span className="text-destructive">*</span>
														</FormLabel>
														<FormControl>
															<Input
																placeholder="Cod intern / inițiale"
																className={
																	formErrors.patientId
																		? "border-destructive"
																		: ""
																}
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="age"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Vârsta</FormLabel>
														<FormControl>
															<Input
																type="number"
																min={0}
																placeholder="Ani"
																value={field.value ?? ""}
																onChange={(event) =>
																	updateNumberField(
																		event.target.value,
																		field.onChange,
																	)
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="sex"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Sex</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Selectează" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="masculin">
																	Masculin
																</SelectItem>
																<SelectItem value="feminin">Feminin</SelectItem>
																<SelectItem value="nespecificat">
																	Nespecificat
																</SelectItem>
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
											<FormField
												control={form.control}
												name="weightKg"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Greutate</FormLabel>
														<FormControl>
															<Input
																type="number"
																min={0}
																placeholder="kg"
																value={field.value ?? ""}
																onChange={(event) =>
																	updateNumberField(
																		event.target.value,
																		field.onChange,
																	)
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="heightCm"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Înălțime</FormLabel>
														<FormControl>
															<Input
																type="number"
																min={0}
																placeholder="cm"
																value={field.value ?? ""}
																onChange={(event) =>
																	updateNumberField(
																		event.target.value,
																		field.onChange,
																	)
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="bmi"
												render={({ field }) => (
													<FormItem>
														<FormLabel>BMI</FormLabel>
														<FormControl>
															<Input
																value={field.value ?? ""}
																placeholder="Calculat automat"
																readOnly
																disabled
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="nationality"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Naționalitate</FormLabel>
														<FormControl>
															<Input placeholder="Ex: română" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="preferredLanguage"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Limba preferată</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Selectează" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="ro">Română</SelectItem>
																<SelectItem value="en">Engleză</SelectItem>
																<SelectItem value="it">Italiană</SelectItem>
																<SelectItem value="fr">Franceză</SelectItem>
																<SelectItem value="de">Germană</SelectItem>
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</section>

									<Separator />

									<section className="space-y-4">
										<h2 className="text-lg font-semibold">
											Transplant hepatic
										</h2>
										<div className="grid gap-4 md:grid-cols-2">
											<FormField
												control={form.control}
												name="transplantDate"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Data transplantului hepatic</FormLabel>
														<FormControl>
															<Input type="date" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="etiology"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Etiologia bolii hepatice</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Selectează" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="HBV">HBV</SelectItem>
																<SelectItem value="HDV">HDV</SelectItem>
																<SelectItem value="HCV">HCV</SelectItem>
																<SelectItem value="MASLD">MASLD</SelectItem>
																<SelectItem value="alcool">Alcool</SelectItem>
																<SelectItem value="autoimuna">
																	Autoimuna
																</SelectItem>
																<SelectItem value="altele">Altele</SelectItem>
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
											{etiology === "altele" && (
												<FormField
													control={form.control}
													name="etiologyOther"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Etiologie - alte detalii</FormLabel>
															<FormControl>
																<Input
																	placeholder="Specificați etiologia"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											)}
										</div>
										<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
											<FormField
												control={form.control}
												name="donorType"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Tip donator</FormLabel>
														<FormControl>
															<RadioGroup
																onValueChange={field.onChange}
																defaultValue={field.value}
																className="flex flex-col gap-2"
															>
																<FormItem className="flex items-center gap-2">
																	<FormControl>
																		<RadioGroupItem value="cadaveric" />
																	</FormControl>
																	<FormLabel className="font-normal">
																		Cadaveric
																	</FormLabel>
																</FormItem>
																<FormItem className="flex items-center gap-2">
																	<FormControl>
																		<RadioGroupItem value="viu" />
																	</FormControl>
																	<FormLabel className="font-normal">
																		Viu
																	</FormLabel>
																</FormItem>
															</RadioGroup>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="donorAntiHbc"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Status donator anti-HBc</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Selectează" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="pozitiv">Pozitiv</SelectItem>
																<SelectItem value="negativ">Negativ</SelectItem>
																<SelectItem value="necunoscut">
																	Necunoscut
																</SelectItem>
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="donorHbsAg"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Status donator HBsAg</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Selectează" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="pozitiv">Pozitiv</SelectItem>
																<SelectItem value="negativ">Negativ</SelectItem>
																<SelectItem value="necunoscut">
																	Necunoscut
																</SelectItem>
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
											<FormField
												control={form.control}
												name="rejectionHistory"
												render={({ field }) => (
													<FormItem className="flex items-center justify-between rounded-lg border p-4">
														<div>
															<FormLabel>Rejet în antecedente</FormLabel>
															<FormDescription>
																Indicați dacă au existat episoade de rejet.
															</FormDescription>
														</div>
														<FormControl>
															<Switch
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</FormControl>
													</FormItem>
												)}
											/>
											{rejectionHistory && (
												<FormField
													control={form.control}
													name="rejectionDate"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Data rejet</FormLabel>
															<FormControl>
																<Input type="date" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											)}
											{rejectionHistory && (
												<FormField
													control={form.control}
													name="rejectionType"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Tip rejet</FormLabel>
															<Select
																onValueChange={field.onChange}
																value={field.value}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder="Selectează" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	<SelectItem value="acut">Acut</SelectItem>
																	<SelectItem value="cronic">Cronic</SelectItem>
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>
											)}
										</div>
										<FormField
											control={form.control}
											name="majorComplications"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Complicații majore post-LT</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Ex: tromboză arteră hepatică, stenoză biliară, infecții severe"
															className="min-h-[100px]"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</section>

									<Separator />

									<section className="space-y-4">
										<div className="flex items-center justify-between">
											<h2 className="text-lg font-semibold">
												Schema terapeutică
											</h2>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() =>
													append({
														name: "",
														dose: "",
														frequency: "",
														notes: "",
														startDate: new Date().toISOString().split("T")[0],
														endDate: "",
														category: "altele",
													})
												}
											>
												<Plus className="mr-1 h-4 w-4" />
												Adaugă medicament
											</Button>
										</div>

										{fields.length === 0 && (
											<p className="text-sm text-muted-foreground">
												Niciun medicament adăugat încă. Apăsați butonul de mai
												sus pentru a adăuga.
											</p>
										)}

										{fields.map((field, index) => {
											const cat = form.watch(`medications.${index}.category`);
											const suggestions = suggestedDrugs[cat ?? "altele"] ?? [];

											return (
												<div
													key={field.id}
													className="rounded-lg border p-4 space-y-3"
												>
													<div className="flex items-center justify-between">
														<p className="text-sm font-medium">
															Medicament #{index + 1}
														</p>
														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-destructive"
															onClick={() => remove(index)}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>

													<div className="grid gap-3 sm:grid-cols-2">
														<div className="space-y-1.5">
															<FormLabel className="text-xs">
																Categorie
															</FormLabel>
															<Select
																value={cat ?? "altele"}
																onValueChange={(v) => {
																	form.setValue(
																		`medications.${index}.category`,
																		v,
																	);
																	if (v === "hbig") {
																		form.setValue(
																			`medications.${index}.name`,
																			"HB-Ig",
																		);
																	}
																}}
															>
																<SelectTrigger>
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	{categoryOptions.map((opt) => (
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
															<FormLabel className="text-xs">
																Nume medicament
															</FormLabel>
															<Input
																placeholder="ex: Tacrolimus"
																{...form.register(`medications.${index}.name`)}
															/>
															{suggestions.length > 0 && (
																<div className="flex flex-wrap gap-1">
																	{suggestions.map((drug: string) => (
																		<Badge
																			key={drug}
																			variant="outline"
																			className="cursor-pointer text-[10px] hover:bg-accent"
																			onClick={() =>
																				form.setValue(
																					`medications.${index}.name`,
																					drug,
																				)
																			}
																		>
																			{drug}
																		</Badge>
																	))}
																</div>
															)}
														</div>
														<div className="space-y-1.5">
															<FormLabel className="text-xs">Doză</FormLabel>
															<Input
																placeholder="ex: 2 mg"
																{...form.register(`medications.${index}.dose`)}
															/>
														</div>
														<div className="space-y-1.5">
															<FormLabel className="text-xs">
																Frecvență
															</FormLabel>
															<Select
																value={
																	form.watch(
																		`medications.${index}.frequency`,
																	) ?? ""
																}
																onValueChange={(v) =>
																	form.setValue(
																		`medications.${index}.frequency`,
																		v,
																	)
																}
															>
																<SelectTrigger>
																	<SelectValue placeholder="Selectați" />
																</SelectTrigger>
																<SelectContent>
																	{frequencyOptions.map((opt) => (
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
															<FormLabel className="text-xs">
																Data începere
															</FormLabel>
															<Input
																type="date"
																{...form.register(
																	`medications.${index}.startDate`,
																)}
															/>
														</div>
														<div className="space-y-1.5">
															<FormLabel className="text-xs">
																Data expirare (opțional)
															</FormLabel>
															<Input
																type="date"
																{...form.register(
																	`medications.${index}.endDate`,
																)}
															/>
														</div>
														<div className="space-y-1.5 sm:col-span-2">
															<FormLabel className="text-xs">
																Notițe (opțional)
															</FormLabel>
															<Input
																placeholder="ex: pe stomacul gol, dimineața"
																{...form.register(`medications.${index}.notes`)}
															/>
														</div>
													</div>
												</div>
											);
										})}
									</section>

									<div className="flex flex-wrap gap-3">
										<Button type="submit" disabled={isPending}>
											{isPending ? "Se salvează..." : "Salvează pacient"}
										</Button>
										<Button
											type="button"
											variant="outline"
											onClick={() => {
												form.reset(defaultValues);
												setSubmitError(null);
											}}
											disabled={isPending}
										>
											Resetează formularul
										</Button>
									</div>
								</form>
							</Form>
						</CardContent>
					</Card>

					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Pacienți recenți</CardTitle>
								<CardDescription>
									Ultimii pacienți adăugați de echipa medicală.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{loadingRecent ? (
									<div className="flex items-center justify-center py-4">
										<Spinner className="size-5" />
									</div>
								) : recentPatients.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										Niciun pacient adăugat încă.
									</p>
								) : null}
								{!loadingRecent &&
									recentPatients.map((p) => (
										<div
											key={p.id}
											className="flex items-center justify-between gap-4"
										>
											<div className="flex items-center gap-3">
												<Avatar className="h-10 w-10">
													<AvatarFallback>
														{p.firstName[0]}
														{p.lastName[0]}
													</AvatarFallback>
												</Avatar>
												<div>
													<p className="text-sm font-semibold">
														{p.firstName} {p.lastName.charAt(0)}.
													</p>
													<p className="text-xs text-muted-foreground">
														ID {p.patientCode}
														{p.etiology ? ` · Etiologie ${p.etiology}` : ""}
													</p>
												</div>
											</div>
											<div className="text-right">
												<Badge variant="secondary">
													{p.status === "activ" ? "Activ" : "Inactiv"}
												</Badge>
												{p.transplantDate && (
													<p className="text-xs text-muted-foreground">
														Transplant {p.transplantDate}
													</p>
												)}
											</div>
										</div>
									))}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Ghid completare fișă</CardTitle>
								<CardDescription>
									Secțiunile formularului și prioritatea fiecăreia.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3 text-sm">
								<div className="flex items-center justify-between gap-2">
									<span>Conturi (telefon, email, medic responsabil)</span>
									<Badge variant="outline">Obligatoriu</Badge>
								</div>
								<div className="flex items-center justify-between gap-2">
									<span>Profil pacient (nume, prenume, ID)</span>
									<Badge variant="outline">Obligatoriu</Badge>
								</div>
								<div className="flex items-center justify-between gap-2">
									<span>
										Date antropometrice (vârstă, sex, greutate, înălțime)
									</span>
									<Badge variant="outline">Recomandat</Badge>
								</div>
								<div className="flex items-center justify-between gap-2">
									<span>Transplant hepatic (dată, etiologie, donator)</span>
									<Badge variant="outline">Critic</Badge>
								</div>
								<div className="flex items-center justify-between gap-2">
									<span>Istoric rejet și complicații</span>
									<Badge variant="outline">Opțional</Badge>
								</div>
								<div className="flex items-center justify-between gap-2">
									<span>Schemă terapeutică (medicație)</span>
									<Badge variant="outline">Recomandat</Badge>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</Main>
		</>
	);
}
