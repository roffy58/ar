export default function LandingPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🍽️ Welcome to AR world
        </h1>
        <p className="text-gray-600 mb-6">
          Please scan the QR code on your restaurant table to view the menu.
        </p>
        <div className="p-6 border-2 border-dashed rounded-2xl text-gray-500">
          📷 Scan QR with your phone camera
        </div>
      </div>
    </div>
  );
}
