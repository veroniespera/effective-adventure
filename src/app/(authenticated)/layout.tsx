"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { DirectionProvider } from "@/context/direction-provider";
import { ThemeProvider } from "@/context/theme-provider";
import { useSession } from "@/lib/auth-client";
import { Toaster } from "@/components/ui/sonner";

import { Suspense } from "react";
import { PromptBannerSlot } from "@/components/pwa/prompt-banner-slot";
import { ThemeColorMeta } from "@/components/theme-color-meta";

export default function AuthenticatedRootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const router = useRouter();
	const { data: session, isPending } = useSession();

	useEffect(() => {
		if (!isPending && !session) {
			router.replace("/sign-in");
		}
	}, [session, isPending, router]);

	if (isPending || !session) return null;

	return (
		<Suspense>
			<ThemeProvider>
				<ThemeColorMeta />
				<DirectionProvider>
					<AuthenticatedLayout>
						<PromptBannerSlot />
						{children}
					</AuthenticatedLayout>
					<Toaster richColors closeButton />
				</DirectionProvider>
			</ThemeProvider>
		</Suspense>
	);
}
