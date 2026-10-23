import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Person } from '../../types/family';
import PersonInfoPanel from './PersonInfoPanel';

export interface ProfileAnchor {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PersonProfileCardProps {
  person: Person;
  anchor: ProfileAnchor;
  familyData: Person[];
  onClose: () => void;
  onExited: () => void;
  onEnter: () => void;
  onLeave: () => void;
  leaving?: boolean;
  onPersonUpdate: (person: Person) => Promise<void>;
  onEdit: (person: Person) => void;
  onAddPerson: (relatedPersonId: string, relationshipType: 'child' | 'parent' | 'spouse') => void;
  onDeletePerson: (personId: string) => Promise<void>;
}

const PersonProfileCard: React.FC<PersonProfileCardProps> = ({
  person,
  anchor,
  familyData,
  onClose,
  onExited,
  onEnter,
  onLeave,
  leaving = false,
  onPersonUpdate,
  onEdit,
  onAddPerson,
  onDeletePerson,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState({ left: anchor.left, top: anchor.top });
  const [present, setPresent] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setPresent(true), 20);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target || cardRef.current?.contains(target) || target.closest('.tree-node, aside, [role="listbox"]')) return;
      onClose();
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [onClose]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    const width = card?.offsetWidth ?? 360;
    const height = card?.offsetHeight ?? 420;
    if (window.innerWidth < 768) {
      const sheet = Math.min(height, window.innerHeight * 0.72);
      setPlace({ left: 12, top: Math.max(72, window.innerHeight - sheet - 12) });
      return;
    }
    let left = anchor.left + anchor.width + 14;
    let top = anchor.top + anchor.height / 2 - 36;
    if (left + width > window.innerWidth - 12) left = anchor.left - width - 14;
    if (left < 12) left = 12;
    if (top + height > window.innerHeight - 12) top = window.innerHeight - height - 12;
    if (top < 72) top = 72;
    setPlace({ left, top });
  }, [anchor.left, anchor.top, anchor.width, anchor.height, person.id]);

  return (
    <div
      ref={cardRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onWheel={(event) => event.stopPropagation()}
      onTransitionEnd={(event) => {
        if (event.target !== event.currentTarget || event.propertyName !== 'opacity' || !leaving) return;
        onExited();
      }}
      style={{ left: place.left, top: place.top }}
      className={`profile-card fixed z-40 w-[min(22.5rem,calc(100vw-1.5rem))] max-h-[min(72dvh,640px)] overflow-hidden overscroll-contain rounded-2xl border border-white/80 bg-white/95 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.85)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95 ${present && !leaving ? 'is-open' : ''}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-indigo-500/15 to-transparent" />
      <div className="relative flex items-center justify-between border-b border-zinc-200/80 px-4 py-3 dark:border-white/10">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">Profil</p>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10" aria-label="Fermer le profil">
          <X size={16} />
        </button>
      </div>
      <div className="max-h-[calc(min(72vh,620px)-3rem)] overflow-y-auto overscroll-contain px-3 py-2">
        <PersonInfoPanel
          selectedPerson={person}
          familyData={familyData}
          onPersonUpdate={onPersonUpdate}
          onEdit={onEdit}
          onAddPerson={onAddPerson}
          onDeletePerson={onDeletePerson}
        />
      </div>
    </div>
  );
};

export default PersonProfileCard;
