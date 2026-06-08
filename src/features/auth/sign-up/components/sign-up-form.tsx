import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signUp } from "@/lib/auth-client";
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

const formSchema = z
	.object({
		name: z.string().min(1, "Introduceți numele"),
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
		confirmPassword: z.string().min(1, "Confirmați parola"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Parolele nu se potrivesc.",
		path: ["confirmPassword"],
	});

export function SignUpForm({
	className,
	...props
}: React.HTMLAttributes<HTMLFormElement>) {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	async function onSubmit(data: z.infer<typeof formSchema>) {
		setIsLoading(true);

		const { error } = await signUp.email({
			name: data.name,
			email: data.email,
			password: data.password,
		});

		if (error) {
			setIsLoading(false);
			toast.error(authErrorMessage(error, "Eroare la crearea contului"));
			return;
		}

		toast.success("Cont creat cu succes!");
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
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nume</FormLabel>
							<FormControl>
								<Input placeholder="Ion Popescu" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
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
						<FormItem>
							<FormLabel>Parolă</FormLabel>
							<FormControl>
								<PasswordInput placeholder="********" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="confirmPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Confirmă parola</FormLabel>
							<FormControl>
								<PasswordInput placeholder="********" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button className="mt-2" disabled={isLoading}>
					Creează cont
				</Button>
			</form>
		</Form>
	);
}
