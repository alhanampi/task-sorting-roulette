import "dotenv/config";
import express from "express";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

const PORT = 3001;
const app = express();
app.use(express.json());

const connectionString = process.env.VITE_NEON_DB;
if (!connectionString) throw new Error("VITE_NEON_DB is not set");
const sql = neon(connectionString);

const resend = new Resend(process.env.VITE_RESEND_API_KEY);
// Update FROM_EMAIL to your verified Resend domain before deploying
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Task Sorter <onboarding@resend.dev>";

// ── Row mappers ───────────────────────────────────────────────────────────

function rowToUser(row: Record<string, unknown>) {
  return {
    email: row.email as string,
    username: row.username as string,
    password: "clerk-auth",
    points: Number(row.points),
    partnerEmail: (row.partner_email as string | null) ?? undefined,
    assignedTaskId: (row.assigned_task_id as string | null) ?? undefined,
  };
}

function rowToTask(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    title: row.title as string,
    difficulty: Number(row.difficulty),
    ownerEmail: row.owner_email as string,
    completed: Boolean(row.completed),
    createdAt: Number(row.created_at),
  };
}

// ── Routes ────────────────────────────────────────────────────────────────

app.post("/api/load-user", async (req, res) => {
  try {
    const { email } = req.body as { email: string };
    const [userRows, taskRows] = await Promise.all([
      sql`SELECT * FROM users WHERE email = ${email}`,
      sql`SELECT * FROM tasks WHERE owner_email = ${email} ORDER BY created_at ASC`,
    ]);

    if (!userRows[0]) {
      res.json({ user: null, tasks: [], partner: null });
      return;
    }

    const user = rowToUser(userRows[0] as Record<string, unknown>);
    const tasks = (taskRows as Record<string, unknown>[]).map(rowToTask);

    let partner = null;
    if (user.partnerEmail) {
      const partnerRows =
        await sql`SELECT * FROM users WHERE email = ${user.partnerEmail}`;
      if (partnerRows[0])
        partner = rowToUser(partnerRows[0] as Record<string, unknown>);
    }

    res.json({ user, tasks, partner });
  } catch (err) {
    console.error("/api/load-user", err);
    res.status(500).json({ error: "db error" });
  }
});

app.post("/api/fetch-user", async (req, res) => {
  try {
    const { email } = req.body as { email: string };
    const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
    res.json({
      user: rows[0]
        ? rowToUser(rows[0] as Record<string, unknown>)
        : null,
    });
  } catch (err) {
    console.error("/api/fetch-user", err);
    res.status(500).json({ error: "db error" });
  }
});

app.post("/api/upsert-user", async (req, res) => {
  try {
    const { user } = req.body as {
      user: {
        email: string;
        username: string;
        points: number;
        partnerEmail?: string;
        assignedTaskId?: string;
      };
    };
    await sql`
      INSERT INTO users (email, username, points, partner_email, assigned_task_id)
      VALUES (
        ${user.email},
        ${user.username},
        ${user.points},
        ${user.partnerEmail ?? null},
        ${user.assignedTaskId ?? null}
      )
      ON CONFLICT (email) DO UPDATE SET
        username         = EXCLUDED.username,
        points           = EXCLUDED.points,
        partner_email    = EXCLUDED.partner_email,
        assigned_task_id = EXCLUDED.assigned_task_id
    `;
    res.json({ ok: true });
  } catch (err) {
    console.error("/api/upsert-user", err);
    res.status(500).json({ error: "db error" });
  }
});

app.post("/api/insert-task", async (req, res) => {
  try {
    const { task } = req.body as {
      task: {
        id: string;
        title: string;
        difficulty: number;
        ownerEmail: string;
        completed: boolean;
        createdAt: number;
      };
    };
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
    res.json({ ok: true });
  } catch (err) {
    console.error("/api/insert-task", err);
    res.status(500).json({ error: "db error" });
  }
});

app.post("/api/update-task", async (req, res) => {
  try {
    const { task } = req.body as {
      task: {
        id: string;
        title: string;
        difficulty: number;
        completed: boolean;
      };
    };
    await sql`
      UPDATE tasks
      SET title      = ${task.title},
          difficulty = ${task.difficulty},
          completed  = ${task.completed}
      WHERE id = ${task.id}
    `;
    res.json({ ok: true });
  } catch (err) {
    console.error("/api/update-task", err);
    res.status(500).json({ error: "db error" });
  }
});

// ── Partner requests ──────────────────────────────────────────────────────

app.post("/api/partner-request/send", async (req, res) => {
  try {
    const { fromEmail, toEmail } = req.body as { fromEmail: string; toEmail: string };

    if (fromEmail === toEmail) {
      res.status(400).json({ error: "cannotLinkSelf" });
      return;
    }

    const [fromRows, toRows] = await Promise.all([
      sql`SELECT * FROM users WHERE email = ${fromEmail}`,
      sql`SELECT * FROM users WHERE email = ${toEmail}`,
    ]);

    if (!fromRows[0]) { res.status(404).json({ error: "fromUserNotFound" }); return; }
    if (!toRows[0])   { res.status(404).json({ error: "toUserNotFound" }); return; }

    const existing = await sql`
      SELECT id FROM partner_requests
      WHERE (from_email = ${fromEmail} AND to_email = ${toEmail})
         OR (from_email = ${toEmail}   AND to_email = ${fromEmail})
    `;
    if (existing.length > 0) {
      res.status(409).json({ error: "requestAlreadyExists" });
      return;
    }

    const id = crypto.randomUUID();
    const createdAt = Date.now();
    await sql`
      INSERT INTO partner_requests (id, from_email, to_email, status, created_at)
      VALUES (${id}, ${fromEmail}, ${toEmail}, 'pending', ${createdAt})
    `;

    const fromUser = rowToUser(fromRows[0] as Record<string, unknown>);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `${fromUser.username} quiere ser tu compañero en Task Sorter`,
      html: `
        <p>Hola,</p>
        <p><strong>${fromUser.username}</strong> (${fromEmail}) te ha enviado una solicitud para vincularse contigo en <strong>Task Sorter</strong>.</p>
        <p>Inicia sesión en la app para aceptar o rechazar la solicitud.</p>
      `,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("/api/partner-request/send", err);
    res.status(500).json({ error: "db error" });
  }
});

app.post("/api/partner-request/pending", async (req, res) => {
  try {
    const { email } = req.body as { email: string };
    const rows = await sql`
      SELECT pr.*, u.username AS from_username
      FROM partner_requests pr
      JOIN users u ON u.email = pr.from_email
      WHERE pr.to_email = ${email} AND pr.status = 'pending'
      ORDER BY pr.created_at ASC
    `;
    const requests = (rows as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      fromEmail: r.from_email as string,
      fromUsername: r.from_username as string,
      toEmail: r.to_email as string,
      status: r.status as string,
      createdAt: Number(r.created_at),
    }));
    res.json({ requests });
  } catch (err) {
    console.error("/api/partner-request/pending", err);
    res.status(500).json({ error: "db error" });
  }
});

app.post("/api/partner-request/respond", async (req, res) => {
  try {
    const { id, response } = req.body as { id: string; response: "accepted" | "rejected" };

    const rows = await sql`SELECT * FROM partner_requests WHERE id = ${id}`;
    if (!rows[0]) { res.status(404).json({ error: "requestNotFound" }); return; }

    const req_ = rows[0] as Record<string, unknown>;
    const fromEmail = req_.from_email as string;
    const toEmail   = req_.to_email   as string;

    await sql`UPDATE partner_requests SET status = ${response} WHERE id = ${id}`;

    if (response === "accepted") {
      await Promise.all([
        sql`UPDATE users SET partner_email = ${toEmail}   WHERE email = ${fromEmail}`,
        sql`UPDATE users SET partner_email = ${fromEmail} WHERE email = ${toEmail}`,
      ]);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("/api/partner-request/respond", err);
    res.status(500).json({ error: "db error" });
  }
});

app.listen(PORT, () =>
  console.log(`API server listening on http://localhost:${PORT}`)
);
