import type { Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// Default for first paint; ThemeColorMeta then syncs it to the in-app theme's
// real background color (light/dark/system) at runtime.
export const viewport: Viewport = {
	themeColor: "#ffffff",
	// Let content reach into the safe-area insets so the area near the phone's
	// bottom bar shows the app background instead of a black band (where the OS
	// allows — iOS / installed PWA).
	viewportFit: "cover",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={inter.variable}>
			<body className={`${inter.variable} antialiased`}>{children}</body>
		</html>
	);
}
