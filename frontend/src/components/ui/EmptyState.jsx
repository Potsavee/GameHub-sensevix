export default function EmptyState({ message = "ไม่พบข้อมูลในระบบ" }) {
  return (
    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg my-4">
      <p className="text-gray-500 text-lg">{message}</p>
    </div>
  );
}