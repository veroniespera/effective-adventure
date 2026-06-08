"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/password-input";

const formSchema = z
	.object({
		password: z
			.string()
			.min(1, "Introduceți parola")
			.min(7, "Parola trebuie să aibă cel puțin 7 caractere"),
		confirmPassword: z.string().min(1, "Confirmați parola"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Parolele nu coincid",
		path: ["confirmPassword"],
	});

export function ResetPasswordForm({
	token,
	className,
	...props
}: { token: string } & React.HTMLAttributes<HTMLFormElement>) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: { password: "", confirmPassword: "" },
	});

	async function onSubmit(data: z.infer<typeof formSchema>) {
		setIsLoading(true);

		const { error } = await authClient.resetPassword({
			newPassword: data.password,
			token,
		});

		setIsLoading(false);

		if (error) {
			toast.error("Link-ul a expirat sau este invalid. Încercați din nou.");
			return;
		}

		toast.success("Parola a fost resetată cu succes!");
		router.push("/sign-in");
	}

	return (
		<Form {...form}>
			<form
				noValidate
				onSubmit={form.handleSubmit(onSubmit)}
				className={cn("grid gap-2", className)}
				{...props}
			>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Parolă nouă</FormLabel>
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
					Resetează parola
					{isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
				</Button>
			</form>
		</Form>
	);
}
