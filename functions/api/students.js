// functions/api/students.js

// 获取学生列表 (GET)
export async function onRequestGet({ env }) {
  try {
    // env.DB 是稍后在面板绑定的数据库
    const { results } = await env.DB.prepare("SELECT * FROM students").all();
    return Response.json(results);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// 添加学生 (POST)
export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json();
    await env.DB.prepare(
      "INSERT INTO students (name, student_id, class_name) VALUES (?, ?, ?)"
    ).bind(body.name, body.student_id, body.class_name).run();
    
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}