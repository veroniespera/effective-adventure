"use server";

import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/auth-schema";

export async function requestPasswordReset(email: string) {
	const normalized = email.trim();

	// The user asked for explicit feedback when the address has no account,
	// so we check existence first (case-insensitive). Note: this intentionally
	// allows account enumeration, which better-auth otherwise avoids.
	const existing = await db
		.select({ id: user.id })
		.from(user)
		.where(sql`lower(${user.email}) = lower(${normalized})`)
		.limit(1);

	if (existing.length === 0) {
		return {
			success: false as const,
			error:
				"Nu există niciun cont cu această adresă de e-mail. Verifică dacă ai scris-o corect.",
		};
	}

	try {
		await auth.api.requestPasswordReset({
			body: {
				email: normalized,
				redirectTo: "/reset-password",
			},
			headers: await headers(),
		});

		return { success: true as const };
	} catch {
		return {
			success: false as const,
			error: "A apărut o eroare. Încercați din nou.",
		};
	}
}
