// functions/api/meal-records.js

// 获取所有就餐记录
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT mr.*, s.name as student_name 
      FROM meal_records mr 
      JOIN students s ON mr.student_id = s.id 
      ORDER BY mr.record_date DESC, s.name
    `).all();
    return Response.json(results);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// 保存/更新就餐记录
export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json();
    // body 格式：{ student_id, record_date, breakfast, lunch, dinner }
    
    await env.DB.prepare(`
      INSERT INTO meal_records (student_id, record_date, breakfast, lunch, dinner)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(student_id, record_date) DO UPDATE SET
        breakfast = excluded.breakfast,
        lunch = excluded.lunch,
        dinner = excluded.dinner
    `).bind(
      body.student_id,
      body.record_date,
      body.breakfast ? 1 : 0,
      body.lunch ? 1 : 0,
      body.dinner ? 1 : 0
    ).run();
    
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// 批量保存就餐记录
export async function onRequestPut({ env, request }) {
  try {
    const body = await request.json();
    // body 格式：{ records: [{ student_id, record_date, breakfast, lunch, dinner }, ...] }
    
    for (const record of body.records) {
      await env.DB.prepare(`
        INSERT INTO meal_records (student_id, record_date, breakfast, lunch, dinner)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(student_id, record_date) DO UPDATE SET
          breakfast = excluded.breakfast,
          lunch = excluded.lunch,
          dinner = excluded.dinner
      `).bind(
        record.student_id,
        record.record_date,
        record.breakfast ? 1 : 0,
        record.lunch ? 1 : 0,
        record.dinner ? 1 : 0
      ).run();
    }
    
    return Response.json({ success: true, count: body.records.length });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}