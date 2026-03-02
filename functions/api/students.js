// functions/api/students.js

// 获取学生列表 (GET)
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare("SELECT * FROM students ORDER BY id DESC").all();
    return Response.json(results);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// 批量添加学生 (POST)
export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json();
    const names = body.names || [];
    
    // 批量插入
    for (const name of names) {
      await env.DB.prepare(
        "INSERT INTO students (name) VALUES (?)"
      ).bind(name).run();
    }
    
    return Response.json({ success: true, count: names.length });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
