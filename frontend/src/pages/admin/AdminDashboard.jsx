export default function AdminDashboard() {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Admin Dashboard</h1>
      <p className="text-gray-700">หน้านี้เข้าถึงได้เฉพาะผู้ใช้ที่มี Role เป็น Admin เท่านั้น (ผ่าน Backend Guard & RequireRole)</p>
    </div>
  );
}