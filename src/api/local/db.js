import Dexie from 'dexie';

// Local IndexedDB store. Replaces base44's hosted entity store.
// Schema: primary key `id` (string), indexes for fields we sort/filter by.
export const db = new Dexie('ragmd');

db.version(1).stores({
  Document: 'id, status, created_date, updated_date, title, file_type',
  ChatConversation: 'id, document_id, created_date, updated_date',
  Files: 'id',
});

export function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
