import { useEffect, useRef, useState } from 'react';
import { svgKeyMaps } from './svgKeyMaps';

interface InstrumentSvgEditorProps {
  svgFile: string | null;
  activeKeys: string[];
  onToggleKey: (key: string) => void;
}

const COLOR_ACTIVE   = '#e60004';
const COLOR_HOVER    = '#ffb0b0';
const COLOR_INACTIVE = '#ffffff';
const STROKE_ACTIVE  = '#900000';
const STROKE_DEFAULT = '#000000';

/** Strip dark-mode light-dark() from SVG markup so it always renders in light mode. */
function sanitizeSvg(raw: string): string {
  // Remove any style attribute that contains light-dark() — the plain fill/stroke attributes remain intact
  return raw.replace(/\s+style="[^"]*light-dark[^"]*"/g, '');
}

/** Color all graphic primitives inside a group (including those in nested sub-groups). */
function paintGroup(group: Element, fill: string, stroke: string) {
  group.querySelectorAll('ellipse, rect, path, circle, polygon').forEach(shape => {
    const el = shape as SVGElement;
    el.setAttribute('fill', fill);
    el.setAttribute('stroke', stroke);
  });
}

export function InstrumentSvgEditor({ svgFile, activeKeys, onToggleKey }: InstrumentSvgEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void)[]>([]);

  // Fetch & sanitize SVG when the instrument changes
  useEffect(() => {
    if (!svgFile) { setSvgContent(null); return; }
    setLoading(true);
    fetch(`/instrumente/${svgFile}`)
      .then(r => r.text())
      .then(text => { setSvgContent(sanitizeSvg(text)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [svgFile]);

  // Inject SVG and wire up interactive keys
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !svgContent || !svgFile) return;

    // Remove previous listeners before re-injecting
    cleanupRef.current.forEach(fn => fn());
    cleanupRef.current = [];

    container.innerHTML = svgContent;

    const svgEl = container.querySelector('svg');
    if (svgEl) {
      // Remove fixed pixel dimensions — let CSS control sizing via viewBox
      svgEl.removeAttribute('width');
      svgEl.removeAttribute('height');
      svgEl.style.display = 'block';
      svgEl.style.maxWidth = '100%';
      svgEl.style.maxHeight = '420px';
      svgEl.style.width = 'auto';
      svgEl.style.height = 'auto';
      // Ensure background rect is white (not affected by dark-mode strip)
      const bgRect = svgEl.querySelector('rect[width="100%"]');
      if (bgRect) (bgRect as SVGElement).setAttribute('fill', '#ffffff');
    }

    const keyMap = svgKeyMaps[svgFile] ?? {};

    Object.entries(keyMap).forEach(([cellId, keyCode]) => {
      const group = container.querySelector(`[data-cell-id="${cellId}"]`);
      if (!group) return;

      const isActive = activeKeys.includes(keyCode);

      // Initial coloring
      paintGroup(group, isActive ? COLOR_ACTIVE : COLOR_INACTIVE, isActive ? STROKE_ACTIVE : STROKE_DEFAULT);

      // Make the whole group respond to pointer events
      (group as SVGElement).setAttribute('pointer-events', 'all');
      (group as SVGElement).style.cursor = 'pointer';

      // Click: toggle key; stopPropagation prevents double-fire from nested groups
      const onClick = (e: Event) => {
        e.stopPropagation();
        onToggleKey(keyCode);
      };

      // Hover feedback
      const onEnter = () => {
        if (!activeKeys.includes(keyCode))
          paintGroup(group, COLOR_HOVER, STROKE_DEFAULT);
      };
      const onLeave = () => {
        const still = activeKeys.includes(keyCode);
        paintGroup(group, still ? COLOR_ACTIVE : COLOR_INACTIVE, still ? STROKE_ACTIVE : STROKE_DEFAULT);
      };

      group.addEventListener('click', onClick);
      group.addEventListener('mouseenter', onEnter);
      group.addEventListener('mouseleave', onLeave);

      cleanupRef.current.push(
        () => group.removeEventListener('click', onClick),
        () => group.removeEventListener('mouseenter', onEnter),
        () => group.removeEventListener('mouseleave', onLeave),
      );
    });

    return () => {
      cleanupRef.current.forEach(fn => fn());
      cleanupRef.current = [];
    };
  }, [svgContent, svgFile, activeKeys, onToggleKey]);

  if (!svgFile) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm border rounded-xl bg-gray-50">
        Kein SVG verfügbar — Tasten über die Liste unten wählen
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        <span className="animate-pulse">SVG wird geladen…</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full bg-white border border-border/50 rounded-xl flex items-center justify-center p-3 overflow-auto"
      style={{ minHeight: '180px' }}
    />
  );
}
