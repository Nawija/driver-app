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
    const data: Order[] = await res.json();
    data.sort((a, b) => {
      const startA = parseInt(a.time_range.split("-")[0], 10);
      const startB = parseInt(b.time_range.split("-")[0], 10);
      return startA - startB;
    });
    setOrders(data);
  }

  async function markCompleted(id: number, photoUrls?: string[]) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrls }),
    });
    loadOrders();
  }

  async function handleFileUpload(id: number, files: FileList) {
    setUploading(id);
    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.ok) {
        uploadedUrls.push(data.url);
      }
    }

    if (uploadedUrls.length > 0) {
      await markCompleted(id, uploadedUrls);
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
          className={`border p-4 mb-3 rounded ${
            o.completed ? "bg-green-50" : "bg-white"
          }`}
        >
          <div className="flex justify-between">
            <div>
              <p>
                <strong>{o.client_name}</strong> ({o.time_range})
              </p>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  o.address
                )}`}
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
                uploading === o.id ? (
                  <p className="text-gray-500 text-sm mt-2">⏳ Przesyłanie...</p>
                ) : (
                  <label className="cursor-pointer bg-gray-200 px-3 py-2 rounded text-sm hover:bg-gray-300 transition-colors">
                    Dodaj zdjęcia
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) handleFileUpload(o.id, files);
                      }}
                    />
                  </label>
                )
              ) : (
                <div>
                  <p className="text-green-700 text-sm mb-1">
                    ✅ Zrealizowano <br />
                    {new Date(o.completed_at!).toLocaleTimeString()}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {o.photo_urls?.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={url}
                          alt="Zdjęcie paczek"
                          className="w-20 h-20 object-cover rounded border"
                        />
                      </a>
                    ))}
                  </div>

                  {/* 🔹 przycisk dodawania kolejnych zdjęć */}
                  {uploading === o.id ? (
                    <p className="text-gray-500 text-sm mt-2">⏳ Przesyłanie...</p>
                  ) : (
                    <label className="cursor-pointer bg-blue-100 px-3 py-2 mt-3 inline-block rounded text-sm hover:bg-blue-200 transition-colors">
                      ➕ Dodaj kolejne zdjęcie
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files) handleFileUpload(o.id, files);
                        }}
                      />
                    </label>
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
