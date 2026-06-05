# Neon Database Guidelines

## Architecture: server-side only

The Neon client (`@neondatabase/serverless`) **must never be imported from client-side code**. All SQL runs exclusively in [`server/index.ts`](../server/index.ts).

```
Client (browser)
  └─ db/queries.ts          ← fetch() calls to /api/* — NO SQL here
       └─ server/index.ts   ← neon tagged template literals — SQL lives here
            └─ Neon (cloud)
```

[`db/client.ts`](../db/client.ts) is intentionally empty. Do **not** add imports to `@neondatabase/serverless` there.

---

## Connection

The connection string is read from the `VITE_NEON_DB` environment variable, available only to the server process via `dotenv`:

```ts
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.VITE_NEON_DB!);
```

- Define `VITE_NEON_DB` in `.env` (never commit this file).
- Throw at startup if the variable is missing — fail fast, not at query time.

```ts
// ✅
if (!connectionString) throw new Error("VITE_NEON_DB is not set");
const sql = neon(connectionString);
```

---

## Writing SQL

### Always use the tagged template literal

The `sql` function is a tagged template literal. It automatically parameterizes every interpolated value, preventing SQL injection.

```ts
// ✅ Safe — value is parameterized
const rows = await sql`SELECT * FROM users WHERE email = ${email}`;

// ❌ NEVER concatenate strings — SQL injection risk
const rows = await sql(`SELECT * FROM users WHERE email = '${email}'`);
```

### Multi-line queries

Format multi-line queries as indented template literals. Align SQL keywords for readability:

```ts
await sql`
  INSERT INTO tasks (id, title, difficulty, owner_email, completed, created_at)
  VALUES (
    ${task.id},
    ${task.title},
    ${task.difficulty},
    ${task.ownerEmail},
    ${task.completed},
    ${task.createdAt}
  )
`;
```

### UPSERT pattern

Use `ON CONFLICT ... DO UPDATE SET` for upserts. Never do a SELECT + conditional INSERT/UPDATE in two round-trips:

```ts
await sql`
  INSERT INTO users (email, username, points, partner_email, assigned_task_id)
  VALUES (${u.email}, ${u.username}, ${u.points}, ${u.partnerEmail ?? null}, ${u.assignedTaskId ?? null})
  ON CONFLICT (email) DO UPDATE SET
    username         = EXCLUDED.username,
    points           = EXCLUDED.points,
    partner_email    = EXCLUDED.partner_email,
    assigned_task_id = EXCLUDED.assigned_task_id
`;
```

---

## Row mappers

Every table has a dedicated mapper function that converts a raw `Record<string, unknown>` row into a typed interface. Define mappers at the top of `server/index.ts`, before the routes.

```ts
function rowToUser(row: Record<string, unknown>): IUser {
  return {
    email: row.email as string,
    username: row.username as string,
    password: "clerk-auth",
    points: Number(row.points),
    partnerEmail: (row.partner_email as string | null) ?? undefined,
    assignedTaskId: (row.assigned_task_id as string | null) ?? undefined,
  };
}
```

- Never inline field access logic inside route handlers — always call the mapper.
- Cast each field explicitly (`as string`, `Number(...)`, `Boolean(...)`) — Neon returns `unknown`.
- Map DB snake_case columns → TS camelCase fields in the mapper, nowhere else.

---

## Routes

### One route per operation

Each Express route does exactly one logical DB operation (or a parallel batch of related ones). Never share a route for multiple unrelated operations.

```ts
app.post("/api/load-user", async (req, res) => { ... });
app.post("/api/upsert-user", async (req, res) => { ... });
app.post("/api/insert-task", async (req, res) => { ... });
app.post("/api/update-task", async (req, res) => { ... });
```

### Error handling

Every route must be wrapped in `try/catch`. Log with `console.error`, return HTTP 500 with `{ error: "db error" }`. Never expose internal error details to the client.

```ts
app.post("/api/upsert-user", async (req, res) => {
  try {
    // ... query
    res.json({ ok: true });
  } catch (err) {
    console.error("/api/upsert-user", err);
    res.status(500).json({ error: "db error" });
  }
});
```

### Parallel queries with `Promise.all`

When a route needs data from two independent tables, fetch them in parallel:

```ts
const [userRows, taskRows] = await Promise.all([
  sql`SELECT * FROM users WHERE email = ${email}`,
  sql`SELECT * FROM tasks WHERE owner_email = ${email} ORDER BY created_at ASC`,
]);
```

---

## Client-side API calls (`db/queries.ts`)

All client code calls the Express API through the helper functions in [`db/queries.ts`](../db/queries.ts). No fetch logic should be duplicated in components or pages.

```ts
// ✅ Use the query helper
import { insertTask } from "../db/queries";
await insertTask(newTask);

// ❌ Never fetch /api directly from a component
await fetch("/api/insert-task", { ... });
```

When adding a new server route, also add the corresponding typed function to `db/queries.ts`.

### Error propagation

Query helpers throw on non-OK responses. Catch errors at the call site (page/handler level) and show user-facing feedback:

```ts
loadUserData(authEmail).catch(() =>
  setMessage("Error al cargar datos. Recarga la página.")
);
```

---

## Schema conventions

| Concern        | Convention                                       |
| -------------- | ------------------------------------------------ |
| Column naming  | `snake_case`                                     |
| Primary keys   | `id TEXT` (client-generated as `Date.now()-nanoid`) |
| Timestamps     | `created_at BIGINT` (Unix ms from `Date.now()`) |
| Nullable FK    | `TEXT NULL` with `?? null` on insert             |
| Boolean        | `BOOLEAN` — cast with `Boolean(row.completed)` in mapper |

---

## What NOT to do

| Anti-pattern                                              | Why                                    |
| --------------------------------------------------------- | -------------------------------------- |
| Import `neon` from a client file                          | Exposes credentials, breaks the bundle |
| String-concatenate user input into SQL                    | SQL injection                          |
| Read DB rows in components without going through `/api`   | Bypasses auth, breaks separation       |
| Use `SELECT *` in production queries without a mapper     | Fragile to schema changes              |
| Swallow DB errors silently                                | Hides bugs, corrupts state             |
