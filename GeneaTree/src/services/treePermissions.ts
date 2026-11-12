import type { LocalTreeRecord } from './localFamilyService';

export const CATALOG_EDITOR_EMAIL = 'kouokamasaph142@gmail.com';
let editorSession: { email: string | null; accessToken: string | null } = { email: null, accessToken: null };
export function setTreeEditorSession(email: string | null, accessToken: string | null) {
  editorSession = { email, accessToken };
}
export function getTreeEditorSession() { return editorSession; }
export function canEditTree(tree: LocalTreeRecord, email = editorSession.email): boolean {
  if (tree.predefinedId) return email?.toLowerCase() === CATALOG_EDITOR_EMAIL;
  return tree.role !== 'READER';
}
export function assertTreeEditable(tree: LocalTreeRecord) {
  if (!canEditTree(tree)) throw new Error('Cet arbre prédéfini est en lecture seule. Seul son propriétaire peut le modifier.');
}
