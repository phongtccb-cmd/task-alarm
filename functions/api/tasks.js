// functions/api/tasks.js
export async function onRequestGet(context) {
  const { DB } = context.env;
  const { results } = await DB.prepare(
    "SELECT * FROM tasks WHERE status IN ('pending', 'completed') ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, due_at ASC"
  ).all();
  return Response.json(results);
}

export async function onRequestPost(context) {
  const { DB } = context.env;
  let payload;
  try {
    payload = await context.request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const dueAt = typeof payload.due_at === "string" ? new Date(payload.due_at) : null;

  if (!title || title.length > 300 || !dueAt || !Number.isFinite(dueAt.getTime())) {
    return Response.json({ error: "A title and valid due_at are required" }, { status: 400 });
  }

  await DB.prepare("INSERT INTO tasks (title, due_at) VALUES (?, ?)")
    .bind(title, dueAt.toISOString())
    .run();
  return Response.json({ success: true });
}

export async function onRequestPut(context) {
  const { DB } = context.env;
  let payload;
  try {
    payload = await context.request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { id, action, minutes } = payload;
  if (!Number.isSafeInteger(id) || id < 1) {
    return Response.json({ error: "A valid task id is required" }, { status: 400 });
  }

  if (action === 'complete') {
    const result = await DB.prepare("UPDATE tasks SET status = 'completed' WHERE id = ?").bind(id).run();
    if (result.meta.changes === 0) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }
  } else if (action === 'snooze') {
    if (!Number.isSafeInteger(minutes) || minutes < 1 || minutes > 10080) {
      return Response.json({ error: "Snooze minutes must be between 1 and 10080" }, { status: 400 });
    }

    // Gia hạn thêm số phút dựa trên thời gian hiện tại
    const newDue = new Date(Date.now() + minutes * 60000).toISOString();
    const result = await DB.prepare("UPDATE tasks SET due_at = ? WHERE id = ?").bind(newDue, id).run();
    if (result.meta.changes === 0) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }
  } else {
    return Response.json({ error: "Unsupported task action" }, { status: 400 });
  }

  return Response.json({ success: true });
}

export async function onRequestDelete(context) {
  const { DB } = context.env;
  let payload;
  try {
    payload = await context.request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { id } = payload;
  if (!Number.isSafeInteger(id) || id < 1) {
    return Response.json({ error: "A valid task id is required" }, { status: 400 });
  }

  const result = await DB.prepare("DELETE FROM tasks WHERE id = ?").bind(id).run();
  if (result.meta.changes === 0) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
