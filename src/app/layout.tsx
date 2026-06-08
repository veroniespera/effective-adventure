import type { Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// Default for first paint; ThemeColorMeta then syncs it to the in-app theme's
// real background color (light/dark/system) at runtime.
export const viewport: Viewport = {
	themeColor: "#ffffff",
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
