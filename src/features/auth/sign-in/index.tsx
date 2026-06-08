import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AuthLayout } from "../auth-layout";
import { UserAuthForm } from "./components/user-auth-form";

export function SignIn() {
	return (
		<AuthLayout>
			<Card className="gap-4">
				<CardHeader>
					<CardTitle className="text-lg tracking-tight">Conectare</CardTitle>
					<CardDescription>
						Introduceți adresa de e-mail și parola <br />
						pentru a vă conecta la cont. <br />
						Nu ai un cont? Contactează administratorul pentru un cont.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<UserAuthForm />
				</CardContent>
			</Card>
		</AuthLayout>
	);
}
