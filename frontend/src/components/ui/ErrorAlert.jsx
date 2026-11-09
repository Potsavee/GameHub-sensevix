export default function ErrorAlert({ message = "เกิดข้อผิดพลาดในการโหลดข้อมูล" }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded">
      <div className="flex">
        <div className="ml-3">
          <p className="text-sm text-red-700 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}