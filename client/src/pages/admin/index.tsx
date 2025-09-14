import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">📊 Owner Dashboard</h1>
      <ul className="space-y-4">
        <li>
          <Link href="/admin/dishes" className="px-4 py-2 bg-blue-500 text-white rounded-lg">
            🍽 Manage Dishes
          </Link>
        </li>
        <li>
          <Link href="/admin/orders" className="px-4 py-2 bg-green-500 text-white rounded-lg">
            📦 Manage Orders
          </Link>
        </li>
        <li>
          <Link href="/admin/qrcodes" className="px-4 py-2 bg-purple-500 text-white rounded-lg">
            🔗 QR Codes
          </Link>
        </li>
      </ul>
    </div>
  );
}
