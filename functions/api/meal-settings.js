// functions/api/meal-settings.js

// 获取学期设置
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare("SELECT * FROM meal_settings ORDER BY id DESC LIMIT 1").all();
    return Response.json(results[0] || null);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// 保存学期设置
export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json();
    await env.DB.prepare(
      "INSERT INTO meal_settings (semester_start, semester_end) VALUES (?, ?)"
    ).bind(body.start, body.end).run();
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}