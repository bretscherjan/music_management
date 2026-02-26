import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { dbService } from '@/services/dbService';
import type { DbRelation, TableColumn } from '@/services/dbService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Table as TableIcon, Key, Link as LinkIcon, Move, ZoomIn, ZoomOut, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Position { x: number; y: number; }

const TABLE_WIDTH = 260;
const TABLE_HEADER_HEIGHT = 38;
const COLUMN_ROW_HEIGHT = 26;

// ─────────────────────────────────────────────────────────────────
// Force-directed spring layout (Fruchterman-Reingold simplified)
// ─────────────────────────────────────────────────────────────────
function runForceLayout(
    tableKeys: string[],
    relationPairs: Array<{ a: string; b: string }>
): Record<string, Position> {
    const n = tableKeys.length;
    if (n === 0) return {};

    const pos: Record<string, { x: number; y: number }> = {};
    const vel: Record<string, { vx: number; vy: number }> = {};

    // Initialize on a circle so nodes start spread out
    const r = Math.max(450, n * 60);
    tableKeys.forEach((key, i) => {
        const angle = (2 * Math.PI * i) / n;
        pos[key] = { x: r + r * Math.cos(angle), y: r + r * Math.sin(angle) };
        vel[key] = { vx: 0, vy: 0 };
    });

    // Deduplicate edges (undirected)
    const seen = new Set<string>();
    const edges: Array<{ a: string; b: string }> = [];
    relationPairs.forEach(({ a, b }) => {
        if (a === b) return;
        const k = [a, b].sort().join('\0');
        if (!seen.has(k)) { seen.add(k); edges.push({ a, b }); }
    });

    const REPULSION  = 120000;
    const SPRING_LEN = 400;
    const SPRING_K   = 0.05;
    const DAMPING    = 0.72;
    const ITERS      = 280;

    for (let iter = 0; iter < ITERS; iter++) {
        const f: Record<string, { fx: number; fy: number }> = {};
        tableKeys.forEach(k => f[k] = { fx: 0, fy: 0 });

        // Repulsion (all pairs)
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const a = tableKeys[i], b = tableKeys[j];
                const dx = pos[b].x - pos[a].x;
                const dy = pos[b].y - pos[a].y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
                const fv = REPULSION / (dist * dist);
                const nx = dx / dist, ny = dy / dist;
                f[a].fx -= fv * nx; f[a].fy -= fv * ny;
                f[b].fx += fv * nx; f[b].fy += fv * ny;
            }
        }

        // Spring attraction along FK edges
        edges.forEach(({ a, b }) => {
            const dx = pos[b].x - pos[a].x;
            const dy = pos[b].y - pos[a].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
            const fv = SPRING_K * (dist - SPRING_LEN);
            const nx = dx / dist, ny = dy / dist;
            f[a].fx += fv * nx; f[a].fy += fv * ny;
            f[b].fx -= fv * nx; f[b].fy -= fv * ny;
        });

        // Apply with cooling schedule
        const cool = 1 - iter / ITERS;
        tableKeys.forEach(k => {
            vel[k].vx = (vel[k].vx + f[k].fx) * DAMPING;
            vel[k].vy = (vel[k].vy + f[k].fy) * DAMPING;
            pos[k].x += vel[k].vx * cool;
            pos[k].y += vel[k].vy * cool;
        });
    }

    // Shift to (80, 80) origin
    let minX = Infinity, minY = Infinity;
    tableKeys.forEach(k => { minX = Math.min(minX, pos[k].x); minY = Math.min(minY, pos[k].y); });
    const result: Record<string, Position> = {};
    tableKeys.forEach(k => {
        result[k] = { x: Math.round(pos[k].x - minX + 80), y: Math.round(pos[k].y - minY + 80) };
    });
    return result;
}

// ─────────────────────────────────────────────────────────────────
// Overlap resolution pass — run after force layout + column sizes known
// ─────────────────────────────────────────────────────────────────
function resolveOverlaps(
    positions: Record<string, Position>,
    tableHeights: Record<string, number>,
    tableKeys: string[]
): Record<string, Position> {
    const pos: Record<string, Position> = {};
    tableKeys.forEach(k => { if (positions[k]) pos[k] = { ...positions[k] }; });
    const PAD = 40; // minimum gap between tables

    for (let iter = 0; iter < 80; iter++) {
        let moved = false;
        for (let i = 0; i < tableKeys.length; i++) {
            for (let j = i + 1; j < tableKeys.length; j++) {
                const a = tableKeys[i], b = tableKeys[j];
                const pa = pos[a], pb = pos[b];
                if (!pa || !pb) continue;
                const ha = (tableHeights[a] || 200) + PAD;
                const hb = (tableHeights[b] || 200) + PAD;
                const wa = TABLE_WIDTH + PAD;
                const wb = TABLE_WIDTH + PAD;
                const overlapX = Math.min(pa.x + wa, pb.x + wb) - Math.max(pa.x, pb.x);
                const overlapY = Math.min(pa.y + ha, pb.y + hb) - Math.max(pa.y, pb.y);
                if (overlapX > 0 && overlapY > 0) {
                    const cx = (pb.x + TABLE_WIDTH / 2) - (pa.x + TABLE_WIDTH / 2);
                    const cy = (pb.y + (tableHeights[b] || 200) / 2) - (pa.y + (tableHeights[a] || 200) / 2);
                    if (Math.abs(overlapX) < Math.abs(overlapY)) {
                        const push = overlapX / 2 + 1;
                        if (cx >= 0) { pos[a] = { ...pos[a], x: pos[a].x - push }; pos[b] = { ...pos[b], x: pos[b].x + push }; }
                        else         { pos[a] = { ...pos[a], x: pos[a].x + push }; pos[b] = { ...pos[b], x: pos[b].x - push }; }
                    } else {
                        const push = overlapY / 2 + 1;
                        if (cy >= 0) { pos[a] = { ...pos[a], y: pos[a].y - push }; pos[b] = { ...pos[b], y: pos[b].y + push }; }
                        else         { pos[a] = { ...pos[a], y: pos[a].y + push }; pos[b] = { ...pos[b], y: pos[b].y - push }; }
                    }
                    moved = true;
                }
            }
        }
        if (!moved) break;
    }

    // Re-normalize to (80, 80) origin
    let minX = Infinity, minY = Infinity;
    tableKeys.forEach(k => { if (pos[k]) { minX = Math.min(minX, pos[k].x); minY = Math.min(minY, pos[k].y); } });
    const result: Record<string, Position> = {};
    tableKeys.forEach(k => { if (pos[k]) result[k] = { x: Math.round(pos[k].x - minX + 80), y: Math.round(pos[k].y - minY + 80) }; });
    return result;
}

// ─────────────────────────────────────────────────────────────────
// Main ERD component
// ─────────────────────────────────────────────────────────────────
export function DbDiagram() {
    const { data: tables = [], isLoading: isLoadingTables } = useQuery({
        queryKey: ['db-tables'],
        queryFn: dbService.getTables
    });
    const { data: relations = [], isLoading: isLoadingRelations } = useQuery({
        queryKey: ['db-relations'],
        queryFn: dbService.getRelations
    });

    // Fetch all table columns in parallel
    const columnQueries = useQueries({
        queries: tables.map(t => ({
            queryKey: ['db-columns', t.name],
            queryFn:  () => dbService.getTableColumns(t.name),
            enabled:  tables.length > 0,
            staleTime: 60_000
        }))
    });

    const columnsMap = useMemo<Record<string, TableColumn[]>>(() => {
        const m: Record<string, TableColumn[]> = {};
        tables.forEach((t, i) => { if (columnQueries[i]?.data) m[t.name.toLowerCase()] = columnQueries[i].data!; });
        return m;
    }, [tables, columnQueries]);

    // Which columns are FK sources per table
    const fkColumnsMap = useMemo<Record<string, Set<string>>>(() => {
        const m: Record<string, Set<string>> = {};
        relations.forEach(r => {
            const k = r.tableName.toLowerCase();
            if (!m[k]) m[k] = new Set();
            m[k].add(r.columnName.toLowerCase());
        });
        return m;
    }, [relations]);

    const [positions,   setPositions]   = useState<Record<string, Position>>({});
    const [dragging,    setDragging]    = useState<string | null>(null);
    const [zoom,        setZoom]        = useState(0.65);
    const [highlighted, setHighlighted] = useState<{ table: string; column: string } | null>(null);

    const containerRef    = useRef<HTMLDivElement>(null);
    const dragOffset      = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
    const highlightTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const layoutDoneRef   = useRef(false);
    const overlapsDoneRef = useRef(false);

    // Helper: compute heights from loaded column data
    const getTableHeights = useCallback((): Record<string, number> => {
        const h: Record<string, number> = {};
        tables.forEach(t => {
            const cols = columnsMap[t.name.toLowerCase()] || [];
            h[t.name.toLowerCase()] = TABLE_HEADER_HEIGHT + Math.max(1, cols.length) * COLUMN_ROW_HEIGHT;
        });
        return h;
    }, [tables, columnsMap]);

    // Run force-directed layout on initial data load
    useEffect(() => {
        if (tables.length > 0 && !layoutDoneRef.current) {
            layoutDoneRef.current   = true;
            overlapsDoneRef.current = false;
            const keys  = tables.map(t => t.name.toLowerCase());
            const pairs = relations.map(r => ({ a: r.tableName.toLowerCase(), b: r.referencedTableName.toLowerCase() }));
            setPositions(runForceLayout(keys, pairs));
        }
    }, [tables, relations]);

    // Overlap resolution once all column data is available
    useEffect(() => {
        if (overlapsDoneRef.current) return;
        const allLoaded = tables.length > 0 && tables.every(t => columnsMap[t.name.toLowerCase()]?.length);
        if (!allLoaded) return;
        overlapsDoneRef.current = true;
        const heights = getTableHeights();
        const keys    = tables.map(t => t.name.toLowerCase());
        setPositions(prev => resolveOverlaps(prev, heights, keys));
    }, [tables, columnsMap, getTableHeights]);

    // Ctrl+Wheel zoom inside canvas — prevents browser page zoom
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const handler = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                setZoom(z => Math.min(Math.max(z - e.deltaY * 0.001, 0.2), 2.5));
            }
        };
        el.addEventListener('wheel', handler, { passive: false });
        return () => el.removeEventListener('wheel', handler);
    }, []);

    const handleAutoLayout = () => {
        layoutDoneRef.current   = true;
        overlapsDoneRef.current = true;
        const keys    = tables.map(t => t.name.toLowerCase());
        const pairs   = relations.map(r => ({ a: r.tableName.toLowerCase(), b: r.referencedTableName.toLowerCase() }));
        const heights = getTableHeights();
        setPositions(resolveOverlaps(runForceLayout(keys, pairs), heights, keys));
        setZoom(0.65);
    };

    // ── Drag ──────────────────────────────────────────────────────
    const handleMouseDown = (tableName: string, e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.drag-handle')) {
            const key = tableName.toLowerCase();
            const p   = positions[key];
            if (p && containerRef.current) {
                dragOffset.current = {
                    dx: (e.clientX - containerRef.current.getBoundingClientRect().left + containerRef.current.scrollLeft) / zoom - p.x,
                    dy: (e.clientY - containerRef.current.getBoundingClientRect().top  + containerRef.current.scrollTop)  / zoom - p.y
                };
            }
            setDragging(key);
            e.preventDefault();
        }
    };
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setPositions(prev => ({
            ...prev,
            [dragging]: {
                x: Math.max(0, (e.clientX - rect.left + containerRef.current!.scrollLeft) / zoom - dragOffset.current.dx),
                y: Math.max(0, (e.clientY - rect.top  + containerRef.current!.scrollTop)  / zoom - dragOffset.current.dy)
            }
        }));
    }, [dragging, zoom]);
    const handleMouseUp = useCallback(() => setDragging(null), []);
    useEffect(() => {
        if (dragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }, [dragging, handleMouseMove, handleMouseUp]);

    // ── FK click navigation ───────────────────────────────────────
    const handleFkClick = useCallback((srcTable: string, srcColumn: string) => {
        const rel = relations.find(
            r => r.tableName.toLowerCase()  === srcTable.toLowerCase() &&
                 r.columnName.toLowerCase() === srcColumn.toLowerCase()
        );
        if (!rel || !containerRef.current) return;

        const targetKey = rel.referencedTableName.toLowerCase();
        const targetPos = positions[targetKey];
        if (!targetPos) return;

        const container = containerRef.current;
        container.scrollTo({
            left: Math.max(0, targetPos.x * zoom - container.clientWidth  / 2 + TABLE_WIDTH * zoom / 2),
            top:  Math.max(0, targetPos.y * zoom - container.clientHeight / 2 + 80 * zoom),
            behavior: 'smooth'
        });

        if (highlightTimer.current) clearTimeout(highlightTimer.current);
        setHighlighted({ table: targetKey, column: rel.referencedColumnName.toLowerCase() });
        highlightTimer.current = setTimeout(() => setHighlighted(null), 2500);
    }, [relations, positions, zoom]);

    // ── Helpers ───────────────────────────────────────────────────
    const getColumnYOffset = (tableName: string, columnName: string): number => {
        const cols = columnsMap[tableName.toLowerCase()] || [];
        const idx  = cols.findIndex(c => c.Field.toLowerCase() === columnName.toLowerCase());
        return TABLE_HEADER_HEIGHT + (idx >= 0 ? idx : 0) * COLUMN_ROW_HEIGHT + COLUMN_ROW_HEIGHT / 2;
    };

    const getRelationType = (rel: DbRelation): '1:1' | 'N:1' => {
        const cols  = columnsMap[rel.tableName.toLowerCase()] || [];
        const fkCol = cols.find(c => c.Field.toLowerCase() === rel.columnName.toLowerCase());
        return fkCol?.Key === 'UNI' ? '1:1' : 'N:1';
    };

    interface RelPath {
        d: string; arrowPath: string;
        x1: number; y1: number; x2: number; y2: number;
        midX: number; midY: number;
        srcLabelX: number; tgtLabelX: number;
        srcLabel: string; tgtLabel: string;
        relType: string;
    }

    const buildRelationPath = (rel: DbRelation): RelPath | null => {
        const p1 = positions[rel.tableName.toLowerCase()];
        const p2 = positions[rel.referencedTableName.toLowerCase()];
        if (!p1 || !p2) return null;

        const y1Offset = getColumnYOffset(rel.tableName, rel.columnName);
        const y2Offset = getColumnYOffset(rel.referencedTableName, rel.referencedColumnName);
        const relType  = getRelationType(rel);
        const isSelf   = rel.tableName.toLowerCase() === rel.referencedTableName.toLowerCase();

        let x1: number, y1: number, x2: number, y2: number;
        let cx1: number, cx2: number;
        let goesRight: boolean;

        if (isSelf) {
            x1 = p1.x + TABLE_WIDTH; y1 = p1.y + y1Offset;
            x2 = p2.x + TABLE_WIDTH; y2 = p2.y + y2Offset;
            cx1 = x1 + 75; cx2 = x2 + 75;
            goesRight = false;
        } else {
            goesRight = (p1.x + TABLE_WIDTH / 2) <= (p2.x + TABLE_WIDTH / 2);
            x1 = goesRight ? p1.x + TABLE_WIDTH : p1.x;
            x2 = goesRight ? p2.x              : p2.x + TABLE_WIDTH;
            y1 = p1.y + y1Offset;
            y2 = p2.y + y2Offset;
            const ctrl = Math.max(55, Math.abs(x2 - x1) * 0.45);
            cx1 = goesRight ? x1 + ctrl : x1 - ctrl;
            cx2 = goesRight ? x2 - ctrl : x2 + ctrl;
        }

        const d = `M ${x1} ${y1} C ${cx1} ${y1} ${cx2} ${y2} ${x2} ${y2}`;

        // Inline arrowhead (avoids SVG url(#) issues inside CSS transforms)
        const AS = 7;
        let arrowPath: string;
        if (isSelf || !goesRight)
            arrowPath = `M ${x2 + AS} ${y2 - AS * 0.6} L ${x2} ${y2} L ${x2 + AS} ${y2 + AS * 0.6}`;
        else
            arrowPath = `M ${x2 - AS} ${y2 - AS * 0.6} L ${x2} ${y2} L ${x2 - AS} ${y2 + AS * 0.6}`;

        // Midpoint of Bezier (t=0.5, horizontal tangents → mid = average of endpoints)
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        // Cardinality label positions (offset from edge)
        const OFF = 20;
        const srcLabelX = isSelf ? x1 + OFF : (goesRight ? x1 + OFF : x1 - OFF);
        const tgtLabelX = isSelf ? x2 + OFF : (goesRight ? x2 - OFF : x2 + OFF);

        const srcLabel = relType === '1:1' ? '1' : 'N';
        const tgtLabel = '1';

        return { d, arrowPath, x1, y1, x2, y2, midX, midY, srcLabelX, tgtLabelX, srcLabel, tgtLabel, relType };
    };

    const isLoadingColumns = columnQueries.some(q => q.isLoading);
    const columnsReady     = !isLoadingColumns && tables.length > 0;

    if (isLoadingTables || isLoadingRelations) {
        return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(z + 0.1, 2))}><ZoomIn  className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))}><ZoomOut className="h-4 w-4" /></Button>
                    <span className="text-xs font-mono text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded">
                        {tables.length} Tabellen · {relations.length} Relationen
                        {isLoadingColumns && ' · Spalten laden…'}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleAutoLayout}>
                        <Wand2 className="h-4 w-4 mr-2" /> Auto-Layout
                    </Button>
                </div>
            </div>

            {/* Canvas */}
            <div
                ref={containerRef}
                className="relative bg-zinc-50 rounded-xl border-2 border-primary/5 overflow-auto min-h-[800px] w-full select-none shadow-inner"
                style={{ backgroundImage: 'radial-gradient(circle, #d4d4d8 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            >
                <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0', width: '5000px', height: '5000px', position: 'relative' }}>

                    {/* SVG relation lines — inline arrowheads avoid url(#) issues inside CSS transforms */}
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 1 }}>
                        {columnsReady && relations.map((rel, idx) => {
                            const r = buildRelationPath(rel);
                            if (!r) return null;
                            const { d, arrowPath, x1, y1, midX, midY, srcLabelX, tgtLabelX, srcLabel, tgtLabel, relType } = r;
                            return (
                                <g key={`rel-${idx}`}>
                                    {/* Transparent wide hit area */}
                                    <path d={d} fill="none" stroke="transparent" strokeWidth="12" />
                                    {/* Curve */}
                                    <path d={d} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.55" />
                                    {/* Circle at FK source */}
                                    <circle cx={x1} cy={y1} r="3.5" fill="#6366f1" fillOpacity="0.75" />
                                    {/* Arrowhead at PK target */}
                                    <path d={arrowPath} fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85" />
                                    {/* Cardinality: N near FK source */}
                                    <text x={srcLabelX} y={y1 - 6} textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="700" fill="#6366f1" fillOpacity="0.85">{srcLabel}</text>
                                    {/* Cardinality: 1 near PK target */}
                                    <text x={tgtLabelX} y={r.y2 - 6} textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="700" fill="#6366f1" fillOpacity="0.85">{tgtLabel}</text>
                                    {/* Relation type badge at midpoint */}
                                    <g transform={`translate(${midX},${midY})`}>
                                        <rect x="-16" y="-10" width="32" height="16" rx="5" fill="white" fillOpacity="0.95" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
                                        <text x="0" y="1" textAnchor="middle" dominantBaseline="middle" fontSize="9" fontFamily="monospace" fontWeight="700" fill="#6366f1">{relType}</text>
                                    </g>
                                    <title>{`${rel.tableName}.${rel.columnName} → ${rel.referencedTableName}.${rel.referencedColumnName} [${relType}]`}</title>
                                </g>
                            );
                        })}
                    </svg>

                    {/* Table nodes */}
                    {tables.map(table => {
                        const key = table.name.toLowerCase();
                        const pos = positions[key];
                        if (!pos) return null;
                        return (
                            <div
                                key={table.name}
                                style={{ position: 'absolute', left: pos.x, top: pos.y, width: TABLE_WIDTH, zIndex: dragging === key ? 50 : 10 }}
                                onMouseDown={e => handleMouseDown(table.name, e)}
                            >
                                <TableNode
                                    tableName={table.name}
                                    columns={columnsMap[key] || []}
                                    fkColumns={fkColumnsMap[key] || new Set()}
                                    highlightedColumn={highlighted?.table === key ? highlighted.column : null}
                                    isDragging={dragging === key}
                                    onFkClick={handleFkClick}
                                />
                            </div>
                        );
                    })}
                </div>

                <div className="fixed bottom-6 right-6 inline-flex bg-white/95 backdrop-blur-sm p-3 rounded-lg border shadow-xl text-xs text-muted-foreground items-center gap-2 z-50">
                    <Move className="h-4 w-4 text-primary" />
                    Kopfzeile ziehen · <kbd className="bg-zinc-100 border rounded px-1 text-[9px]">Ctrl</kbd>+Scroll zum Zoomen · <span className="text-indigo-600 font-semibold">FK-Feld klicken</span> navigiert
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Table node
// ─────────────────────────────────────────────────────────────────
function TableNode({ tableName, columns, fkColumns, highlightedColumn, isDragging, onFkClick }: {
    tableName:        string;
    columns:          TableColumn[];
    fkColumns:        Set<string>;
    highlightedColumn: string | null;
    isDragging?:      boolean;
    onFkClick:        (table: string, column: string) => void;
}) {
    return (
        <Card className={`w-full shadow-lg border-2 transition-all duration-75 bg-white overflow-hidden ${
            isDragging ? 'border-primary shadow-2xl scale-[1.01]' : 'border-primary/20'
        }`}>
            <CardHeader
                className="drag-handle cursor-grab active:cursor-grabbing flex flex-row items-center gap-2 bg-primary/10 border-b"
                style={{ height: TABLE_HEADER_HEIGHT, padding: '0 10px' }}
            >
                <TableIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                <CardTitle className="text-[11px] font-bold font-mono text-primary truncate">{tableName}</CardTitle>
            </CardHeader>

            <CardContent className="p-0 max-h-[400px] overflow-y-auto thin-scrollbar">
                {columns.length === 0 ? (
                    <div className="flex items-center justify-center" style={{ height: COLUMN_ROW_HEIGHT }}>
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    </div>
                ) : columns.map(col => {
                    const isPk          = col.Key === 'PRI';
                    const isFk          = fkColumns.has(col.Field.toLowerCase());
                    const isHighlighted = highlightedColumn === col.Field.toLowerCase();
                    return (
                        <div
                            key={col.Field}
                            title={isFk ? 'FK – klicken zum Navigieren zur referenzierten Spalte' : col.Type}
                            className={`px-2.5 flex items-center justify-between border-b last:border-0 text-[10px] font-mono transition-all ${
                                isHighlighted ? 'bg-yellow-200 ring-1 ring-inset ring-yellow-400 animate-pulse'
                                : isPk ? 'bg-amber-50/60'
                                : isFk ? 'bg-indigo-50/70 cursor-pointer hover:bg-indigo-100 active:bg-indigo-200'
                                : 'hover:bg-zinc-50/80'
                            }`}
                            style={{ height: COLUMN_ROW_HEIGHT }}
                            onClick={isFk ? e => { e.stopPropagation(); onFkClick(tableName, col.Field); } : undefined}
                        >
                            <div className="flex items-center gap-1.5 min-w-0">
                                {isPk  ? <Key      className="h-3 w-3 text-amber-500 shrink-0" />
                                : isFk ? <LinkIcon className="h-3 w-3 text-indigo-500 shrink-0" />
                                :        <div className="h-1.5 w-1.5 rounded-full bg-zinc-300 shrink-0" />}
                                <span className={`truncate ${
                                    isPk  ? 'font-bold text-amber-800'
                                    : isFk ? 'font-semibold text-indigo-700'
                                    :        'text-zinc-600'
                                }`}>{col.Field}</span>
                            </div>
                            <span className="text-zinc-400 shrink-0 ml-2 text-[9px] opacity-70">{col.Type.split('(')[0]}</span>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
