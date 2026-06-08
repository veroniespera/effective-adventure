"use server";

import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSessionOrThrow } from "@/lib/auth-utils";
import { isMedicRole } from "@/lib/roles";
import { db } from "@/db";
import { vitalSign } from "@/db/vital-signs-schema";
import {
	resolvePatientUserId,
	assertDoctorOwnsPatient,
	assertPatientNotPreTransplant,
} from "@/lib/patient-utils";
import { vitalEntryFormSchema } from "./data/schema";
import {
	computeVitalStatus,
	generateVitalSignAlerts,
} from "@/features/alerts/generate-alerts";
import { logAudit } from "@/lib/audit";

export async function createVitalSign(values: unknown) {
	const session = await getSessionOrThrow();
	await assertPatientNotPreTransplant(session.user.role, session.user.id);
	const parsed = vitalEntryFormSchema.safeParse(values);

	if (!parsed.success) {
		return { error: "Date invalide." };
	}

	const today = new Date().toISOString().split("T")[0];
	const status = computeVitalStatus(parsed.data);

	await db.insert(vitalSign).values({
		id: crypto.randomUUID(),
		patientId: session.user.id,
		date: today,
		status,
		...parsed.data,
	});

	if (status !== "normal") {
		await generateVitalSignAlerts(session.user.id, parsed.data);
	}

	await logAudit({
		userId: session.user.id,
		userName: session.user.name,
		userRole: session.user.role,
		action: "create",
		entity: "vital_sign",
		description: `A înregistrat semne vitale: TA ${parsed.data.systolic}/${parsed.data.diastolic}, puls ${parsed.data.pulse}, temp ${parsed.data.temperature}°C`,
	});

	revalidatePath("/vital-signs");
	revalidatePath("/alerts");
	return { success: true, status };
}

export async function updateVitalSign(id: string, values: unknown) {
	const session = await getSessionOrThrow();
	await assertPatientNotPreTransplant(session.user.role, session.user.id);
	const parsed = vitalEntryFormSchema.safeParse(values);

	if (!parsed.success) {
		return { error: "Date invalide." };
	}

	const existing = await db
		.select()
		.from(vitalSign)
		.where(and(eq(vitalSign.id, id), eq(vitalSign.patientId, session.user.id)))
		.limit(1);

	if (existing.length === 0) {
		return { error: "Înregistrarea nu a fost găsită." };
	}

	const today = new Date().toISOString().split("T")[0];
	if (existing[0].date !== today) {
		return {
			error: "Poți modifica doar înregistrările din ziua curentă.",
		};
	}

	const status = computeVitalStatus(parsed.data);

	await db
		.update(vitalSign)
		.set({ ...parsed.data, status })
		.where(eq(vitalSign.id, id));

	if (status !== "normal") {
		await generateVitalSignAlerts(session.user.id, parsed.data);
	}

	await logAudit({
		userId: session.user.id,
		userName: session.user.name,
		userRole: session.user.role,
		action: "update",
		entity: "vital_sign",
		entityId: id,
		description: `A actualizat semne vitale`,
	});

	revalidatePath("/vital-signs");
	revalidatePath("/alerts");
	return { success: true, status };
}

export async function deleteVitalSign(id: string) {
	const session = await getSessionOrThrow();

	const existing = await db
		.select()
		.from(vitalSign)
		.where(and(eq(vitalSign.id, id), eq(vitalSign.patientId, session.user.id)))
		.limit(1);

	if (existing.length === 0) {
		return { error: "Înregistrarea nu a fost găsită." };
	}

	const today = new Date().toISOString().split("T")[0];
	if (existing[0].date !== today) {
		return {
			error: "Poți șterge doar înregistrările din ziua curentă.",
		};
	}

	await db.delete(vitalSign).where(eq(vitalSign.id, id));

	await logAudit({
		userId: session.user.id,
		userName: session.user.name,
		userRole: session.user.role,
		action: "delete",
		entity: "vital_sign",
		entityId: id,
		description: `A șters o înregistrare de semne vitale`,
	});

	revalidatePath("/vital-signs");
	return { success: true };
}

export async function getVitalSigns() {
	const session = await getSessionOrThrow();

	return db
		.select()
		.from(vitalSign)
		.where(eq(vitalSign.patientId, session.user.id))
		.orderBy(desc(vitalSign.date));
}

export async function getVitalSignsByPatientId(patientId: string) {
	const session = await getSessionOrThrow();

	if (!isMedicRole(session.user.role)) {
		throw new Error("Neautorizat");
	}

	await assertDoctorOwnsPatient(session.user.role, session.user.id, patientId);
	const userId = await resolvePatientUserId(patientId);

	return db
		.select()
		.from(vitalSign)
		.where(eq(vitalSign.patientId, userId))
		.orderBy(desc(vitalSign.date));
}
