"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/features/auth/auth-errors";
import { sendPasswordChangedEmail } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ChangePasswordDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({
	open,
	onOpenChange,
}: ChangePasswordDialogProps) {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isPending, startTransition] = useTransition();

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (newPassword.length < 7) {
			toast.error("Parola nouă trebuie să aibă cel puțin 7 caractere.");
			return;
		}

		if (newPassword !== confirmPassword) {
			toast.error("Parolele nu coincid.");
			return;
		}

		startTransition(async () => {
			const { error } = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: false,
			});

			if (error) {
				const msg =
					error.code === "INVALID_PASSWORD" ||
					error.message === "Invalid password"
						? "Parola curentă este incorectă."
						: authErrorMessage(error, "Eroare la schimbarea parolei.");
				toast.error(msg);
				return;
			}

			await sendPasswordChangedEmail();
			toast.success("Parola a fost schimbată cu succes!");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			onOpenChange(false);
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Schimbă parola</DialogTitle>
					<DialogDescription>
						Introduceți parola curentă și noua parolă.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="current-password">Parola curentă</Label>
						<Input
							id="current-password"
							type="password"
							required
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="new-password">Parola nouă</Label>
						<Input
							id="new-password"
							type="password"
							required
							minLength={7}
							placeholder="Minim 7 caractere"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirm-password">Confirmă parola nouă</Label>
						<Input
							id="confirm-password"
							type="password"
							required
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Anulează
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Se salvează..." : "Salvează"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
