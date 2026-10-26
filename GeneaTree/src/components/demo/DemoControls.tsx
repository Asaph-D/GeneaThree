import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, Edit, FileDown, RefreshCw, Search, Share, Upload } from 'lucide-react';
import { SAMPLE_FAMILIES } from '../../examples/sampleFamilies';
import { Person } from '../../types/family';

interface DemoControlsProps {
  viewType: string;
  generations: number;
  focusPerson: string;
  isEditMode: boolean;
  familyData: Person[];
  onViewTypeChange: (viewType: 'tree' | 'radial' | 'vertical' | 'timeline') => void;
  onGenerationsChange: (generations: number) => void;
  onFocusPersonChange: (focusPerson: string) => void;
  onExportPDF: () => void;
  onExportTree: () => void;
  onImportTree: (file: File) => void;
  onShare: () => void;
  onToggleEditMode: () => void;
  onResetTree: () => void;
  exampleId: string;
  onExampleChange: (exampleId: string) => void;
  compact?: boolean;
}

const labelClass = 'block text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400';
const fieldButton = 'mt-1 flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-left text-[13px] text-zinc-900 outline-none transition hover:border-primary-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';
const menuClass = 'absolute z-30 mt-1 max-h-52 w-full overflow-y-auto overscroll-contain rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900';
const iconBtn = 'flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-800 transition hover:border-primary-400 hover:text-primary-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:text-primary-300';

interface MenuOption {
  value: string;
  label: string;
}

const MenuField: React.FC<{
  id: string;
  label: string;
  value: string;
  options: MenuOption[];
  onChange: (value: string) => void;
}> = ({ id, label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className={labelClass}>{label}</label>
      <button id={id} type="button" className={fieldButton} onClick={() => setOpen((valueOpen) => !valueOpen)} aria-expanded={open}>
        <span className="truncate">{current?.label}</span>
        <ChevronDown size={14} className="shrink-0 text-zinc-500" />
      </button>
      {open && (
        <ul className={menuClass} role="listbox">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`block w-full px-2.5 py-1.5 text-left text-[13px] ${
                  option.value === value
                    ? 'bg-primary-50 text-primary-800 dark:bg-primary-950 dark:text-primary-100'
                    : 'text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800'
                }`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const DemoControls: React.FC<DemoControlsProps> = ({
  viewType,
  generations,
  focusPerson,
  isEditMode,
  familyData,
  onViewTypeChange,
  onGenerationsChange,
  onFocusPersonChange,
  onExportPDF,
  onExportTree,
  onImportTree,
  onShare,
  onToggleEditMode,
  onResetTree,
  exampleId,
  onExampleChange,
  compact = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showSearchResults) return;
    const close = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setShowSearchResults(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showSearchResults]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    if (query.length > 1) {
      setSearchResults(familyData.filter(person =>
        (person.firstName || '').toLowerCase().includes(query) ||
        (person.lastName || '').toLowerCase().includes(query)
      ));
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const actions = (
    <div data-print-control className={`flex ${compact ? 'flex-col items-center gap-1.5' : 'gap-1.5'}`}>
      <button type="button" title="Exporter l’arbre" aria-label="Exporter l’arbre" onClick={onExportTree} className={iconBtn}><Download size={16} /></button>
      <button type="button" title="Importer un arbre" aria-label="Importer un arbre" onClick={() => importRef.current?.click()} className={iconBtn}><Upload size={16} /></button>
      <input ref={importRef} type="file" accept=".json,.geneatree.json,application/json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImportTree(file); event.target.value = ''; }} />
      <button type="button" title="Exporter un PDF haute définition" aria-label="Exporter un PDF haute définition" onClick={onExportPDF} className={iconBtn}><FileDown size={16} /></button>
      <button type="button" title="Partager" onClick={onShare} className={`${iconBtn} !border-primary-600 !bg-primary-600 !text-white`}><Share size={16} /></button>
      <button type="button" title={isEditMode ? 'Terminer l\'édition' : 'Modifier l\'arbre'} onClick={onToggleEditMode} className={`${iconBtn} ${isEditMode ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-200' : ''}`}><Edit size={16} /></button>
      <button type="button" title="Réinitialiser" onClick={onResetTree} className={iconBtn}><RefreshCw size={16} /></button>
    </div>
  );

  if (compact) {
    return <div className="flex justify-center py-3">{actions}</div>;
  }

  return (
    <div className="flex flex-col gap-3.5 p-3">
      <MenuField
        id="example-family"
        label="Exemple"
        value={exampleId}
        onChange={onExampleChange}
        options={[
          ...(exampleId === 'imported' ? [{ value: 'imported', label: 'Arbre importé' }] : []),
          ...SAMPLE_FAMILIES.map((family) => ({ value: family.id, label: family.label })),
        ]}
      />
      <MenuField
        id="view-type"
        label="Type de vue"
        value={viewType}
        onChange={(value) => onViewTypeChange(value as 'tree' | 'radial' | 'vertical' | 'timeline')}
        options={[
          { value: 'tree', label: 'Arbre standard' },
          { value: 'radial', label: 'Vue radiale' },
          { value: 'vertical', label: 'Vue verticale' },
          { value: 'timeline', label: 'Chronologie' },
        ]}
      />
      <MenuField
        id="focus-person"
        label="Personne focale"
        value={focusPerson}
        onChange={onFocusPersonChange}
        options={familyData.map((person) => ({ value: person.id, label: `${person.firstName} ${person.lastName}` }))}
      />
      <div>
        <label htmlFor="generations" className={labelClass}>Générations</label>
        <div className="mt-1.5 flex items-center gap-2">
          <input
            type="range"
            id="generations"
            min="1"
            max="7"
            value={generations}
            onChange={(e) => onGenerationsChange(parseInt(e.target.value))}
            className="genea-range h-1 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200 dark:bg-zinc-700"
          />
          <span id="generations-value" className="w-3 text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{generations}</span>
        </div>
      </div>
      {actions}
      <div className="relative" ref={searchRef}>
        <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
          <Search className="h-3.5 w-3.5 text-zinc-400" />
        </div>
        <input
          type="text"
          id="search-person"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Rechercher"
          className="block w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-2 text-[13px] text-zinc-900 outline-none transition focus:border-primary-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {showSearchResults && searchResults.length > 0 && (
          <ul className={menuClass}>
            {searchResults.map(person => (
              <li key={person.id}>
                <button
                  type="button"
                  onClick={() => {
                    onFocusPersonChange(person.id);
                    setShowSearchResults(false);
                    setSearchQuery('');
                  }}
                  className="block w-full px-2.5 py-1.5 text-left text-[13px] text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  {person.firstName} {person.lastName} {person.birthDate && `(${new Date(person.birthDate).getFullYear()})`}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DemoControls;
