import { db, newId } from './db';

// Entity adapter that mirrors base44's `entities.<Name>.<method>` shape.
// Supported: list(orderBy, limit), filter(criteria, orderBy?, limit?),
// create(data), update(id, partial), delete(id), get(id).

function parseOrderBy(orderBy) {
  if (!orderBy) return null;
  const desc = orderBy.startsWith('-');
  return { field: desc ? orderBy.slice(1) : orderBy, desc };
}

function applyOrderAndLimit(rows, orderBy, limit) {
  let out = rows;
  const order = parseOrderBy(orderBy);
  if (order) {
    out = [...out].sort((a, b) => {
      const av = a[order.field];
      const bv = b[order.field];
      if (av === bv) return 0;
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;
      const cmp = av > bv ? 1 : -1;
      return order.desc ? -cmp : cmp;
    });
  }
  if (typeof limit === 'number') out = out.slice(0, limit);
  return out;
}

function matches(row, criteria) {
  return Object.entries(criteria).every(([k, v]) => row[k] === v);
}

function makeEntity(tableName) {
  const table = db.table(tableName);

  return {
    async list(orderBy, limit) {
      const rows = await table.toArray();
      return applyOrderAndLimit(rows, orderBy, limit);
    },

    async filter(criteria = {}, orderBy, limit) {
      const rows = await table.toArray();
      const filtered = rows.filter(r => matches(r, criteria));
      return applyOrderAndLimit(filtered, orderBy, limit);
    },

    async get(id) {
      return (await table.get(id)) || null;
    },

    async create(data) {
      const now = new Date().toISOString();
      const row = {
        id: newId(),
        created_date: now,
        updated_date: now,
        ...data,
      };
      await table.put(row);
      return row;
    },

    async update(id, partial) {
      const existing = await table.get(id);
      if (!existing) throw new Error(`${tableName} ${id} not found`);
      const updated = {
        ...existing,
        ...partial,
        id,
        updated_date: new Date().toISOString(),
      };
      await table.put(updated);
      return updated;
    },

    async delete(id) {
      await table.delete(id);
      return { id };
    },
  };
}

export const entities = {
  Document: makeEntity('Document'),
  ChatConversation: makeEntity('ChatConversation'),
};
