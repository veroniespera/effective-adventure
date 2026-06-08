import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { requestPasswordReset } from "../actions";

const formSchema = z.object({
	email: z.email({
		error: (iss) =>
			iss.input === ""
				? "Introduceți adresa de e-mail"
				: "Adresă de e-mail invalidă",
	}),
});

export function ForgotPasswordForm({
	className,
	...props
}: React.HTMLAttributes<HTMLFormElement>) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: { email: "" },
	});

	async function onSubmit(data: z.infer<typeof formSchema>) {
		setIsLoading(true);

		const result = await requestPasswordReset(data.email);

		setIsLoading(false);

		if (!result.success) {
			toast.error(result.error);
			return;
		}

		form.reset();
		toast.success(`E-mail trimis la ${data.email}`);
		router.push("/sign-in");
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className={cn("grid gap-2", className)}
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
				<Button className="mt-2" disabled={isLoading}>
					Continuă
					{isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
				</Button>
			</form>
		</Form>
	);
}
