import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Transplant Care",
		short_name: "TransplantCare",
		description: "Aplicație pentru gestionarea îngrijirii post-transplant",
		start_url: "/",
		display: "standalone",
		// Lets getInstalledRelatedApps() report this PWA as installed, so the
		// app can show "open in app" instead of "install" when already installed.
		prefer_related_applications: false,
		related_applications: [
			{
				platform: "webapp",
				url: "https://transplant-care.vercel.app/manifest.webmanifest",
			},
		],
		background_color: "#ffffff",
		theme_color: "#ffffff",
		icons: [
			{
				src: "/icon-192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/icon-512x512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
	};
}
