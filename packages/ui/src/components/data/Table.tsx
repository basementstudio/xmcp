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
        <CardContent className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <BaseTable>
        <TableHeader>
          <TableRow className="bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row: Record<string, unknown>, rowIndex: number) => (
            <TableRow
              key={
                row?.[columns[0]?.key] != null
                  ? String(row[columns[0].key])
                  : rowIndex
              }
            >
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
