import React, { useState } from 'react';
import { DraftPerson } from '../model';

export const inputClass =
  'w-full rounded-xl border border-stone-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15 dark:border-white/10 dark:bg-white/5 dark:text-stone-50 dark:placeholder:text-stone-500';

export const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400';

const GENDERS: { id: DraftPerson['gender']; label: string }[] = [
  { id: 'male', label: 'Homme' },
  { id: 'female', label: 'Femme' },
  { id: 'unknown', label: 'Non précisé' },
];

interface PersonFormProps {
  value: Pick<
    DraftPerson,
    'firstName' | 'lastName' | 'gender' | 'birthDate' | 'city' | 'region' | 'country' | 'occupation' | 'deceased'
  >;
  onChange: (patch: Partial<DraftPerson>) => void;
  idPrefix: string;
  compact?: boolean;
}

const PersonForm: React.FC<PersonFormProps> = ({ value, onChange, idPrefix, compact = false }) => {
  const [open, setOpen] = useState(!compact);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Prénom</span>
          <input
            id={`${idPrefix}-first`}
            className={inputClass}
            value={value.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            placeholder="Amina"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className={labelClass}>Nom</span>
          <input
            id={`${idPrefix}-last`}
            className={inputClass}
            value={value.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            placeholder="Nkomo"
            autoComplete="off"
          />
        </label>
      </div>

      <fieldset>
        <legend className={labelClass}>Genre</legend>
        <div className="grid grid-cols-3 gap-2">
          {GENDERS.map((gender) => {
            const selected = value.gender === gender.id;
            return (
              <button
                key={gender.id}
                type="button"
                onClick={() => onChange({ gender: gender.id })}
                className={`cursor-pointer rounded-xl border px-2 py-2 text-sm transition ${
                  selected
                    ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                    : 'border-stone-200 bg-white/70 text-stone-700 hover:border-stone-300 dark:border-white/10 dark:bg-white/5 dark:text-stone-200'
                }`}
              >
                {gender.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="block">
        <span className={labelClass}>Naissance</span>
        <input
          type="date"
          className={inputClass}
          value={value.birthDate}
          onChange={(e) => onChange({ birthDate: e.target.value })}
        />
      </label>

      {compact && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="cursor-pointer text-sm font-medium text-primary-700 underline-offset-4 hover:underline dark:text-primary-300"
        >
          {open ? 'Masquer le lieu et la profession' : 'Lieu, profession, vivant ou non'}
        </button>
      )}

      {open && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className={labelClass}>Ville</span>
              <input className={inputClass} value={value.city} onChange={(e) => onChange({ city: e.target.value })} placeholder="Douala" />
            </label>
            <label className="block">
              <span className={labelClass}>Région</span>
              <input className={inputClass} value={value.region} onChange={(e) => onChange({ region: e.target.value })} placeholder="Littoral" />
            </label>
            <label className="block">
              <span className={labelClass}>Pays</span>
              <input className={inputClass} value={value.country} onChange={(e) => onChange({ country: e.target.value })} placeholder="Cameroun" />
            </label>
          </div>
          <label className="block">
            <span className={labelClass}>Profession</span>
            <input
              className={inputClass}
              value={value.occupation}
              onChange={(e) => onChange({ occupation: e.target.value })}
              placeholder="Cultivateur, enseignante, chef…"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-stone-700 dark:text-stone-200">
            <input
              type="checkbox"
              checked={value.deceased}
              onChange={(e) => onChange({ deceased: e.target.checked })}
              className="h-4 w-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
            />
            Cette personne est décédée
          </label>
        </div>
      )}
    </div>
  );
};

export default PersonForm;
