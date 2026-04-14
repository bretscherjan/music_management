import * as React from "react"
import { cn } from "@/lib/utils"

const Table = React.forwardRef<
    HTMLTableElement,
    React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
        <table
            ref={ref}
            className={cn("w-full caption-bottom text-sm", className)}
            {...props}
        />
    </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("sticky top-0 z-10 bg-card [&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className={cn("[&_tr:last-child]:border-0", className)}
        {...props}
    />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tfoot
        ref={ref}
        className={cn(
            "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
            className
        )}
        {...props}
    />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
    HTMLTableRowElement,
    React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        className={cn(
            "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted even:bg-muted/30",
            className
        )}
        {...props}
    />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
    HTMLTableCellElement,
    React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={cn(
            "h-11 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
            className
        )}
        {...props}
    />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
    HTMLTableCellElement,
    React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <td
        ref={ref}
        className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
        {...props}
    />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
    HTMLTableCaptionElement,
    React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
    <caption
        ref={ref}
        className={cn("mt-4 text-sm text-muted-foreground", className)}
        {...props}
    />
))
TableCaption.displayName = "TableCaption"

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
}

// ---- MobileCardWrapper ------------------------------------------------------
// Drop-in wrapper that gives a list of card items the native-group appearance.
// Usage: <MobileCardWrapper> {items.map(item => <div className="px-4 py-3 ...">...</div>)} </MobileCardWrapper>

export const MobileCardWrapper = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("native-group divide-y divide-border/40 md:hidden", className)}
        {...props}
    />
))
MobileCardWrapper.displayName = "MobileCardWrapper"

// ---- ResponsiveTable --------------------------------------------------------
// Desktop (md+): standard <Table>. Mobile: stacked native-group cards.

export interface ResponsiveColumn<T = Record<string, unknown>> {
    /** Unique key for this column */
    key: string
    /** Column header text */
    header: string
    /** Custom cell renderer. Falls back to (row as any)[key] as string */
    cell?: (row: T) => React.ReactNode
    /** Mark as the primary field (shown as card title on mobile) */
    primary?: boolean
    /** Hide this column in the mobile card view */
    mobileHidden?: boolean
    /** Extra className on the desktop <TableHead> */
    headClassName?: string
    /** Extra className on the desktop <TableCell> */
    cellClassName?: string
}

export interface ResponsiveTableProps<T = Record<string, unknown>> {
    data: T[] | undefined
    columns: ResponsiveColumn<T>[]
    /** Returns a unique key per row */
    keyExtractor: (row: T) => string | number
    /** Optional trailing actions column (desktop + mobile) */
    actions?: (row: T) => React.ReactNode
    /** Show skeleton rows while loading */
    isLoading?: boolean
    loadingRows?: number
    emptyMessage?: string
}

function MobileCard<T = Record<string, unknown>>({
    row,
    columns,
    actions,
}: {
    row: T
    columns: ResponsiveColumn<T>[]
    actions?: (row: T) => React.ReactNode
}) {
    const primary = columns.find((c) => c.primary)
    const rest = columns.filter((c) => !c.primary && !c.mobileHidden)

    const renderValue = (col: ResponsiveColumn<T>) =>
        col.cell ? col.cell(row) : String((row as Record<string, unknown>)[col.key] ?? '–')

    return (
        <div className="px-4 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0 space-y-1">
                {primary && (
                    <div className="font-medium text-sm text-foreground">
                        {renderValue(primary)}
                    </div>
                )}
                {rest.map((col) => (
                    <div key={col.key} className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70 shrink-0">
                            {col.header}:
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {renderValue(col)}
                        </span>
                    </div>
                ))}
            </div>
            {actions && (
                <div className="flex-shrink-0 flex items-center gap-1">
                    {actions(row)}
                </div>
            )}
        </div>
    )
}

export function ResponsiveTable<T = Record<string, unknown>>({
    data,
    columns,
    keyExtractor,
    actions,
    isLoading = false,
    loadingRows = 4,
    emptyMessage = 'Keine Einträge gefunden',
}: ResponsiveTableProps<T>) {
    const skeletonCols = actions ? columns.length + 1 : columns.length

    return (
        <>
            {/* ── Mobile card list ── */}
            <div className="md:hidden native-group divide-y divide-border/40">
                {isLoading ? (
                    Array.from({ length: loadingRows }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3">
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                                <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                            </div>
                        </div>
                    ))
                ) : !data || data.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        {emptyMessage}
                    </div>
                ) : (
                    data.map((row) => (
                        <MobileCard
                            key={keyExtractor(row)}
                            row={row}
                            columns={columns}
                            actions={actions}
                        />
                    ))
                )}
            </div>

            {/* ── Desktop table ── */}
            <div className="hidden md:block native-group overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b bg-muted/30">
                            <tr>
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className={cn(
                                            "h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                                            col.headClassName
                                        )}
                                    >
                                        {col.header}
                                    </th>
                                ))}
                                {actions && (
                                    <th className="h-11 px-4 text-right align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Aktionen
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {isLoading ? (
                                Array.from({ length: loadingRows }).map((_, i) => (
                                    <tr key={i} className="border-b">
                                        {Array.from({ length: skeletonCols }).map((_, j) => (
                                            <td key={j} className="p-4">
                                                <div className="h-4 w-full rounded bg-muted animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : !data || data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={skeletonCols}
                                        className="h-24 text-center text-muted-foreground text-sm"
                                    >
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                data.map((row) => (
                                    <tr
                                        key={keyExtractor(row)}
                                        className="border-b transition-colors hover:bg-muted/40"
                                    >
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className={cn("p-4 align-middle", col.cellClassName)}
                                            >
                                                {col.cell
                                                    ? col.cell(row)
                                                    : String((row as Record<string, unknown>)[col.key] ?? '–')}
                                            </td>
                                        ))}
                                        {actions && (
                                            <td className="p-4 align-middle text-right">
                                                {actions(row)}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}
