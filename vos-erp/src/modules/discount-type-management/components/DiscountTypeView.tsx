"use client";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import {
  useDiscountTypeManagement,
} from "@/modules/discount-type-management/providers/DiscountTypeManagementProvider";
import { DiscountType } from "@/modules/discount-type-management/types";
import { Button } from "@/components/ui/button";
import { DiscountTypeFormDialog } from "./DiscountTypeFormDialog";

const ActionCell = ({ row }: { row: any }) => {
  const [open, setOpen] = useState(false);
  const { provider, fetchDiscountTypes } = useDiscountTypeManagement();
  const current = row.original as DiscountType;
  return (
    <>
      <DiscountTypeFormDialog
        open={open}
        setOpen={setOpen}
        mode="edit"
        current={current}
        provider={provider}
        onSuccess={() => {
          fetchDiscountTypes();
        }}
      />
      <Button variant="outline" onClick={() => setOpen(true)}>
        Edit
      </Button>
    </>
  );
};

const columns: ColumnDef<DiscountType>[] = [
  {
    accessorKey: "discount_type",
    header: "Discount Type",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ActionCell,
  },
];

export default function DiscountTypeView() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { discountTypes } = useDiscountTypeManagement();
  const table = useReactTable({
    data: discountTypes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
