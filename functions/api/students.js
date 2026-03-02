// functions/api/students.js

// 获取学生列表
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare("SELECT * FROM students ORDER BY name").all();
    return Response.json(results);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// 添加学生（支持单个和批量）
export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json();
    
    // 批量添加
    if (body.names && Array.isArray(body.names)) {
      for (const name of body.names) {
        await env.DB.prepare("INSERT INTO students (name) VALUES (?)").bind(name).run();
      }
      return Response.json({ success: true, count: body.names.length });
    }
    
    // 单个添加
    await env.DB.prepare("INSERT INTO students (name) VALUES (?)").bind(body.name).run();
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}