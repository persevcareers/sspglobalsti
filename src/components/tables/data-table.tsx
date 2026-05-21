"use client";

import { useState, useMemo, ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Plus,
} from "lucide-react";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { tableRowVariants } from "@/lib/animations";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  cellClass?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  searchFields?: (keyof T)[];
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  pageSize?: number;
  rowKey: (item: T) => string;
  stickyHeader?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  error,
  onRetry,
  searchFields,
  searchPlaceholder = "Search...",
  emptyTitle = "No data found",
  emptyDescription = "Get started by creating your first entry.",
  emptyAction,
  pageSize: defaultPageSize = 10,
  rowKey,
  stickyHeader = true,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const filtered = useMemo(() => {
    let result = [...data];

    if (search && searchFields) {
      const q = search.toLowerCase();
      result = result.filter((item) => {
        const rec = item as Record<string, unknown>;
        return searchFields.some((field) => {
          const val = rec[field as string];
          return val != null && String(val).toLowerCase().includes(q);
        });
      });
    }

    if (sortKey) {
      result.sort((a, b) => {
        const recA = a as Record<string, unknown>;
        const recB = b as Record<string, unknown>;
        const aVal = String(recA[sortKey] ?? "").toLowerCase();
        const bVal = String(recB[sortKey] ?? "").toLowerCase();
        const cmp = aVal.localeCompare(bVal);
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [data, search, searchFields, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="mb-1 text-lg font-semibold">Failed to load data</h3>
        <p className="mb-4 text-sm text-muted-foreground">{error}</p>
        {onRetry && <Button variant="outline" onClick={onRetry}>Try Again</Button>}
      </div>
    );
  }

  if (isLoading) {
    return <TableSkeleton rows={pageSize > 10 ? 5 : pageSize} />;
  }

  return (
    <div className="space-y-3">
      {searchFields && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-9 pl-8"
            />
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      )}

      {paginated.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Layers className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">{emptyTitle}</h3>
          <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">{emptyDescription}</p>
          {emptyAction}
        </motion.div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
                  {columns.map((col) => (
                    <TableHead
                      key={col.key}
                      className={`h-10 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${col.cellClass || ""}`}
                    >
                      {col.sortable !== false ? (
                        <button
                          onClick={() => toggleSort(col.key)}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          {col.label}
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      ) : (
                        col.label
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((item, index) => (
                  <motion.tr
                    key={rowKey(item)}
                    custom={index}
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    className="group border-b transition-colors hover:bg-muted/40"
                  >
                    {columns.map((col) => (
                      <TableCell key={col.key} className={`py-3 ${col.cellClass || ""}`}>
                        {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "—")}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}
              >
                <SelectTrigger className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-0.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
