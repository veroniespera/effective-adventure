"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	ArrowLeft,
	Activity,
	FileText,
	FlaskConical,
	HeartPulse,
	Pill,
	Stethoscope,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getPatientById, getAdmins } from "../actions";
import { callTypes } from "../data/data";
import type { Patient } from "../data/schema";
import { PatientEditForm } from "./patient-edit-form";

interface Admin {
	id: string;
	name: string;
	email: string;
}

interface PatientDetailProps {
	patientId: string;
}

const sectionLinks = [
	{
		key: "notes",
		title: "Note clinice",
		description: "Vizitele și observațiile medicului.",
		icon: FileText,
		href: (id: string) => `/patients/${id}/notes`,
	},
	{
		key: "medication",
		title: "Medicație",
		description: "Schemele terapeutice și aderența.",
		icon: Pill,
		href: (id: string) => `/patients/${id}/medication`,
	},
	{
		key: "vital-signs",
		title: "Semne vitale",
		description: "Tensiune, puls, temperatură, greutate.",
		icon: HeartPulse,
		href: (id: string) => `/patients/${id}/vital-signs`,
	},
	{
		key: "symptoms",
		title: "Simptome",
		description: "Simptomele raportate de pacient.",
		icon: Activity,
		href: (id: string) => `/patients/${id}/symptoms`,
	},
	{
		key: "lab-results",
		title: "Rezultate laborator",
		description: "Analize și investigații.",
		icon: FlaskConical,
		href: (id: string) => `/patients/${id}/lab-results`,
	},
] as const;

function mapPatient(record: Record<string, unknown>): Patient {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(record)) {
		result[key] = value === null ? undefined : value;
	}
	return result as Patient;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-0.5">
			<dt className="text-xs uppercase tracking-wide text-muted-foreground">
				{label}
			</dt>
			<dd className="text-sm font-medium">
				{value === undefined || value === null || value === "" ? "—" : value}
			</dd>
		</div>
	);
}

const sexLabels: Record<string, string> = {
	masculin: "Masculin",
	feminin: "Feminin",
	nespecificat: "Nespecificat",
};

const languageLabels: Record<string, string> = {
	ro: "Română",
	en: "Engleză",
	it: "Italiană",
	fr: "Franceză",
	de: "Germană",
};

const donorTypeLabels: Record<string, string> = {
	cadaveric: "Cadaveric",
	viu: "Viu",
};

const donorStatusLabels: Record<string, string> = {
	pozitiv: "Pozitiv",
	negativ: "Negativ",
	necunoscut: "Necunoscut",
};

const rejectionTypeLabels: Record<string, string> = {
	acut: "Acut",
	cronic: "Cronic",
};

export function PatientDetail({ patientId }: PatientDetailProps) {
	const router = useRouter();
	const [patient, setPatient] = useState<Patient | null>(null);
	const [admins, setAdmins] = useState<Admin[]>([]);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);

	const fetchPatient = useCallback(() => {
		getPatientById(patientId)
			.then((data) => {
				if (!data) {
					setNotFound(true);
					setPatient(null);
					return;
				}
				setPatient(mapPatient(data as unknown as Record<string, unknown>));
			})
			.catch(() => {
				toast.error("Eroare la încărcarea pacientului.");
			})
			.finally(() => setLoading(false));
	}, [patientId]);

	useEffect(() => {
		fetchPatient();
		getAdmins()
			.then(setAdmins)
			.catch(() => {});
	}, [fetchPatient]);

	const doctorName = patient?.doctorId
		? admins.find((a) => a.id === patient.doctorId)?.name
		: undefined;

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
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => router.push("/patients")}
						className="gap-1"
					>
						<ArrowLeft className="h-4 w-4" />
						Înapoi la listă
					</Button>
				</div>

				{loading ? (
					<div className="flex flex-1 items-center justify-center">
						<Spinner className="size-6" />
					</div>
				) : notFound || !patient ? (
					<Card>
						<CardHeader>
							<CardTitle>Pacientul nu a fost găsit</CardTitle>
							<CardDescription>
								Verificați linkul sau întoarceți-vă la lista de pacienți.
							</CardDescription>
						</CardHeader>
					</Card>
				) : (
					<>
						<div className="flex flex-wrap items-start justify-between gap-4">
							<div>
								<div className="flex flex-wrap items-center gap-3">
									<h2 className="text-2xl font-bold tracking-tight">
										{patient.lastName} {patient.firstName}
									</h2>
									<Badge
										variant="outline"
										className={cn("capitalize", callTypes.get(patient.status))}
									>
										{patient.status}
									</Badge>
								</div>
								<p className="text-muted-foreground">
									Cod pacient: {patient.patientCode ?? "—"}
									{doctorName ? ` · Medic responsabil: ${doctorName}` : ""}
								</p>
							</div>
						</div>

						<Tabs defaultValue="overview" className="w-full">
							<TabsList>
								<TabsTrigger value="overview">Prezentare</TabsTrigger>
								<TabsTrigger value="edit">Editare detalii</TabsTrigger>
							</TabsList>

							<TabsContent
								value="overview"
								className="mt-6 flex flex-col gap-6"
							>
								<div className="grid gap-4 md:grid-cols-2">
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center gap-2">
												<Stethoscope className="h-4 w-4" />
												Profil pacient
											</CardTitle>
										</CardHeader>
										<CardContent>
											<dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
												<InfoRow
													label="Nume complet"
													value={`${patient.lastName} ${patient.firstName}`}
												/>
												<InfoRow
													label="Cod pacient"
													value={patient.patientCode}
												/>
												<InfoRow
													label="Vârstă"
													value={patient.age && `${patient.age} ani`}
												/>
												<InfoRow
													label="Sex"
													value={sexLabels[patient.sex] ?? patient.sex}
												/>
												<InfoRow
													label="Greutate"
													value={
														patient.weightKg
															? `${patient.weightKg} kg`
															: undefined
													}
												/>
												<InfoRow
													label="Înălțime"
													value={
														patient.heightCm
															? `${patient.heightCm} cm`
															: undefined
													}
												/>
												<InfoRow label="BMI" value={patient.bmi} />
												<InfoRow
													label="Naționalitate"
													value={patient.nationality}
												/>
												<InfoRow
													label="Limbă preferată"
													value={
														patient.preferredLanguage
															? (languageLabels[patient.preferredLanguage] ??
																patient.preferredLanguage)
															: undefined
													}
												/>
												<InfoRow label="Telefon" value={patient.patientPhone} />
											</dl>
										</CardContent>
									</Card>

									<Card>
										<CardHeader>
											<CardTitle className="flex items-center gap-2">
												<HeartPulse className="h-4 w-4" />
												Transplant hepatic
											</CardTitle>
										</CardHeader>
										<CardContent>
											<dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
												<InfoRow
													label="Etiologie"
													value={
														patient.etiology === "altele" &&
														patient.etiologyOther
															? `Altele · ${patient.etiologyOther}`
															: patient.etiology
													}
												/>
												<InfoRow
													label="Data transplantului"
													value={patient.transplantDate}
												/>
												<InfoRow
													label="Tip donator"
													value={
														patient.donorType
															? donorTypeLabels[patient.donorType]
															: undefined
													}
												/>
												<InfoRow
													label="Donator anti-HBc"
													value={
														patient.donorAntiHbc
															? donorStatusLabels[patient.donorAntiHbc]
															: undefined
													}
												/>
												<InfoRow
													label="Donator HBsAg"
													value={
														patient.donorHbsAg
															? donorStatusLabels[patient.donorHbsAg]
															: undefined
													}
												/>
												<InfoRow
													label="Rejet în antecedente"
													value={
														patient.rejectionHistory === undefined
															? undefined
															: patient.rejectionHistory
																? "Da"
																: "Nu"
													}
												/>
												{patient.rejectionHistory && (
													<>
														<InfoRow
															label="Data rejet"
															value={patient.rejectionDate}
														/>
														<InfoRow
															label="Tip rejet"
															value={
																patient.rejectionType
																	? rejectionTypeLabels[patient.rejectionType]
																	: undefined
															}
														/>
													</>
												)}
											</dl>
											{patient.majorComplications && (
												<>
													<Separator className="my-4" />
													<div>
														<p className="text-xs uppercase tracking-wide text-muted-foreground">
															Complicații majore post-LT
														</p>
														<p className="mt-1 text-sm">
															{patient.majorComplications}
														</p>
													</div>
												</>
											)}
										</CardContent>
									</Card>
								</div>

								<div>
									<h3 className="mb-3 text-lg font-semibold">
										Date și înregistrări
									</h3>
									<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
										{sectionLinks.map((section) => {
											const Icon = section.icon;
											return (
												<Link
													key={section.key}
													href={section.href(patient.id)}
													className="group"
												>
													<Card className="h-full transition-colors hover:border-primary hover:bg-muted/30">
														<CardHeader>
															<CardTitle className="flex items-center gap-2 text-base">
																<Icon className="h-4 w-4" />
																{section.title}
															</CardTitle>
															<CardDescription>
																{section.description}
															</CardDescription>
														</CardHeader>
													</Card>
												</Link>
											);
										})}
									</div>
								</div>
							</TabsContent>

							<TabsContent value="edit" className="mt-6">
								<Card>
									<CardHeader>
										<CardTitle>Editare detalii pacient</CardTitle>
										<CardDescription>
											Modificați datele pacientului și salvați.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<PatientEditForm
											patient={patient}
											admins={admins}
											onSaved={fetchPatient}
										/>
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					</>
				)}
			</Main>
		</>
	);
}
