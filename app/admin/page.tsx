"use client";
import { useEffect, useState } from "react";

type Order = {
  id: number;
  client_name: string;
  phone_number: string;
  time_range: string;
  description: string;
  type: string;
  address: string;
  completed: boolean;
  completed_at?: string;
  photo_urls?: string[];
};

export default function AdminPage() {
  const [form, setForm] = useState({
    clientName: "",
    phoneNumber: "",
    timeRange: "",
    description: "",
    type: "Transport",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function loadOrders() {
    const res = await fetch("/api/orders");
    const data: Order[] = await res.json();
    setOrders(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setForm({
        clientName: "",
        phoneNumber: "",
        timeRange: "",
        description: "",
        type: "Transport",
        address: "",
      });
      loadOrders();
    }
  }

  async function deleteOrder(id: number) {
    if (!confirm("Na pewno chcesz usunąć to zlecenie?")) return;
    setDeleting(id);
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    setDeleting(null);
    loadOrders();
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Panel administracyjny</h1>

      {/* Formularz */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-8 border-b pb-6">
        <input
          type="text"
          value={form.clientName}
          placeholder="Imię i nazwisko klienta"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, clientName: e.target.value })}
        />
        <input
          type="text"
          value={form.phoneNumber}
          placeholder="Numer telefonu"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
        />
        <input
          type="text"
          value={form.timeRange}
          placeholder="Przedział godzinowy (np. 12-14)"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, timeRange: e.target.value })}
        />
        <input
          type="text"
          value={form.address}
          placeholder="Adres dostawy"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <textarea
          value={form.description}
          placeholder="Opis"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <select
          value={form.type}
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="Transport">Sam transport</option>
          <option value="Transport + wniesienie">Transport + wniesienie</option>
          <option value="Transport + wniesienie + montaż">
            Transport + wniesienie + montaż
          </option>
        </select>
        <button
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Dodawanie..." : "Dodaj zlecenie"}
        </button>
      </form>

      {/* Lista zleceń */}
      <h2 className="text-xl font-semibold mb-4">Wszystkie zlecenia</h2>
      {orders.length === 0 && <p className="text-gray-500">Brak zleceń.</p>}

      {orders.map((o) => (
        <div
          key={o.id}
          className={`border p-4 mb-4 rounded-lg shadow-sm ${
            o.completed ? "bg-green-50" : "bg-white"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p>
                <strong>{o.client_name}</strong> ({o.time_range})
              </p>

              <p className="text-sm text-gray-700">📞 {o.phone_number}</p>

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

              <p className="text-gray-600 text-sm mt-1">{o.description}</p>
              <p className="text-xs italic text-gray-500 mt-1">{o.type}</p>

              {o.completed && o.completed_at && (
                <p className="text-green-700 text-sm mt-2">
                  ✅ Zrealizowano: {new Date(o.completed_at).toLocaleTimeString()}
                </p>
              )}

              {o.photo_urls && o.photo_urls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {o.photo_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`Zdjęcie ${i + 1}`}
                        className="w-24 h-24 object-cover rounded border"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => deleteOrder(o.id)}
              disabled={deleting === o.id}
              className="bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600 transition-colors"
            >
              {deleting === o.id ? "Usuwanie..." : "Usuń"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
