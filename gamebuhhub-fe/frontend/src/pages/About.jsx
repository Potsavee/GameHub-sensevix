function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">เกี่ยวกับ GameReview</h1>
      <p className="mt-3 leading-relaxed text-slate-600">
        โปรเจกต์ฝึกหัดในรายวิชา 520 341 Client Side Web Programming
        ใช้เรียนรู้การเรียก API ด้วย React (fetch, useEffect, การจัดการสถานะ loading / error / success)
        หน้าเว็บใช้ React Fetch API เรียก Go backend ซึ่งเชื่อม IGDB และ Supabase PostgreSQL
      </p>

      <h2 className="mt-8 font-medium text-slate-900">ทีม</h2>
      <p className="text-sm text-slate-500">แก้รายชื่อด้านล่างเป็นของทีมตัวเอง</p>
      <ul className="mt-2 list-disc pl-5 text-slate-700">
        <li>ชื่อ นามสกุล (รหัสนักศึกษา)</li>
        <li>ชื่อ นามสกุล (รหัสนักศึกษา)</li>
      </ul>

      <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 md:flex-row md:items-center">
        <a href="https://www.igdb.com" target="_blank" rel="noreferrer" className="font-semibold text-emerald-600">
          IGDB
        </a>
        <p className="text-sm text-slate-500">
          ข้อมูลเกมและภาพปกดึงจาก IGDB ผ่าน Go backend
        </p>
      </div>
    </div>
  );
}

export default About;
