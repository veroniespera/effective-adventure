import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AuthLayout } from "../auth-layout";
import { SignUpForm } from "./components/sign-up-form";

export function SignUp() {
	return (
		<AuthLayout>
			<Card className="gap-4">
				<CardHeader>
					<CardTitle className="text-lg tracking-tight">
						Creează un cont
					</CardTitle>
					<CardDescription>
						Introduceți e-mailul și parola pentru a crea un cont. <br />
						Ai deja un cont?{" "}
						<Link
							href="/sign-in"
							className="underline underline-offset-4 hover:text-primary"
						>
							Conectare
						</Link>
					</CardDescription>
				</CardHeader>
				<CardContent>
					<SignUpForm />
				</CardContent>
			</Card>
		</AuthLayout>
	);
}
