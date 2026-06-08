"use client";

import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ReferenceLine,
	ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type LabResult } from "../data/schema";

interface LabResultsChartProps {
	results: LabResult[];
	testName: string;
}

export function LabResultsChart({ results, testName }: LabResultsChartProps) {
	const chartData = results
		.slice()
		.sort((a, b) => a.date.localeCompare(b.date))
		.map((r) => {
			const test = r.tests.find((t) => t.name === testName);
			return test
				? {
						date: r.date.slice(0, 7),
						value: test.value,
						refMin: test.refMin,
						refMax: test.refMax,
					}
				: null;
		})
		.filter(Boolean) as {
		date: string;
		value: number;
		refMin: number;
		refMax: number;
	}[];

	if (chartData.length === 0) return null;
	// Plot only the most recent results so the chart stays readable as history grows.
	const RECENT = 24;
	const recent = chartData.slice(-RECENT);
	const showDots = recent.length <= 20;
	const ref = recent[0];

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{testName} — Evolutie</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={200}>
					<LineChart data={recent}>
						<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
						<XAxis
							dataKey="date"
							fontSize={11}
							tickLine={false}
							axisLine={false}
							interval="preserveStartEnd"
							minTickGap={24}
						/>
						<YAxis fontSize={11} tickLine={false} axisLine={false} />
						<Tooltip />
						<ReferenceLine
							y={ref.refMin}
							stroke="#22c55e"
							strokeDasharray="3 3"
							label={{ value: "Min", fontSize: 10 }}
						/>
						<ReferenceLine
							y={ref.refMax}
							stroke="#ef4444"
							strokeDasharray="3 3"
							label={{ value: "Max", fontSize: 10 }}
						/>
						<Line
							type="monotone"
							dataKey="value"
							stroke="hsl(var(--primary))"
							strokeWidth={2}
							dot={showDots ? { r: 4, fill: "hsl(var(--primary))" } : false}
						/>
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
