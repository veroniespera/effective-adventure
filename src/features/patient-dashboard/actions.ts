"use server";

import { eq } from "drizzle-orm";
import { getSessionOrThrow } from "@/lib/auth-utils";
import { db } from "@/db";
import { medication } from "@/db/medication-schema";
import { conversation } from "@/db/messaging-schema";
import { patient } from "@/db/patient-schema";
import { doctor } from "@/db/doctor-schema";
import { user } from "@/db/auth-schema";
import { vitalSign } from "@/db/vital-signs-schema";
import { desc } from "drizzle-orm";
import { isPreTransplant } from "@/lib/transplant-status";
import { getNotificationsForPatient } from "@/features/notifications/actions";

export async function getPatientDashboardData() {
	const session = await getSessionOrThrow();
	const userId = session.user.id;

	// Latest vital sign
	const vitals = await db
		.select()
		.from(vitalSign)
		.where(eq(vitalSign.patientId, userId))
		.orderBy(desc(vitalSign.date))
		.limit(1);

	const latestVital = vitals.length > 0 ? vitals[0] : null;

	// Active medications count
	const meds = await db
		.select()
		.from(medication)
		.where(eq(medication.patientId, userId));

	const activeMeds = meds.filter((m) => {
		if (!m.endDate) return true;
		return new Date(m.endDate) >= new Date();
	});

	// Unread messages from conversations
	const convs = await db
		.select()
		.from(conversation)
		.where(eq(conversation.patientId, userId));

	const unreadMessages = convs.reduce(
		(sum, c) => sum + (c.unreadCount ?? 0),
		0,
	);

	// Doctor name and phone
	let doctorName = "";
	let doctorPhone: string | null = null;
	const patientRecord = await db
		.select({
			doctorId: patient.doctorId,
			transplantDate: patient.transplantDate,
		})
		.from(patient)
		.where(eq(patient.userId, userId))
		.limit(1);

	const preTransplant = isPreTransplant(patientRecord[0]?.transplantDate);

	if (patientRecord.length > 0 && patientRecord[0].doctorId) {
		const doctorUser = await db
			.select({ name: user.name })
			.from(user)
			.where(eq(user.id, patientRecord[0].doctorId))
			.limit(1);
		if (doctorUser.length > 0) {
			doctorName = doctorUser[0].name;
		}
		const doctorRecord = await db
			.select({ phone: doctor.phone })
			.from(doctor)
			.where(eq(doctor.userId, patientRecord[0].doctorId))
			.limit(1);
		if (doctorRecord.length > 0) {
			doctorPhone = doctorRecord[0].phone;
		}
	}

	// Pre-transplant patients can't access vitals/meds/symptoms/labs/journal,
	// so surface what they DO have instead: notifications + upcoming appointments.
	let unreadNotifications = 0;
	let nextAppointment: { title: string; scheduledAt: Date } | null = null;
	if (preTransplant) {
		const notifs = await getNotificationsForPatient();
		unreadNotifications = notifs.filter((n) => !n.read).length;
		const now = Date.now();
		const upcoming = notifs
			.filter((n) => n.scheduledAt && new Date(n.scheduledAt).getTime() >= now)
			.sort(
				(a, b) =>
					new Date(a.scheduledAt as Date).getTime() -
					new Date(b.scheduledAt as Date).getTime(),
			);
		if (upcoming[0]?.scheduledAt) {
			nextAppointment = {
				title: upcoming[0].title,
				scheduledAt: upcoming[0].scheduledAt,
			};
		}
	}

	return {
		isPreTransplant: preTransplant,
		latestVital: latestVital
			? {
					systolic: latestVital.systolic,
					diastolic: latestVital.diastolic,
					date: latestVital.date,
				}
			: null,
		activeMedsCount: activeMeds.length,
		unreadMessages,
		unreadNotifications,
		nextAppointment,
		doctorName,
		doctorPhone,
	};
}
