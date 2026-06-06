import { type ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table";

export type AuditLogRow = {
	id: string;
	userId: string;
	userName: string;
	userRole: string;
	action: "create" | "update" | "delete";
	entity: string;
	entityId: string | null;
	description: string;
	metadata: unknown;
	createdAt: Date;
};

const actionStyles: Record<string, string> = {
	create: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
	update: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
	delete: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const actionLabels: Record<string, string> = {
	create: "Creare",
	update: "Modificare",
	delete: "Ștergere",
};

const entityLabels: Record<string, string> = {
	patient: "Pacient",
	doctor: "Medic",
	medication: "Medicație",
	medication_log: "Jurnal medicație",
	vital_sign: "Semne vitale",
	symptom_report: "Raport simptome",
	lab_result: "Rezultat laborator",
	clinical_note: "Notă clinică",
	alert: "Alertă",
	notification: "Notificare",
	message: "Mesaj",
	journal_entry: "Jurnal",
	appointment: "Programare",
};

const roleLabels: Record<string, string> = {
	admin: "Admin",
	doctor: "Medic",
	user: "Pacient",
};

export function getAuditLogColumns(): ColumnDef<AuditLogRow>[] {
	return [
		{
			accessorKey: "createdAt",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Data" />
			),
			cell: ({ row }) => {
				const date = row.getValue("createdAt") as Date;
				return (
					<div className="whitespace-nowrap text-sm">
						{new Date(date).toLocaleDateString("ro-RO", {
							day: "2-digit",
							month: "short",
							year: "numeric",
						})}{" "}
						<span className="text-muted-foreground">
							{new Date(date).toLocaleTimeString("ro-RO", {
								hour: "2-digit",
								minute: "2-digit",
							})}
						</span>
					</div>
				);
			},
			enableHiding: false,
		},
		{
			accessorKey: "userName",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Utilizator" />
			),
			cell: ({ row }) => (
				<div>
					<div className="font-medium">{row.getValue("userName")}</div>
					<div className="text-xs text-muted-foreground">
						{roleLabels[row.original.userRole] ?? row.original.userRole}
					</div>
				</div>
			),
		},
		{
			accessorKey: "action",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Acțiune" />
			),
			cell: ({ row }) => {
				const action = row.getValue("action") as string;
				return (
					<Badge
						variant="outline"
						className={cn("capitalize", actionStyles[action])}
					>
						{actionLabels[action] ?? action}
					</Badge>
				);
			},
			filterFn: (row, id, value) => value.includes(row.getValue(id)),
		},
		{
			accessorKey: "entity",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Entitate" />
			),
			cell: ({ row }) => {
				const entity = row.getValue("entity") as string;
				return (
					<span className="text-sm">{entityLabels[entity] ?? entity}</span>
				);
			},
			filterFn: (row, id, value) => value.includes(row.getValue(id)),
		},
		{
			accessorKey: "description",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Descriere" />
			),
			cell: ({ row }) => (
				<div className="max-w-[150px] truncate text-sm sm:max-w-[250px] md:max-w-[400px]">
					{row.getValue("description")}
				</div>
			),
			enableSorting: false,
		},
	];
}
