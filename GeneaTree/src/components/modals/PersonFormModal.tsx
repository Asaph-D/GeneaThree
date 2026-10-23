import React, { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Marriage, PartialPerson, Person } from '../../types/family';

export interface PersonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  person?: Person | null;
  allPersons: Person[];
  marriages?: Marriage[];
  onSave: (personData: PartialPerson & { unionSpouseId?: string; marriageDate?: string; parentExistingChildren?: boolean }) => void;
  relatedPersonId?: string;
  relationshipType?: 'child' | 'parent' | 'spouse' | null;
  selectedPerson: Person | null;
  isEditMode: boolean;
  onPersonUpdate: (personData: Partial<Person>) => Promise<void>;
  onAddPerson: (relatedPersonId: string, relationshipType: 'child' | 'parent' | 'spouse') => void;
  onDeletePerson: (personId: string) => Promise<void>;
}

const inputClass = 'mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none transition focus:border-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';
const labelClass = 'block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500';

const blank = { city: '', region: '', country: '' };

const relationshipCopy: Record<string, string> = {
  child: 'enfant',
  parent: 'parent',
  spouse: 'conjoint',
};

const PersonFormModal: React.FC<PersonFormModalProps> = ({
  isOpen,
  onClose,
  person,
  allPersons,
  marriages = [],
  onSave,
  relatedPersonId,
  relationshipType,
}) => {
  const photoRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Person['gender']>('unknown');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [deceased, setDeceased] = useState(false);
  const [occupation, setOccupation] = useState('');
  const [biography, setBiography] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [unionSpouseId, setUnionSpouseId] = useState('');
  const [marriageDate, setMarriageDate] = useState('');
  const [parentExistingChildren, setParentExistingChildren] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const related = allPersons.find((item) => item.id === relatedPersonId);
  const isNew = !person;
  const unions = related
    ? marriages.filter((marriage) => marriage.spouse1Id === related.id || marriage.spouse2Id === related.id)
    : [];

  useEffect(() => {
    if (!isOpen) return;
    setErrors([]);
    setMarriageDate('');
    setParentExistingChildren(false);
    setUnionSpouseId(unions.length === 1 ? otherSpouseId(unions[0], related?.id) : '');
    if (person) {
      setFirstName(person.firstName || '');
      setLastName(person.lastName || '');
      setGender(person.gender || 'unknown');
      setBirthDate(person.birthDate || '');
      setDeathDate(person.deathDate || '');
      setDeceased(Boolean(person.deceased));
      setOccupation(person.occupation || '');
      setBiography(person.biography || '');
      setPhotoUrl(person.photoUrl || '');
      return;
    }
    setFirstName('');
    setLastName('');
    setGender('unknown');
    setBirthDate('');
    setDeathDate('');
    setDeceased(false);
    setOccupation('');
    setBiography('');
    setPhotoUrl('');
  }, [isOpen, person, relatedPersonId, relationshipType, marriages, related?.id]);

  if (!isOpen) return null;

  const today = new Date().toISOString().slice(0, 10);
  const title = isNew
    ? `Ajouter un ${relationshipCopy[relationshipType || ''] || 'membre'}`
    : `Modifier ${person.firstName} ${person.lastName}`;

  const readPhoto = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrors(['Choisissez un fichier image.']);
      return;
    }
    if (file.size > 1_500_000) {
      setErrors(['Choisissez une image de moins de 1,5 Mo.']);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const next: string[] = [];
    if (!firstName.trim() || !lastName.trim()) next.push('Le prénom et le nom sont obligatoires.');
    if (birthDate && birthDate > today) next.push('La naissance ne peut pas être dans le futur.');
    if (deceased && deathDate && birthDate && deathDate < birthDate) next.push('Le décès doit suivre la naissance.');
    if (deceased && deathDate && deathDate > today) next.push('Le décès ne peut pas être dans le futur.');
    if (isNew && relationshipType === 'parent' && related && related.parentIds.length >= 2) {
      next.push('Cette personne a déjà deux parents.');
    }
    if (isNew && relationshipType === 'child' && unions.length > 0 && !unionSpouseId) {
      next.push('Choisissez l’union qui accueille cet enfant.');
    }
    if (isNew && relationshipType === 'child' && unionSpouseId && birthDate) {
      const other = allPersons.find((item) => item.id === unionSpouseId);
      [related, other].forEach((parent) => {
        if (parent?.birthDate && birthDate <= parent.birthDate) {
          next.push(`La naissance doit être postérieure à celle de ${parent.firstName}.`);
        }
      });
    }
    if (isNew && relationshipType === 'child' && !unions.length && related?.birthDate && birthDate && birthDate <= related.birthDate) {
      next.push(`La naissance doit être postérieure à celle de ${related.firstName}.`);
    }
    if (isNew && (relationshipType === 'spouse' || (relationshipType === 'parent' && related && related.parentIds.length === 1))) {
      if (marriageDate && birthDate && marriageDate < birthDate) next.push('La date d’union doit suivre la naissance.');
      if (marriageDate && related?.birthDate && marriageDate < related.birthDate) {
        next.push(`La date d’union doit suivre la naissance de ${related.firstName}.`);
      }
    }
    return [...new Set(next)];
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (nextErrors.length) return;
    onSave({
      ...(person || {}),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      birthDate,
      deathDate: deceased ? deathDate : '',
      deceased,
      occupation,
      biography,
      photoUrl,
      birthPlace: person?.birthPlace || blank,
      deathPlace: person?.deathPlace || blank,
      unionSpouseId: unionSpouseId || undefined,
      marriageDate: marriageDate || undefined,
      parentExistingChildren,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="flex max-h-[min(88vh,760px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.85)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95"
      >
        <div className="relative border-b border-zinc-200/80 px-5 py-4 dark:border-white/10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-indigo-500/15 to-transparent" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">{isNew ? 'Ajout' : 'Modification'}</p>
              <h2 className="font-serif text-2xl text-zinc-950 dark:text-white">{title}</h2>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10" aria-label="Fermer">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto overscroll-contain px-5 py-4">
          {isNew && related && relationshipType && (
            <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/80 px-3 py-2 text-[13px] text-indigo-950 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-100">
              {relationshipType === 'child' && unions.length > 0 && `Cet enfant rejoint une union de ${related.firstName}. Une personne n’a qu’une union d’origine.`}
              {relationshipType === 'child' && unions.length === 0 && `${related.firstName} n’a pas encore de conjoint : l’enfant lui sera rattaché directement.`}
              {relationshipType === 'spouse' && `${related.firstName} accueille un nouveau conjoint. Le rang suit les unions déjà enregistrées.`}
              {relationshipType === 'parent' && related.parentIds.length >= 2 && `${related.firstName} a déjà deux parents.`}
              {relationshipType === 'parent' && related.parentIds.length === 1 && `Ce parent devient le conjoint du parent déjà connu, et ${related.firstName} est rattaché à cette union.`}
              {relationshipType === 'parent' && related.parentIds.length === 0 && `Ce parent est le premier parent de ${related.firstName}.`}
            </div>
          )}

          {errors.length > 0 && (
            <ul className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100">
              {errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          )}

          <div className="flex items-center gap-4">
            <div className="relative">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-lg text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                  {(firstName || lastName || '·').charAt(0).toUpperCase()}
                </div>
              )}
              <button type="button" onClick={() => photoRef.current?.click()} className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950 text-white" title="Photo">
                <Camera size={14} />
              </button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) readPhoto(file);
              }} />
            </div>
            <p className="text-[13px] text-zinc-500">La photo est enregistrée avec la fiche. Taille maximale 1,5 Mo.</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={labelClass}>Prénom
              <input className={inputClass} value={firstName} onChange={(event) => setFirstName(event.target.value)} />
            </label>
            <label className={labelClass}>Nom
              <input className={inputClass} value={lastName} onChange={(event) => setLastName(event.target.value)} />
            </label>
          </div>

          <div>
            <p className={labelClass}>Genre</p>
            <div className="mt-1 grid grid-cols-3 gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-700">
              {([['male', 'Homme'], ['female', 'Femme'], ['unknown', 'Inconnu']] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGender(value)}
                  className={`rounded-md px-2 py-1.5 text-[13px] ${gender === value ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950' : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {isNew && relationshipType === 'child' && unions.length > 0 && (
            <fieldset>
              <legend className={labelClass}>Union</legend>
              <div className="mt-1 space-y-1">
                {unions.map((marriage) => {
                  const spouseId = otherSpouseId(marriage, related?.id);
                  const spouse = allPersons.find((item) => item.id === spouseId);
                  return (
                    <label key={marriage.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-[13px] dark:border-zinc-700">
                      <input
                        type="radio"
                        name="union"
                        checked={unionSpouseId === spouseId}
                        onChange={() => setUnionSpouseId(spouseId)}
                      />
                      <span>{related?.firstName} et {spouse ? `${spouse.firstName} ${spouse.lastName}` : 'conjoint'}{marriage.rank ? ` · rang ${marriage.rank}` : ''}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {isNew && (relationshipType === 'spouse' || (relationshipType === 'parent' && related && related.parentIds.length === 1)) && (
            <label className={labelClass}>Date d’union
              <input type="date" className={inputClass} value={marriageDate} max={today} onChange={(event) => setMarriageDate(event.target.value)} />
            </label>
          )}

          {isNew && relationshipType === 'spouse' && related && related.childrenIds.length > 0 && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-[13px] text-amber-950 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-100">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={parentExistingChildren}
                onChange={(event) => setParentExistingChildren(event.target.checked)}
              />
              <span>
                <strong>Parenter les enfants de {related.firstName}</strong>
                <span className="mt-0.5 block text-amber-800/80 dark:text-amber-100/70">Le nouveau conjoint sera ajouté comme second parent uniquement aux enfants qui ne sont encore rattachés à aucune union.</span>
              </span>
            </label>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={labelClass}>Naissance
              <input type="date" className={inputClass} value={birthDate} max={today} onChange={(event) => setBirthDate(event.target.value)} />
            </label>
            <label className={labelClass}>Occupation
              <input className={inputClass} value={occupation} onChange={(event) => setOccupation(event.target.value)} />
            </label>
          </div>

          <label className="flex items-center gap-2 text-[13px] text-zinc-800 dark:text-zinc-100">
            <input type="checkbox" checked={deceased} onChange={(event) => setDeceased(event.target.checked)} />
            Personne décédée
          </label>
          {deceased && (
            <label className={labelClass}>Décès
              <input type="date" className={inputClass} value={deathDate} max={today} onChange={(event) => setDeathDate(event.target.value)} />
            </label>
          )}

          <label className={labelClass}>Biographie
            <textarea className={`${inputClass} min-h-24 resize-y`} value={biography} onChange={(event) => setBiography(event.target.value)} />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-200/80 px-5 py-3 dark:border-white/10">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-[13px] text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">
            Annuler
          </button>
          <button type="submit" className="rounded-lg bg-zinc-950 px-3 py-2 text-[13px] text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};

function otherSpouseId(marriage: Marriage, personId?: string) {
  if (!personId) return marriage.spouse2Id;
  return marriage.spouse1Id === personId ? marriage.spouse2Id : marriage.spouse1Id;
}

export default PersonFormModal;
