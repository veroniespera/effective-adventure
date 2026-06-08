"use client";

import { useRouter } from "next/navigation";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ReferenceLine,
	ResponsiveContainer,
	Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PatientSummary {
	id: string;
	name: string;
	status: "activ" | "inactiv";
	complianceRate: number;
	hasMedication: boolean;
}

interface ComplianceChartProps {
	patients: PatientSummary[];
}

export function ComplianceChart({ patients }: ComplianceChartProps) {
	const router = useRouter();
	// Only patients that actually have a medication regimen with logged doses.
	// Patients without medication (e.g. pre-transplant) would otherwise show a
	// misleading 100% bar.
	const chartData = patients
		.filter((p) => p.status === "activ" && p.hasMedication)
		.map((p) => ({
			id: p.id,
			name: p.name,
			rate: p.complianceRate,
		}));

	// Keep bars readable when there are many patients: give the chart a minimum
	// width (~52px/bar) and let the card scroll horizontally on small screens.
	const minWidth = Math.max(chartData.length * 52, 320);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">
					Rata de conformitate medicație
				</CardTitle>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						Niciun pacient cu tratament înregistrat.
					</p>
				) : (
					<div className="overflow-x-auto">
						<div style={{ minWidth }}>
							<ResponsiveContainer width="100%" height={240}>
								<BarChart data={chartData} barSize={32} margin={{ bottom: 40 }}>
									<CartesianGrid
										strokeDasharray="3 3"
										className="stroke-border"
									/>
									<XAxis
										dataKey="name"
										fontSize={12}
										tickLine={false}
										axisLine={false}
										interval={0}
										angle={-25}
										textAnchor="end"
									/>
									<YAxis
										fontSize={12}
										tickLine={false}
										axisLine={false}
										domain={[0, 100]}
										unit="%"
									/>
									<Tooltip formatter={(v) => [`${v}%`, "Conformitate"]} />
									<ReferenceLine
										y={90}
										stroke="#22c55e"
										strokeDasharray="4 4"
									/>
									<Bar
										dataKey="rate"
										radius={[4, 4, 0, 0]}
										cursor="pointer"
										onClick={(data) => {
											const id = (data as { id?: string }).id;
											if (id) router.push(`/patients/${id}`);
										}}
									>
										{chartData.map((entry, index) => (
											<Cell
												key={index}
												fill={
													entry.rate >= 90
														? "#22c55e"
														: entry.rate >= 70
															? "#f97316"
															: "#ef4444"
												}
											/>
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
