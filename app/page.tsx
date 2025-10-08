"use client";
import { useEffect, useState } from "react";

type Order = {
  id: number;
  client_name: string;
  time_range: string;
  description: string;
  type: string;
  address: string;
  completed: boolean;
  completed_at?: string;
  photo_urls?: string[];
};

export default function HomePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [uploading, setUploading] = useState<number | null>(null);

  async function loadOrders() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data);
  }

  async function markCompleted(id: number, photoUrl?: string) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl }),
    });
    loadOrders();
  }

  async function handleFileUpload(id: number, file: File) {
    setUploading(id);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (data.ok) {
      await markCompleted(id, data.url);
    }
    setUploading(null);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Lista zleceń kierowcy 🚚</h1>
      {orders.map((o) => (
        <div
          key={o.id}
          className={`border p-4 mb-3 rounded ${o.completed ? "bg-green-50" : "bg-white"}`}
        >
          <div className="flex justify-between">
            <div>
              <p><strong>{o.client_name}</strong> ({o.time_range})</p>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                {o.address}
              </a>

              <p className="text-sm text-gray-600 mt-1">{o.description}</p>
              <p className="text-xs italic mt-1">{o.type}</p>
            </div>

            <div className="text-right">
              {!o.completed ? (
                <div className="flex flex-col items-end gap-2">
                  <label className="cursor-pointer bg-gray-100 px-2 py-1 rounded text-sm hover:bg-gray-200">
                    📸 Dodaj zdjęcie
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(o.id, file);
                      }}
                    />
                  </label>
                  <button
                    disabled={uploading === o.id}
                    onClick={() => markCompleted(o.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    {uploading === o.id ? "Wysyłanie..." : "Zrealizowane"}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-green-700 text-sm mb-1">
                    ✅ Zrealizowano <br /> {new Date(o.completed_at!).toLocaleTimeString()}
                  </p>
                  {o.photo_urls?.[0] && (
                    <a
                      href={o.photo_urls[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={o.photo_urls[0]}
                        alt="Zdjęcie paczek"
                        className="w-24 h-24 object-cover rounded border"
                      />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
