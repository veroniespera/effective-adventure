"use server";

import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSessionOrThrow } from "@/lib/auth-utils";
import { isMedicRole } from "@/lib/roles";
import { db } from "@/db";
import { symptomReport } from "@/db/symptoms-schema";
import {
	resolvePatientUserId,
	assertDoctorOwnsPatient,
	assertPatientNotPreTransplant,
} from "@/lib/patient-utils";
import { symptomReportFormSchema } from "./data/schema";
import { generateSymptomAlerts } from "@/features/alerts/generate-alerts";
import { logAudit } from "@/lib/audit";

export async function createSymptomReport(values: unknown) {
	const session = await getSessionOrThrow();
	await assertPatientNotPreTransplant(session.user.role, session.user.id);
	const parsed = symptomReportFormSchema.safeParse(values);

	if (!parsed.success) {
		return { error: "Date invalide." };
	}

	const today = new Date().toISOString().split("T")[0];

	await db.insert(symptomReport).values({
		id: crypto.randomUUID(),
		patientId: session.user.id,
		date: today,
		...parsed.data,
	});

	await generateSymptomAlerts(session.user.id, parsed.data);

	await logAudit({
		userId: session.user.id,
		userName: session.user.name,
		userRole: session.user.role,
		action: "create",
		entity: "symptom_report",
		description: `A raportat simptome: ${(parsed.data.symptoms as string[]).join(", ")}`,
	});

	revalidatePath("/symptoms");
	revalidatePath("/alerts");
	return { success: true };
}

export async function updateSymptomReport(id: string, values: unknown) {
	const session = await getSessionOrThrow();
	await assertPatientNotPreTransplant(session.user.role, session.user.id);
	const parsed = symptomReportFormSchema.safeParse(values);

	if (!parsed.success) {
		return { error: "Date invalide." };
	}

	const existing = await db
		.select()
		.from(symptomReport)
		.where(
			and(
				eq(symptomReport.id, id),
				eq(symptomReport.patientId, session.user.id),
			),
		)
		.limit(1);

	if (existing.length === 0) {
		return { error: "Înregistrarea nu a fost găsită." };
	}

	const today = new Date().toISOString().split("T")[0];
	if (existing[0].date !== today) {
		return {
			error: "Poți modifica doar rapoartele din ziua curentă.",
		};
	}

	await db
		.update(symptomReport)
		.set(parsed.data)
		.where(eq(symptomReport.id, id));

	await generateSymptomAlerts(session.user.id, parsed.data);

	await logAudit({
		userId: session.user.id,
		userName: session.user.name,
		userRole: session.user.role,
		action: "update",
		entity: "symptom_report",
		entityId: id,
		description: `A actualizat raportul de simptome`,
	});

	revalidatePath("/symptoms");
	revalidatePath("/alerts");
	return { success: true };
}

export async function deleteSymptomReport(id: string) {
	const session = await getSessionOrThrow();

	const existing = await db
		.select()
		.from(symptomReport)
		.where(
			and(
				eq(symptomReport.id, id),
				eq(symptomReport.patientId, session.user.id),
			),
		)
		.limit(1);

	if (existing.length === 0) {
		return { error: "Înregistrarea nu a fost găsită." };
	}

	const today = new Date().toISOString().split("T")[0];
	if (existing[0].date !== today) {
		return {
			error: "Poți șterge doar rapoartele din ziua curentă.",
		};
	}

	await db.delete(symptomReport).where(eq(symptomReport.id, id));

	await logAudit({
		userId: session.user.id,
		userName: session.user.name,
		userRole: session.user.role,
		action: "delete",
		entity: "symptom_report",
		entityId: id,
		description: `A șters un raport de simptome`,
	});

	revalidatePath("/symptoms");
	return { success: true };
}

export async function getSymptomReports() {
	const session = await getSessionOrThrow();

	return db
		.select()
		.from(symptomReport)
		.where(eq(symptomReport.patientId, session.user.id))
		.orderBy(desc(symptomReport.date));
}

export async function getSymptomReportsByPatientId(patientId: string) {
	const session = await getSessionOrThrow();

	if (!isMedicRole(session.user.role)) {
		throw new Error("Neautorizat");
	}

	await assertDoctorOwnsPatient(session.user.role, session.user.id, patientId);

	const userId = await resolvePatientUserId(patientId);

	return db
		.select()
		.from(symptomReport)
		.where(eq(symptomReport.patientId, userId))
		.orderBy(desc(symptomReport.date));
}
