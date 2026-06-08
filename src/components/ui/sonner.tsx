import { Toaster as Sonner, ToasterProps } from "sonner";
import { useTheme } from "@/context/theme-provider";

export function Toaster({ ...props }: ToasterProps) {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group [&_div[data-content]]:w-full"
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					// success uses the blue accent, error a pastel pink (see globals.css).
					// Borders stay neutral so the popups don't get a colored outline.
					"--success-bg": "var(--toast-success-bg)",
					"--success-border": "var(--border)",
					"--success-text": "var(--toast-success-text)",
					"--error-bg": "var(--toast-error-bg)",
					"--error-border": "var(--border)",
					"--error-text": "var(--toast-error-text)",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
}
