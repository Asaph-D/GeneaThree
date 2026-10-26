import React, { useEffect, useRef, useState } from 'react';
import { Filter, Home, ZoomIn, ZoomOut } from 'lucide-react';
import * as d3 from 'd3';

interface TreeControlsProps {
  zoomRef: React.MutableRefObject<d3.ZoomBehavior<SVGSVGElement, unknown> | null>;
  svgRef: React.MutableRefObject<SVGSVGElement | null>;
  onRecenter?: () => void;
  onRelationshipSelect?: (relationship: string | null) => void;
  selectedRelationship?: string | null;
}

const relationshipOptions = [
  { id: 'parent', label: 'Parents' },
  { id: 'sibling', label: 'Frères et sœurs' },
  { id: 'child', label: 'Enfants' },
  { id: 'grandparent', label: 'Grands-parents' },
  { id: 'grandchild', label: 'Petits-enfants' },
  { id: 'uncle_aunt', label: 'Oncles et tantes' },
  { id: 'cousin', label: 'Cousins' },
  { id: 'spouse', label: 'Conjoints' },
];

const iconButton = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-950 transition hover:bg-zinc-100 hover:text-primary-700 dark:text-zinc-50 dark:hover:bg-zinc-800 dark:hover:text-primary-300';

const TreeControls: React.FC<TreeControlsProps> = ({
  zoomRef,
  svgRef,
  onRecenter,
  onRelationshipSelect,
  selectedRelationship
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = relationshipOptions.find((option) => option.id === selectedRelationship);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const scaleBy = (factor: number) => {
    if (zoomRef.current && svgRef.current) {
      zoomRef.current.scaleBy(d3.select(svgRef.current), factor);
    }
  };

  return (
    <div data-print-control className="tree-zoom-controls pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-50 flex max-w-[calc(100%-2rem)] flex-wrap items-end gap-2">
      <div className="flex items-center gap-0.5 rounded-xl border border-zinc-200 bg-white p-0.5 shadow-md dark:border-zinc-700 dark:bg-zinc-900">
        <button type="button" className={iconButton} title="Zoomer" onClick={() => scaleBy(1.2)}>
          <ZoomIn size={16} strokeWidth={2} className="h-4 w-4 shrink-0" />
        </button>
        <button type="button" className={iconButton} title="Dézoomer" onClick={() => scaleBy(0.8)}>
          <ZoomOut size={16} strokeWidth={2} className="h-4 w-4 shrink-0" />
        </button>
        <button
          type="button"
          className={iconButton}
          title="Recentrer"
          onClick={() => onRecenter?.()}
        >
          <Home size={16} strokeWidth={2} className="h-4 w-4 shrink-0" />
        </button>
      </div>

      {onRelationshipSelect && (
        <div ref={rootRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={`inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[13px] shadow-md ${
              active
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
            }`}
          >
            <Filter size={15} />
            {active ? active.label : 'Relations'}
          </button>
          {open && (
            <div className="absolute bottom-11 left-0 w-52 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <p className="px-2.5 pt-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">Focus avant enregistrement</p>
              <div className="max-h-56 overflow-y-auto overscroll-contain p-1">
                <button
                  type="button"
                  className={`flex w-full rounded-md px-2.5 py-1.5 text-left text-[13px] ${selectedRelationship === null ? 'bg-primary-50 text-primary-800 dark:bg-primary-950 dark:text-primary-100' : 'text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800'}`}
                  onClick={() => { onRelationshipSelect(null); setOpen(false); }}
                >
                  Tout le lignage
                </button>
                {relationshipOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`mt-0.5 flex w-full rounded-md px-2.5 py-1.5 text-left text-[13px] ${
                      selectedRelationship === option.id
                        ? 'bg-primary-600 text-white'
                        : 'text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                    onClick={() => { onRelationshipSelect(option.id); setOpen(false); }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TreeControls;
