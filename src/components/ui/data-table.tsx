'use client';

import React, { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';
import { EmptyState } from './empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  cell?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T extends { _id?: string }> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
}

function getValue<T>(row: T, key: string): unknown {
  return key.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, row);
}

type SortDirection = 'asc' | 'desc';

export function DataTable<T extends { _id?: string }>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data available.',
  className,
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const av = getValue(a, sortKey);
    const bv = getValue(b, sortKey);
    const cmp = String(av ?? '').localeCompare(String(bv ?? ''));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border', className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-neutral-50">
            {columns.map((col) => (
              <TableHead
                key={String(col.key)}
                className={cn(col.className, col.sortable && 'cursor-pointer select-none')}
                onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable &&
                    sortKey === String(col.key) &&
                    (sortDir === 'asc' ? (
                      <ChevronUpIcon className="size-3" />
                    ) : (
                      <ChevronDownIcon className="size-3" />
                    ))}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-12 text-center">
                <Spinner className="mx-auto" />
              </TableCell>
            </TableRow>
          ) : sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-12">
                <EmptyState title={emptyMessage} />
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((row, i) => (
              <TableRow
                key={row._id ?? i}
                className={cn(onRowClick && 'cursor-pointer hover:bg-primary-light/50')}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <TableCell key={String(col.key)} className={col.className}>
                    {col.cell
                      ? col.cell(getValue(row, String(col.key)), row)
                      : String(getValue(row, String(col.key)) ?? '—')}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
