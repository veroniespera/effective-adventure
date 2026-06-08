// Maps better-auth error codes/messages (English) to Romanian, user-facing text.
// better-auth returns { code, message, status }. We key off `code` first, then
// fall back to matching the English message, then to a generic Romanian message.

type AuthErrorLike =
	| {
			code?: string | null;
			message?: string | null;
			status?: number | null;
	  }
	| null
	| undefined;

const BY_CODE: Record<string, string> = {
	INVALID_EMAIL_OR_PASSWORD: "E-mail sau parolă incorecte.",
	INVALID_PASSWORD: "Parolă incorectă.",
	INVALID_EMAIL: "Adresă de e-mail invalidă.",
	USER_NOT_FOUND: "Nu există niciun cont cu această adresă de e-mail.",
	CREDENTIAL_ACCOUNT_NOT_FOUND:
		"Nu există niciun cont cu această adresă de e-mail.",
	USER_ALREADY_EXISTS: "Există deja un cont cu această adresă de e-mail.",
	USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
		"Există deja un cont cu această adresă de e-mail.",
	EMAIL_NOT_VERIFIED: "Adresa de e-mail nu este verificată.",
	PASSWORD_TOO_SHORT: "Parola este prea scurtă.",
	PASSWORD_TOO_LONG: "Parola este prea lungă.",
	WEAK_PASSWORD: "Parola este prea slabă.",
	ACCOUNT_NOT_FOUND: "Nu există niciun cont cu această adresă de e-mail.",
	SESSION_EXPIRED: "Sesiunea a expirat. Conectează-te din nou.",
};

// Fallback matching on the English message text, in case a code is missing.
const BY_MESSAGE: [RegExp, string][] = [
	[/invalid email or password/i, "E-mail sau parolă incorecte."],
	[/invalid password/i, "Parolă incorectă."],
	[/invalid email/i, "Adresă de e-mail invalidă."],
	[
		/user not found|account not found/i,
		"Nu există niciun cont cu această adresă de e-mail.",
	],
	[/already exists/i, "Există deja un cont cu această adresă de e-mail."],
	[/not verified/i, "Adresa de e-mail nu este verificată."],
	[/too short/i, "Parola este prea scurtă."],
	[/too long/i, "Parola este prea lungă."],
	[/weak password/i, "Parola este prea slabă."],
];

export function authErrorMessage(
	error: AuthErrorLike,
	fallback = "A apărut o eroare. Încercați din nou.",
): string {
	if (!error) return fallback;
	if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];
	if (error.message) {
		for (const [re, ro] of BY_MESSAGE) {
			if (re.test(error.message)) return ro;
		}
	}
	return fallback;
}
