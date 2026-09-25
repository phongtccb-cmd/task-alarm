// functions/api/tasks.js
export async function onRequestGet(context) {
  const { DB } = context.env;
  const { results } = await DB.prepare(
    "SELECT * FROM tasks WHERE status = 'pending' ORDER BY due_at ASC"
  ).all();
  return Response.json(results);
}

export async function onRequestPost(context) {
  const { DB } = context.env;
  const { title, due_at } = await context.request.json();
  await DB.prepare("INSERT INTO tasks (title, due_at) VALUES (?, ?)").bind(title, due_at).run();
  return Response.json({ success: true });
}

export async function onRequestPut(context) {
  const { DB } = context.env;
  const { id, action, minutes } = await context.request.json();

  if (action === 'complete') {
    await DB.prepare("UPDATE tasks SET status = 'completed' WHERE id = ?").bind(id).run();
  } else if (action === 'snooze') {
    // Gia hạn thêm số phút dựa trên thời gian hiện tại
    const newDue = new Date(Date.now() + minutes * 60000).toISOString();
    await DB.prepare("UPDATE tasks SET due_at = ? WHERE id = ?").bind(newDue, id).run();
  }
  return Response.json({ success: true });
}
