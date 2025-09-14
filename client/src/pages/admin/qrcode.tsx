import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function ManageQRCodes() {
  const [qrcodes, setQRCodes] = useState<any[]>([]);

  useEffect(() => {
    fetchQRCodes();
  }, []);

  async function fetchQRCodes() {
    const { data, error } = await supabase.from("qrcodes").select("*");
    if (error) console.error(error);
    else setQRCodes(data);
  }

  async function toggleQR(id: string, enabled: boolean) {
    const { error } = await supabase.from("qrcodes").update({ enabled: !enabled }).eq("id", id);
    if (error) console.error(error);
    else fetchQRCodes();
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🔗 Manage QR Codes</h1>
      <ul>
        {qrcodes.map((qr) => (
          <li key={qr.id} className="flex justify-between border-b py-2">
            Table: {qr.table_number} - {qr.enabled ? "✅ Enabled" : "❌ Disabled"}
            <button
              onClick={() => toggleQR(qr.id, qr.enabled)}
              className="px-3 py-1 bg-purple-500 text-white rounded"
            >
              {qr.enabled ? "Disable" : "Enable"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
