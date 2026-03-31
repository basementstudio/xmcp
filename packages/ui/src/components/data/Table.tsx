import React from "react";
import { useUiState } from "../../renderer/StateProvider.js";
import type { TableColumn } from "../../schema/types.js";
import {
  Card,
  CardContent,
  Table as BaseTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../react/index.js";
import { cn } from "../../react/utils.js";

interface TableComponentProps {
  dataKey: string;
  columns: TableColumn[];
  className?: string;
}

export function Table({ dataKey, columns, className }: TableComponentProps) {
  const rawData = useUiState(dataKey);
  const data = Array.isArray(rawData) ? rawData : [];

  if (data.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center text-sm text-slate-400">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <BaseTable>
        <TableHeader>
          <TableRow className="bg-slate-900/70 hover:bg-slate-900/70">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn("text-slate-400")}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row: Record<string, unknown>, rowIndex: number) => (
            <TableRow key={rowIndex}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {row?.[col.key] != null ? String(row[col.key]) : ""}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </BaseTable>
    </Card>
  );
}

export default Table;
