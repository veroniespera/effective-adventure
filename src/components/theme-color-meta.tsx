"use client";

import { useEffect } from "react";
import { useTheme } from "@/context/theme-provider";

/**
 * Keeps the phone status/address bar (`<meta name="theme-color">`) in sync with
 * the app's actual background, following the in-app theme (light/dark/system)
 * rather than the OS scheme. Reads the real computed background color so it
 * matches exactly whatever the theme uses.
 */
export function ThemeColorMeta() {
	const { resolvedTheme } = useTheme();

	useEffect(() => {
		const id = requestAnimationFrame(() => {
			const read = (el: Element) => getComputedStyle(el).backgroundColor;
			let bg = read(document.body);
			if (!bg || bg === "rgba(0, 0, 0, 0)" || bg === "transparent") {
				bg = read(document.documentElement);
			}
			// The computed color may be in lab()/oklch() form (theme tokens use
			// oklch). Normalize to #rrggbb via canvas for broad mobile support.
			const ctx = document.createElement("canvas").getContext("2d");
			if (ctx) {
				ctx.fillStyle = bg;
				bg = ctx.fillStyle;
			}
			let meta = document.querySelector<HTMLMetaElement>(
				'meta[name="theme-color"]',
			);
			if (!meta) {
				meta = document.createElement("meta");
				meta.setAttribute("name", "theme-color");
				document.head.appendChild(meta);
			}
			meta.setAttribute("content", bg);
		});
		return () => cancelAnimationFrame(id);
	}, [resolvedTheme]);

	return null;
}
