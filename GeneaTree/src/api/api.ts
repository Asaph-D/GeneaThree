import { BehaviorSubject } from 'rxjs';
import { LifeEvent, Marriage, Person } from '../types/family';
import { API_BASE_URL } from '../config/api';

const API_BASE = API_BASE_URL;

// Observables for each resource
export const people$ = new BehaviorSubject<Person[]>([]);
export const marriages$ = new BehaviorSubject<Marriage[]>([]);
export const lifeEvents$ = new BehaviorSubject<LifeEvent[]>([]);

// Fetch and update people
export async function fetchPeople() {
  const res = await fetch(`${API_BASE}/people`);
  if (!res.ok) throw new Error('Failed to fetch people');
  const data = await res.json();
  people$.next(data);
}

// Fetch and update marriages
export async function fetchMarriages() {
  const res = await fetch(`${API_BASE}/marriages`);
  if (!res.ok) throw new Error('Failed to fetch marriages');
  const data = await res.json();
  marriages$.next(data);
}

// Fetch and update life events
export async function fetchLifeEvents() {
  const res = await fetch(`${API_BASE}/life-events`);
  if (!res.ok) throw new Error('Failed to fetch life events');
  const data = await res.json();
  lifeEvents$.next(data);
}

// Utility: fetch all
export async function fetchAll() {
  await Promise.all([fetchPeople(), fetchMarriages(), fetchLifeEvents()]);
}

// CRUD Person
export async function createPerson(person: Omit<Person, 'id'>) {
  const res = await fetch(`${API_BASE}/people`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(person)
  });
  if (!res.ok) throw new Error('Failed to create person');
  await fetchPeople();
}

export async function updatePerson(person: Person) {
  const res = await fetch(`${API_BASE}/people/${person.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(person)
  });
  if (!res.ok) throw new Error('Failed to update person');
  await fetchPeople();
}

export async function deletePerson(personId: string) {
  const res = await fetch(`${API_BASE}/people/${personId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete person');
  await fetchPeople();
}

// Reset data (if your backend supports it)
export async function resetData() {
  const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset data');
  await fetchAll();
}

// fetchData for compatibility with DemoPage
export async function fetchData() {
  await fetchAll();
  return {
    persons: people$.getValue(),
    marriages: marriages$.getValue(),
  };
}

// You can add CRUD methods here as needed, using fetch and updating the BehaviorSubjects
