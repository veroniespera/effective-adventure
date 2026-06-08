"use client";

import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type VitalEntry } from "../data/schema";

interface VitalSignsChartProps {
	data: VitalEntry[];
}

const RECENT = 30;

export function VitalSignsChart({ data }: VitalSignsChartProps) {
	// Keep the trend readable no matter how much history accumulates: plot only
	// the most recent measurements (full history stays in the table below).
	const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
	const chartData = sorted.slice(-RECENT).map((e) => ({
		date: e.date.slice(5),
		sistolica: e.systolic,
		diastolica: e.diastolic,
		puls: e.pulse,
		temperatura: e.temperature,
	}));
	const showDots = chartData.length <= 20;
	const trimmed = data.length > RECENT;

	return (
		<div className="grid gap-4 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Tensiune arteriala</CardTitle>
					{trimmed && (
						<p className="text-xs text-muted-foreground">
							Ultimele {RECENT} măsurători
						</p>
					)}
				</CardHeader>
				<CardContent>
					<ResponsiveContainer width="100%" height={220}>
						<LineChart data={chartData}>
							<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
							<XAxis
								dataKey="date"
								fontSize={11}
								tickLine={false}
								axisLine={false}
								interval="preserveStartEnd"
								minTickGap={24}
							/>
							<YAxis
								fontSize={11}
								tickLine={false}
								axisLine={false}
								domain={[60, 160]}
							/>
							<Tooltip />
							<Legend />
							<Line
								type="monotone"
								dataKey="sistolica"
								stroke="hsl(var(--primary))"
								strokeWidth={2}
								dot={showDots ? { r: 4, fill: "hsl(var(--primary))" } : false}
								activeDot={{ r: 6 }}
							/>
							<Line
								type="monotone"
								dataKey="diastolica"
								stroke="hsl(var(--muted-foreground))"
								strokeWidth={2}
								dot={
									showDots
										? { r: 4, fill: "hsl(var(--muted-foreground))" }
										: false
								}
								activeDot={{ r: 6 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Puls (bpm)</CardTitle>
					{trimmed && (
						<p className="text-xs text-muted-foreground">
							Ultimele {RECENT} măsurători
						</p>
					)}
				</CardHeader>
				<CardContent>
					<ResponsiveContainer width="100%" height={220}>
						<LineChart data={chartData}>
							<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
							<XAxis
								dataKey="date"
								fontSize={11}
								tickLine={false}
								axisLine={false}
								interval="preserveStartEnd"
								minTickGap={24}
							/>
							<YAxis
								fontSize={11}
								tickLine={false}
								axisLine={false}
								domain={[50, 120]}
							/>
							<Tooltip />
							<Line
								type="monotone"
								dataKey="puls"
								stroke="hsl(var(--primary))"
								strokeWidth={2}
								dot={showDots ? { r: 4, fill: "hsl(var(--primary))" } : false}
								activeDot={{ r: 6 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>
		</div>
	);
}
