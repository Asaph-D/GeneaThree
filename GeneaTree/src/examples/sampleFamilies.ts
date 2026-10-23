import { Marriage, Person } from '../types/family';

export interface SampleFamily {
  id: string;
  label: string;
  focusId: string;
  persons: Person[];
  marriages: Marriage[];
}

const place = (city: string) => ({ city, region: '', country: 'Cameroun' });

function person(
  id: string,
  firstName: string,
  lastName: string,
  gender: Person['gender'],
  birthDate: string,
  city: string
): Person {
  return {
    id,
    firstName,
    lastName,
    gender,
    birthDate,
    birthPlace: place(city),
    deceased: false,
    occupation: '',
    parentIds: [],
    childrenIds: [],
    spouseIds: [],
    siblingIds: [],
  };
}

function assemble(people: Person[], marriages: Marriage[]): { persons: Person[]; marriages: Marriage[] } {
  const byId = new Map(people.map((item) => [item.id, {
    ...item,
    parentIds: [] as string[],
    childrenIds: [] as string[],
    spouseIds: [] as string[],
    siblingIds: [] as string[],
  }]));

  marriages.forEach((marriage) => {
    const anchor = byId.get(marriage.spouse1Id);
    const spouse = byId.get(marriage.spouse2Id);
    if (anchor && spouse) {
      if (!anchor.spouseIds.includes(spouse.id)) anchor.spouseIds.push(spouse.id);
      if (!spouse.spouseIds.includes(anchor.id)) spouse.spouseIds.push(anchor.id);
    }
    const childIds = marriage.childrenIds ?? [];
    childIds.forEach((childId) => {
      const child = byId.get(childId);
      if (!child) return;
      [anchor, spouse].forEach((parent) => {
        if (!parent) return;
        if (!child.parentIds.includes(parent.id)) child.parentIds.push(parent.id);
        if (!parent.childrenIds.includes(child.id)) parent.childrenIds.push(child.id);
      });
    });
    childIds.forEach((childId, index) => {
      const child = byId.get(childId);
      if (!child) return;
      childIds.forEach((siblingId, siblingIndex) => {
        if (index === siblingIndex) return;
        if (!child.siblingIds) child.siblingIds = [];
        if (!child.siblingIds.includes(siblingId)) child.siblingIds.push(siblingId);
      });
    });
  });

  return { persons: [...byId.values()], marriages };
}

function monogame(): SampleFamily {
  const people = [
    person('mo-paul', 'Paul', 'Essomba', 'male', '1942-04-12', 'Yaoundé'),
    person('mo-marie', 'Marie', 'Essomba', 'female', '1946-09-03', 'Yaoundé'),
    person('mo-jean', 'Jean', 'Essomba', 'male', '1968-01-20', 'Yaoundé'),
    person('mo-claire', 'Claire', 'Essomba', 'female', '1971-06-14', 'Douala'),
    person('mo-anne', 'Anne', 'Nkolo', 'female', '1970-11-02', 'Yaoundé'),
    person('mo-marc', 'Marc', 'Nkolo', 'male', '1967-03-18', 'Bafoussam'),
    person('mo-alice', 'Alice', 'Essomba', 'female', '1996-05-09', 'Douala'),
    person('mo-david', 'David', 'Essomba', 'male', '1999-12-01', 'Douala'),
    person('mo-lucie', 'Lucie', 'Nkolo', 'female', '1995-08-22', 'Bafoussam'),
    person('mo-petit', 'Paul', 'Nkolo', 'male', '1998-02-17', 'Bafoussam'),
  ];
  const marriages: Marriage[] = [
    { id: 'mo-u1', spouse1Id: 'mo-paul', spouse2Id: 'mo-marie', rank: 1, childrenIds: ['mo-jean', 'mo-anne'] },
    { id: 'mo-u2', spouse1Id: 'mo-jean', spouse2Id: 'mo-claire', rank: 1, childrenIds: ['mo-alice', 'mo-david'] },
    { id: 'mo-u3', spouse1Id: 'mo-anne', spouse2Id: 'mo-marc', rank: 1, childrenIds: ['mo-lucie', 'mo-petit'] },
  ];
  const built = assemble(people, marriages);
  return { id: 'monogame', label: 'Famille monogame', focusId: 'mo-jean', ...built };
}

function polygame(): SampleFamily {
  const people = [
    person('po-samuel', 'Samuel', 'Onana', 'male', '1938-07-01', 'Foumban'),
    person('po-ruth', 'Ruth', 'Onana', 'female', '1944-02-11', 'Foumban'),
    person('po-esther', 'Esther', 'Onana', 'female', '1948-10-05', 'Foumban'),
    person('po-debora', 'Débora', 'Onana', 'female', '1952-01-28', 'Koutaba'),
    person('po-abel', 'Abel', 'Onana', 'male', '1966-04-04', 'Foumban'),
    person('po-noe', 'Noé', 'Onana', 'male', '1969-09-15', 'Foumban'),
    person('po-sarah', 'Sarah', 'Onana', 'female', '1972-12-03', 'Foumban'),
    person('po-joseph', 'Joseph', 'Onana', 'male', '1974-06-19', 'Foumban'),
    person('po-benjamin', 'Benjamin', 'Onana', 'male', '1977-03-08', 'Foumban'),
    person('po-daniel', 'Daniel', 'Onana', 'male', '1980-11-23', 'Foumban'),
    person('po-lea', 'Léa', 'Onana', 'female', '1970-05-02', 'Bafoussam'),
    person('po-rachel', 'Rachel', 'Onana', 'female', '1974-08-30', 'Dschang'),
    person('po-isaac', 'Isaac', 'Onana', 'male', '1994-01-12', 'Bafoussam'),
    person('po-rebecca', 'Rebecca', 'Onana', 'female', '1997-07-07', 'Bafoussam'),
    person('po-dina', 'Dina', 'Onana', 'female', '1999-04-18', 'Dschang'),
  ];
  const marriages: Marriage[] = [
    { id: 'po-u1', spouse1Id: 'po-samuel', spouse2Id: 'po-ruth', rank: 1, childrenIds: ['po-abel', 'po-noe'] },
    { id: 'po-u2', spouse1Id: 'po-samuel', spouse2Id: 'po-esther', rank: 2, childrenIds: ['po-sarah'] },
    { id: 'po-u3', spouse1Id: 'po-samuel', spouse2Id: 'po-debora', rank: 3, childrenIds: ['po-joseph', 'po-benjamin', 'po-daniel'] },
    { id: 'po-u4', spouse1Id: 'po-abel', spouse2Id: 'po-lea', rank: 1, childrenIds: ['po-isaac', 'po-rebecca'] },
    { id: 'po-u5', spouse1Id: 'po-abel', spouse2Id: 'po-rachel', rank: 2, childrenIds: ['po-dina'] },
  ];
  const built = assemble(people, marriages);
  return { id: 'polygame', label: 'Famille polygame', focusId: 'po-samuel', ...built };
}

function recomposee(): SampleFamily {
  const people = [
    person('re-andre', 'André', 'Bella', 'male', '1940-03-03', 'Ebolowa'),
    person('re-helen', 'Hélène', 'Bella', 'female', '1943-12-12', 'Ebolowa'),
    person('re-pierre', 'Pierre', 'Bella', 'male', '1965-05-05', 'Ebolowa'),
    person('re-aida', 'Aïda', 'Bella', 'female', '1968-08-08', 'Sangmélima'),
    person('re-simon', 'Simon', 'Bella', 'male', '1967-02-02', 'Ebolowa'),
    person('re-first', 'Nadia', 'Bella', 'female', '1969-01-15', 'Yaoundé'),
    person('re-second', 'Chantal', 'Bella', 'female', '1973-09-09', 'Yaoundé'),
    person('re-leo', 'Léo', 'Bella', 'male', '1992-04-04', 'Sangmélima'),
    person('re-mina', 'Mina', 'Bella', 'female', '1994-06-06', 'Sangmélima'),
    person('re-eric', 'Éric', 'Bella', 'male', '1991-10-10', 'Yaoundé'),
    person('re-ines', 'Inès', 'Bella', 'female', '1998-03-21', 'Yaoundé'),
    person('re-joel', 'Joël', 'Bella', 'male', '2001-07-14', 'Yaoundé'),
  ];
  const marriages: Marriage[] = [
    { id: 're-u1', spouse1Id: 're-andre', spouse2Id: 're-helen', rank: 1, childrenIds: ['re-pierre', 're-simon'] },
    { id: 're-u2', spouse1Id: 're-pierre', spouse2Id: 're-aida', rank: 1, childrenIds: ['re-leo', 're-mina'] },
    { id: 're-u3', spouse1Id: 're-simon', spouse2Id: 're-first', rank: 1, childrenIds: ['re-eric'] },
    { id: 're-u4', spouse1Id: 're-simon', spouse2Id: 're-second', rank: 2, childrenIds: ['re-ines', 're-joel'] },
  ];
  const built = assemble(people, marriages);
  return { id: 'recomposee', label: 'Cousins et unions successives', focusId: 're-simon', ...built };
}

export const SAMPLE_FAMILIES: SampleFamily[] = [monogame(), polygame(), recomposee()];

export function getSampleFamily(id: string): SampleFamily {
  return SAMPLE_FAMILIES.find((family) => family.id === id) ?? SAMPLE_FAMILIES[0];
}
