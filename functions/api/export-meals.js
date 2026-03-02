// functions/api/export-meals.js

export async function onRequestGet({ env, request }) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    
    if (!startDate || !endDate) {
      return Response.json({ error: '请提供开始和结束日期' }, { status: 400 });
    }
    
    // 查询所有记录
    const { results } = await env.DB.prepare(`
      SELECT 
        s.name,
        mr.record_date,
        mr.breakfast,
        mr.lunch,
        mr.dinner
      FROM meal_records mr
      JOIN students s ON mr.student_id = s.id
      WHERE mr.record_date >= ? AND mr.record_date <= ?
      ORDER BY s.name, mr.record_date
    `).bind(startDate, endDate).all();
    
    // 按学生分组统计
    const studentStats = {};
    
    results.forEach(record => {
      if (!studentStats[record.name]) {
        studentStats[record.name] = {
          name: record.name,
          breakfast_dates: [],
          lunch_dates: [],
          dinner_dates: [],
          breakfast_count: 0,
          lunch_count: 0,
          dinner_count: 0
        };
      }
      
      if (record.breakfast === 1) {
        studentStats[record.name].breakfast_dates.push(record.record_date);
        studentStats[record.name].breakfast_count++;
      }
      if (record.lunch === 1) {
        studentStats[record.name].lunch_dates.push(record.record_date);
        studentStats[record.name].lunch_count++;
      }
      if (record.dinner === 1) {
        studentStats[record.name].dinner_dates.push(record.record_date);
        studentStats[record.name].dinner_count++;
      }
    });
    
    // 转换为 CSV 格式
    const csvRows = [];
    csvRows.push(['姓名', '早饭未就餐日期', '早饭次数', '午饭未就餐日期', '午饭次数', '晚饭未就餐日期', '晚饭次数']);
    
    Object.values(studentStats).forEach(stat => {
      csvRows.push([
        stat.name,
        stat.breakfast_dates.join('+'),
        stat.breakfast_count,
        stat.lunch_dates.join('+'),
        stat.lunch_count,
        stat.dinner_dates.join('+'),
        stat.dinner_count
      ]);
    });
    
    // 生成 CSV 内容
    const csvContent = csvRows.map(row => 
      row.map(cell => {
        // 处理包含逗号或引号的内容
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ).join('\n');
    
    // 添加 BOM 防止中文乱码
    const bom = '\uFEFF';
    const csvBlob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 返回文件
    return new Response(csvBlob, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="餐费统计_${startDate}_至_${endDate}.csv"`
      }
    });
    
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}