import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";
import { authErrorMessage } from "@/features/auth/auth-errors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";

const formSchema = z.object({
	email: z.email({
		error: (iss) =>
			iss.input === ""
				? "Introduceți adresa de e-mail"
				: "Adresă de e-mail invalidă",
	}),
	password: z
		.string()
		.min(1, "Introduceți parola")
		.min(7, "Parola trebuie să aibă cel puțin 7 caractere"),
});

type UserAuthFormProps = React.HTMLAttributes<HTMLFormElement>;

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	async function onSubmit(data: z.infer<typeof formSchema>) {
		setIsLoading(true);

		const { error } = await signIn.email({
			email: data.email.trim(),
			password: data.password.trim(),
		});

		if (error) {
			setIsLoading(false);
			toast.error(authErrorMessage(error, "Eroare la conectare"));
			return;
		}

		toast.success(`Bun venit înapoi!`);
		router.replace("/");
		setIsLoading(false);
	}

	return (
		<Form {...form}>
			<form
				noValidate
				onSubmit={form.handleSubmit(onSubmit)}
				className={cn("grid gap-3", className)}
				{...props}
			>
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>E-mail</FormLabel>
							<FormControl>
								<Input placeholder="nume@exemplu.com" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem className="relative">
							<FormLabel>Parolă</FormLabel>
							<FormControl>
								<PasswordInput placeholder="********" {...field} />
							</FormControl>
							<FormMessage />
							<Link
								href="/forgot-password"
								className="absolute end-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75"
							>
								Ai uitat parola?
							</Link>
						</FormItem>
					)}
				/>
				<Button className="mt-2" disabled={isLoading}>
					{isLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
					Conectare
				</Button>
			</form>
		</Form>
	);
}
