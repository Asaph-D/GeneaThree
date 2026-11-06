export function normalizeDiscoveryDates(tree) {
  let corrected = 0;
  for (const person of tree.persons) {
    for (const [field, label] of [['birthDate', 'naissance'], ['deathDate', 'décès']]) {
      const value = person[field];
      if (!value) continue;
      const parsed = new Date(value);
      const exact = /^\d{4}-\d{2}-\d{2}$/.test(value)
        && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
      if (exact) continue;
      const note = `Date source à vérifier (${label}, indication incomplète) : ${value}.`;
      person.notes = [person.notes, note].filter(Boolean).join('\n');
      person[field] = '';
      corrected++;
    }
  }
  return corrected;
}
