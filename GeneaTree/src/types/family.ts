// -------------------------
// Reusable Types
// -------------------------
export interface ContactInfo {
  email?: string;
  phone?: string;
}

export interface Location {
  city: string;
  region: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  fullAddress?: string;
}

// -------------------------
// Event Interface
// -------------------------
export interface LifeEvent {
  id: string;
  type: 'birth' | 'death' | 'marriage' | 'divorce' | 'baptism' | 'adoption' | 'custom';
  date: string;
  location: Location;
  description?: string;
  relatedPersonIds: string[];
}

// -------------------------
// Gender Type
// -------------------------
export type GenderType = 'male' | 'female' | 'unknown';

// -------------------------
// Core Person Entity
// -------------------------
export interface Person extends CollectorPerson{
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: Location;
  deathDate?: string;
  deathPlace?: Location;
  gender: GenderType;
  occupation?: string;
  deceased: boolean;
  photoUrl?: string;
  biography?: string;
  notes?: string;
  contact?: ContactInfo;
  parentIds: string[];
  childrenIds: string[];
  spouseIds: string[];
  siblingIds?: string[];
  eventIds?: string[];
}

// -------------------------
// Marriage Relationship
// -------------------------
export interface Marriage {
  id: string;
  spouse1Id: string;
  spouse2Id: string;
  marriageDate?: string;
  divorceDate?: string;
  location?: Location;
  childrenIds?: string[];
  eventId?: string;
  /** Ordre de l'union pour une même ancre : 1 = première, 2 = deuxième… */
  rank?: number;
}

// -------------------------
// Family Statistics
// -------------------------
export interface FamilyStats {
  totalPeople: number;
  generations: number;
  averageAge: number;
  maxAge: {
    age: number;
    person: Person;
  };
  countries: string[];
}

// -------------------------
// Tree View Options
// -------------------------
export interface TreeViewOptions {
  viewType: 'tree' | 'radial' | 'vertical' | 'timeline';
  generations: number;
  focusPersonId: string;
}

// -------------------------
// Form & Collection Types
// -------------------------
export type QuestionType = 'text' | 'date' | 'select' | 'yesno' | 'number' | 'location' | 'url' | 'firstName' | 'lastName' | 'occupation' | 'city' | 'region' | 'country';

export interface ValidationRule {
  type: QuestionType;
  message: string;
  validate: (value: string) => boolean;
}

export const ValidationRules: Record<QuestionType, ValidationRule> = {
  text: {
    type: 'text',
    message: 'Veuillez entrer un texte valide',
    validate: (value: string) => value.trim().length > 0,
  },
  date: {
    type: 'date',
    message: 'Veuillez entrer une date valide',
    validate: (value: string) => !isNaN(new Date(value).getTime()),
  },
  select: {
    type: 'select',
    message: 'Veuillez sélectionner une option valide',
    validate: (value: string) => value.trim().length > 0,
  },
  yesno: {
    type: 'yesno',
    message: 'Veuillez répondre par oui ou non',
    validate: (value: string) => ['oui', 'non', 'yes', 'no'].includes(value.toLowerCase().trim()),
  },
  number: {
    type: 'number',
    message: 'Veuillez entrer un nombre valide',
    validate: (value: string) => /^\d+$/.test(value),
  },
  location: {
    type: 'location',
    message: 'Veuillez entrer une localisation valide',
    validate: (value: string) => value.trim().length > 0,
  },
  url: {
    type: 'url',
    message: 'Veuillez entrer une URL valide',
    validate: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
  },
  firstName: {
    type: 'firstName',
    message: 'Veuillez entrer un prénom valide',
    validate: (value: string) => value.trim().length > 0,
  },
  lastName: {
    type: 'lastName',
    message: 'Veuillez entrer un nom de famille valide',
    validate: (value: string) => value.trim().length > 0,
  },
  occupation: {
    type: 'occupation',
    message: 'Veuillez entrer une profession valide',
    validate: (value: string) => value.trim().length > 0,
  },
  city: {
    type: 'city',
    message: 'Veuillez entrer une ville valide',
    validate: (value: string) => value.trim().length > 0,
  },
  region: {
    type: 'region',
    message: 'Veuillez entrer une région valide',
    validate: (value: string) => value.trim().length > 0,
  },
  country: {
    type: 'country',
    message: 'Veuillez entrer un pays valide',
    validate: (value: string) => value.trim().length > 0,
  },
};

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  validation?: (answer: string) => ValidationResult;
  field: string;
  options?: string[];
  required?: boolean;
  personId?: string;
  relationshipContext?: string;
}

export interface CollectorPerson {
  id: string;
  firstName: string;
  lastName?: string;
  birthDate?: string;
  gender?: GenderType;
  occupation?: string;
  city?: string;
  region?: string;
  country?: string;
  deceased?: boolean;
  parentIds: string[];
  childrenIds: string[];
  spouseIds: string[];
  siblingIds: string[];
  relationship?: 'father' | 'mother' | 'spouse' | 'child' | 'sibling' | 'grandparent' | 'grandchild' | 'uncle_aunt' | 'cousin';
}

export interface CollectionState {
  currentPersonId: string | null;
  people: Record<string, CollectorPerson>;
  completedPhases: string[];
  currentPhase: string;
  pendingRelatives: Array<{ id: string; relation: string }>;
  familyDepth: number;
  siblingCount?: number;
  currentSiblingIndex?: number;
}

// -------------------------
// Normalized Application State
// -------------------------
export interface NormalizedFamilyTreeState {
  people: Record<string, Person>;
  allPersonIds: string[];
  marriages: Record<string, Marriage>;
  events: Record<string, LifeEvent>;
  selectedPersonId: string | null;
  loading: boolean;
  error: string | null;
}

// Add types for the extended person used in D3 processing
export interface ExtendedPerson extends Person {
  relationship?: string;
  isSpouse?: boolean;
  children?: ExtendedPerson[];
  parents?: ExtendedPerson[];
  siblings?: ExtendedPerson[];
  extended?: {
    uncles?: ExtendedPerson[];
    aunts?: ExtendedPerson[];
    cousins?: ExtendedPerson[];
    grandparents?: ExtendedPerson[];
    grandchildren?: ExtendedPerson[];
    nieces_nephews?: ExtendedPerson[];
    great_grandparents?: ExtendedPerson[];
  };
}

// For form handling
export type PartialPerson = Partial<Person>;

export interface FormState {
  currentStep: number;
  formData: PartialPerson;
  questions: Question[];
  currentPersonRelation?: string;
  currentPersonId?: string;
}

export interface VoiceRecognitionState {
  isListening: boolean;
  transcript: string;
}
