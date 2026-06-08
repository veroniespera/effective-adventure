"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { FileUp, Upload, X, CheckCircle2 } from "lucide-react";
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
	getDoctorPatients,
	createLabResultWithPdf,
	getSentLabResults,
	deleteSentLabResult,
} from "./actions";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Trash2, FileText } from "lucide-react";
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

interface PatientOption {
	id: string;
	userId: string | null;
	firstName: string;
	lastName: string;
	patientCode: string;
}

interface SentResult {
	id: string;
	date: string;
	pdfFileName: string | null;
	createdAt: Date;
	patientName: string;
	patientEmail: string;
}

export function SendLabResults() {
	const [patients, setPatients] = useState<PatientOption[]>([]);
	const [sentResults, setSentResults] = useState<SentResult[]>([]);
	const [loading, setLoading] = useState(true);
	const [isPending, startTransition] = useTransition();

	const [selectedPatientId, setSelectedPatientId] = useState("");
	const [date, setDate] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [dragActive, setDragActive] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const loadData = useCallback(() => {
		Promise.all([getDoctorPatients(), getSentLabResults()])
			.then(([p, r]) => {
				setPatients(p);
				setSentResults(r);
			})
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const handleDrag = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	}, []);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		const droppedFile = e.dataTransfer.files[0];
		if (droppedFile?.type === "application/pdf") {
			setFile(droppedFile);
		} else {
			toast.error("Doar fișiere PDF sunt acceptate.");
		}
	}, []);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selected = e.target.files?.[0];
		if (selected) {
			if (selected.type !== "application/pdf") {
				toast.error("Doar fișiere PDF sunt acceptate.");
				return;
			}
			setFile(selected);
		}
	};

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		if (!selectedPatientId) {
			toast.error("Selectați un pacient.");
			return;
		}
		if (!date) {
			toast.error("Selectați data recoltării.");
			return;
		}
		if (!file) {
			toast.error("Încărcați un fișier PDF.");
			return;
		}

		const patient = patients.find((p) => p.id === selectedPatientId);
		if (!patient?.userId) {
			toast.error("Pacientul nu are cont de utilizator asociat.");
			return;
		}
		const patientUserId = patient.userId;

		startTransition(async () => {
			// Upload the file
			const formData = new FormData();
			formData.append("file", file);

			const uploadRes = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			if (!uploadRes.ok) {
				const err = await uploadRes.json();
				toast.error(err.error || "Eroare la încărcarea fișierului.");
				return;
			}

			const { fileName } = await uploadRes.json();

			// Create lab result record
			const result = await createLabResultWithPdf({
				patientId: patientUserId,
				date,
				pdfFileName: fileName,
			});

			if (result.error) {
				toast.error(result.error);
				return;
			}

			toast.success("Rezultatele au fost trimise cu succes.");
			setSelectedPatientId("");
			setDate("");
			setFile(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			loadData();
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
					<h2 className="text-2xl font-bold tracking-tight">
						Trimitere Rezultate Laborator
					</h2>
					<p className="text-muted-foreground">
						Încărcați rezultatele analizelor în format PDF pentru pacienți.
					</p>
				</div>

				{loading ? (
					<div className="flex flex-1 items-center justify-center">
						<Spinner className="size-6" />
					</div>
				) : (
					<>
						<Card className="max-w-2xl">
							<CardHeader>
								<CardTitle>Încărcare PDF analize</CardTitle>
								<CardDescription>
									Selectați pacientul, data recoltării și fișierul PDF cu
									rezultatele.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form noValidate onSubmit={handleSubmit} className="space-y-6">
									<div className="space-y-1.5">
										<Label htmlFor="patient">Pacient</Label>
										<Select
											value={selectedPatientId}
											onValueChange={setSelectedPatientId}
										>
											<SelectTrigger id="patient" className="w-full">
												<SelectValue placeholder="Selectați pacientul" />
											</SelectTrigger>
											<SelectContent>
												{patients.map((p) => (
													<SelectItem key={p.id} value={p.id}>
														{p.lastName} {p.firstName} — {p.patientCode}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-1.5">
										<Label htmlFor="date">Data recoltării</Label>
										<Input
											id="date"
											type="date"
											value={date}
											onChange={(e) => setDate(e.target.value)}
										/>
									</div>

									<div className="space-y-1.5">
										<Label>Fișier PDF</Label>
										<div
											className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
												dragActive
													? "border-primary bg-primary/5"
													: file
														? "border-green-500 bg-green-50 dark:bg-green-950/20"
														: "border-muted-foreground/25 hover:border-muted-foreground/50"
											}`}
											onDragEnter={handleDrag}
											onDragLeave={handleDrag}
											onDragOver={handleDrag}
											onDrop={handleDrop}
										>
											{file ? (
												<div className="flex flex-col items-center gap-2">
													<CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
													<p className="text-sm font-medium">{file.name}</p>
													<p className="text-muted-foreground text-xs">
														{(file.size / 1024 / 1024).toFixed(2)} MB
													</p>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => {
															setFile(null);
															if (fileInputRef.current)
																fileInputRef.current.value = "";
														}}
													>
														<X className="mr-1 h-4 w-4" />
														Șterge fișierul
													</Button>
												</div>
											) : (
												<div className="flex flex-col items-center gap-2">
													<FileUp className="text-muted-foreground h-10 w-10" />
													<p className="text-sm font-medium">
														Trageți fișierul PDF aici
													</p>
													<p className="text-muted-foreground text-xs">
														sau apăsați pentru a selecta (max 10 MB)
													</p>
													<Button
														type="button"
														variant="outline"
														size="sm"
														className="mt-2"
														onClick={() => fileInputRef.current?.click()}
													>
														<Upload className="mr-1 h-4 w-4" />
														Selectați fișierul
													</Button>
												</div>
											)}
											<input
												ref={fileInputRef}
												type="file"
												accept="application/pdf"
												className="hidden"
												onChange={handleFileChange}
											/>
										</div>
									</div>

									<Button type="submit" className="w-full" disabled={isPending}>
										{isPending ? "Se trimite..." : "Trimite rezultatele"}
									</Button>
								</form>
							</CardContent>
						</Card>

						{sentResults.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle>Istoric rezultate trimise</CardTitle>
									<CardDescription>
										Toate rezultatele de laborator trimise ca PDF.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Pacient</TableHead>
												<TableHead>Data recoltării</TableHead>
												<TableHead>Trimis la</TableHead>
												<TableHead>Fișier</TableHead>
												<TableHead className="w-[50px]" />
											</TableRow>
										</TableHeader>
										<TableBody>
											{sentResults.map((r) => (
												<TableRow key={r.id}>
													<TableCell className="font-medium">
														{r.patientName}
													</TableCell>
													<TableCell>{r.date}</TableCell>
													<TableCell>
														{new Date(r.createdAt).toLocaleDateString("ro-RO")}
													</TableCell>
													<TableCell>
														{r.pdfFileName && (
															<a
																href={`/api/files/lab-results/${r.pdfFileName}`}
																target="_blank"
																rel="noopener noreferrer"
																className="text-primary inline-flex items-center gap-1 hover:underline"
															>
																<FileText className="h-4 w-4" />
																PDF
															</a>
														)}
													</TableCell>
													<TableCell>
														<AlertDialog>
															<AlertDialogTrigger asChild>
																<Button
																	variant="ghost"
																	size="icon"
																	className="text-destructive h-8 w-8"
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		Ștergi acest rezultat?
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		Această acțiune este permanentă și nu poate
																		fi anulată.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>
																		Anulează
																	</AlertDialogCancel>
																	<AlertDialogAction
																		onClick={() => {
																			startTransition(async () => {
																				const res = await deleteSentLabResult(
																					r.id,
																				);
																				if (res.success) {
																					toast.success(
																						"Rezultatul a fost șters.",
																					);
																					loadData();
																				}
																			});
																		}}
																		className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
																	>
																		Șterge
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</CardContent>
							</Card>
						)}
					</>
				)}
			</Main>
		</>
	);
}
