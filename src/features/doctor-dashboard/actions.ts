"use server";

import { eq, inArray, desc, and, gt, lte, asc, isNotNull } from "drizzle-orm";
import { getSessionOrThrow } from "@/lib/auth-utils";
import { isMedicRole } from "@/lib/roles";
import { db } from "@/db";
import { patient } from "@/db/patient-schema";
import { alert } from "@/db/alert-schema";
import { medication, medicationLog } from "@/db/medication-schema";
import { conversation } from "@/db/messaging-schema";
import { notification } from "@/db/notification-schema";

export async function getDoctorDashboardData() {
	const session = await getSessionOrThrow();
	if (!isMedicRole(session.user.role)) {
		throw new Error("Neautorizat");
	}

	// Fetch patients (admin sees all, doctor sees own)
	const patients =
		session.user.role === "admin"
			? await db.select().from(patient)
			: await db
					.select()
					.from(patient)
					.where(eq(patient.doctorId, session.user.id));

	const patientUserIds = patients
		.map((p) => p.userId)
		.filter((id): id is string => id !== null);

	// Fetch alerts for these patients
	const alerts =
		patientUserIds.length > 0
			? await db
					.select()
					.from(alert)
					.where(inArray(alert.patientId, patientUserIds))
					.orderBy(desc(alert.createdAt))
			: [];

	// Compute compliance per patient from medication logs
	const patientSummaries = await Promise.all(
		patients.map(async (p) => {
			if (!p.userId) {
				return {
					id: p.id,
					name: `${p.firstName} ${p.lastName}`,
					age: p.age ?? undefined,
					transplantDate: p.transplantDate ?? undefined,
					status: p.status as "activ" | "inactiv",
					activeAlerts: 0,
					complianceRate: 0,
					hasMedication: false,
				};
			}

			// Count active alerts for this patient
			const patientAlerts = alerts.filter(
				(a) => a.patientId === p.userId && !a.dismissed,
			);

			// Compute compliance from medication logs
			const meds = await db
				.select({ id: medication.id })
				.from(medication)
				.where(eq(medication.patientId, p.userId));

			let complianceRate = 100;
			let hasMedication = false;
			const medIds = meds.map((m) => m.id);
			if (medIds.length > 0) {
				const logs = await db
					.select()
					.from(medicationLog)
					.where(inArray(medicationLog.medicationId, medIds));

				if (logs.length > 0) {
					hasMedication = true;
					const taken = logs.filter((l) => l.status === "luat").length;
					complianceRate = Math.round((taken / logs.length) * 100);
				}
			}

			return {
				id: p.id,
				name: `${p.firstName} ${p.lastName}`,
				age: p.age ?? undefined,
				transplantDate: p.transplantDate ?? undefined,
				status: p.status as "activ" | "inactiv",
				activeAlerts: patientAlerts.length,
				complianceRate,
				hasMedication,
			};
		}),
	);

	const recentConversations =
		patientUserIds.length > 0
			? await db
					.select({
						id: conversation.id,
						patientId: conversation.patientId,
						patientName: conversation.patientName,
						lastMessage: conversation.lastMessage,
						lastMessageAt: conversation.lastMessageAt,
						unreadCount: conversation.unreadCount,
					})
					.from(conversation)
					.where(inArray(conversation.patientId, patientUserIds))
					.orderBy(desc(conversation.lastMessageAt))
					.limit(5)
			: [];

	const now = new Date();
	const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
	const baseAppointmentFilters = and(
		isNotNull(notification.scheduledAt),
		gt(notification.scheduledAt, now),
		lte(notification.scheduledAt, sevenDaysAhead),
	);
	const upcomingAppointments = await db
		.select({
			id: notification.id,
			title: notification.title,
			message: notification.message,
			scheduledAt: notification.scheduledAt,
			targetType: notification.targetType,
			targetValue: notification.targetValue,
		})
		.from(notification)
		.where(
			session.user.role === "admin"
				? baseAppointmentFilters
				: and(
						baseAppointmentFilters,
						eq(notification.createdBy, session.user.id),
					),
		)
		.orderBy(asc(notification.scheduledAt))
		.limit(5);

	return {
		patients: patientSummaries,
		alerts,
		recentConversations,
		upcomingAppointments,
	};
}
