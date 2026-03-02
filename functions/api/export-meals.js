// functions/api/export-meals.js

export async function onRequestGet({ env, request }) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const onlyRefund = searchParams.get('only_refund') === 'true';
    
    if (!startDate || !endDate) {
      return Response.json({ error: '请提供开始和结束日期' }, { status: 400 });
    }
    
    // 查询所有记录
    const { results } = await env.DB.prepare(`
      SELECT 
        s.id as student_id,
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
      if (!studentStats[record.student_id]) {
        studentStats[record.student_id] = {
          name: record.name,
          breakfast_dates: [],
          lunch_dates: [],
          dinner_dates: [],
          breakfast_count: 0,
          lunch_count: 0,
          dinner_count: 0
        };
      }
      
      // 转换日期格式：2024-09-01 -> 9.1
      const dateObj = new Date(record.record_date);
      const shortDate = `${dateObj.getMonth() + 1}.${dateObj.getDate()}`;
      
      if (record.breakfast === 1) {
        studentStats[record.student_id].breakfast_dates.push(shortDate);
        studentStats[record.student_id].breakfast_count++;
      }
      if (record.lunch === 1) {
        studentStats[record.student_id].lunch_dates.push(shortDate);
        studentStats[record.student_id].lunch_count++;
      }
      if (record.dinner === 1) {
        studentStats[record.student_id].dinner_dates.push(shortDate);
        studentStats[record.student_id].dinner_count++;
      }
    });
    
    // 转换为 CSV 格式
    const csvRows = [];
    
    // 表头：先日期列，后次数列
    csvRows.push(['姓名', '早饭未就餐日期', '午饭未就餐日期', '晚饭未就餐日期', '早饭次数', '午饭次数', '晚饭次数', '总次数']);
    
    // 先过滤出需要导出的学生
    const studentsToExport = Object.values(studentStats).filter(stat => {
      const totalCount = stat.breakfast_count + stat.lunch_count + stat.dinner_count;
      
      // 如果只导出需要退费的，只保留总次数 > 0 的
      if (onlyRefund) {
        return totalCount > 0;
      }
      // 否则全部保留
      return true;
    });
    
    // 按姓名排序（保证顺序一致）
    studentsToExport.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
    
    // 添加数据行
    studentsToExport.forEach(stat => {
      const totalCount = stat.breakfast_count + stat.lunch_count + stat.dinner_count;
      
      csvRows.push([
        stat.name,
        stat.breakfast_dates.join('+'),
        stat.lunch_dates.join('+'),
        stat.dinner_dates.join('+'),
        stat.breakfast_count,
        stat.lunch_count,
        stat.dinner_count,
        totalCount
      ]);
    });
    
    // 生成 CSV 内容
    const csvContent = csvRows.map(row => 
      row.map(cell => {
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
    const refundText = onlyRefund ? '_需退费' : '';
    return new Response(csvBlob, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="餐费统计${refundText}_${startDate}_至_${endDate}.csv"`
      }
    });
    
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}