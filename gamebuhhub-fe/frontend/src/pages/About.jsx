function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">เกี่ยวกับ GameReview</h1>
      <div className="mt-3 space-y-4 leading-relaxed text-slate-600">
        <p>
          GameReview เป็นเว็บไซต์สำหรับค้นหาและรีวิวเกม จัดทำขึ้นเป็นส่วนหนึ่งของรายวิชา 520 341 Client Side Programming 
          และ 520 342 Server Side Programming เพื่อฝึกพัฒนา frontend ด้วย React และการเชื่อมต่อ API จาก IGDB ผ่าน Go backend
        </p>
        <p>
          ผู้ใช้สามารถค้นหาเกม ดูรายละเอียดและภาพตัวอย่าง เขียนรีวิว และบันทึกเกมที่สนใจไว้ใน Wishlist ได้ นอกจากนี้ยังมีระบบสมาชิก 
          การจัดการสิทธิ์ Admin และเกม Quiz สำหรับทายข้อมูลเกม
        </p>
        <p>
          หน้าเว็บใช้ React Fetch API เรียก Go backend ซึ่งเชื่อม IGDB และ Supabase PostgreSQL
        </p>
      </div>

      <h2 className="mt-8 font-medium text-slate-900">ทีม เซ่นซีวิค</h2>
      <p className="text-sm text-slate-500"></p>
      <ul className="mt-2 list-disc pl-5 text-slate-700">
        <li>ธนกฤต วรรณศรี (670710203)</li>
        <li>พศวีร์ สุทธิวานิช (670710726)</li>
      </ul>

      <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 md:flex-row md:items-center">
        <a href="https://www.igdb.com" target="_blank" rel="noreferrer" className="font-semibold text-emerald-600">
          IGDB
        </a>
        <p className="text-sm text-slate-500">
          ข้อมูลเกมและภาพดึงจาก IGDB ผ่าน Go backend
        </p>
      </div>
    </div>
  );
}

export default About;
