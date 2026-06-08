"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { createClinicalNote } from "../actions";

interface NotesFormProps {
	patientId: string;
	onSuccess?: () => void;
}

export function NotesForm({ patientId, onSuccess }: NotesFormProps) {
	const [isPending, startTransition] = useTransition();
	const [submitted, setSubmitted] = useState(false);
	const [visitDate, setVisitDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [content, setContent] = useState("");

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		startTransition(async () => {
			const result = await createClinicalNote(patientId, {
				visitDate,
				content,
			});
			if (result.error) {
				toast.error(result.error);
				return;
			}
			toast.success("Nota a fost salvată cu succes.");
			setContent("");
			setSubmitted(true);
			setTimeout(() => setSubmitted(false), 4000);
			onSuccess?.();
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Notă clinică nouă</CardTitle>
				<CardDescription>
					Adăugați observații clinice pentru această vizită.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{submitted && (
					<div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
						Nota a fost salvată cu succes.
					</div>
				)}
				<form noValidate onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="visitDate">Data vizitei</Label>
						<Input
							id="visitDate"
							type="date"
							value={visitDate}
							onChange={(e) => setVisitDate(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="content">Observații clinice</Label>
						<Textarea
							id="content"
							placeholder="Descrieți starea pacientului, evoluția, recomandările..."
							rows={6}
							required
							value={content}
							onChange={(e) => setContent(e.target.value)}
						/>
					</div>
					<Button type="submit" disabled={isPending}>
						{isPending ? "Se salvează..." : "Salvează nota"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
