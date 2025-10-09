"use client";
import { useEffect, useState } from "react";
import {
  Phone,
  MapPin,
  Upload,
  Trash2,
  PlusCircle,
  Clock,
  X,
} from "lucide-react";

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    clientName: "",
    phoneNumber: "",
    timeRange: "",
    description: "",
    type: "Transport",
    address: "",
  });
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // ========== HELPERS ==========
  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  };

  // ========== LOAD ORDERS ==========
  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data: Order[] = await res.json();
      data.sort((a, b) => a.id - b.id);
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // ========== ADD ORDER ==========
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({
        clientName: "",
        phoneNumber: "",
        timeRange: "",
        description: "",
        type: "Transport",
        address: "",
      });
      loadOrders();
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  }

  // ========== DELETE ORDER ==========
  async function deleteOrder(id: number) {
    if (!confirm("Na pewno chcesz usunąć to zlecenie?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/orders/${id}`, { method: "DELETE" });
      loadOrders();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  }

  // ========== USE EFFECT ==========
  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row gap-6 p-4 md:p-6">
      {/* MAIN SECTION */}
      <div className="flex-1">
        {/* HEADER */}
        <header className="max-w-4xl mx-auto mb-6 flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-800">Lista Dostaw</h1>
          <p className="text-gray-600 text-sm">
            Ilość dostaw:{" "}
            <span className="font-semibold text-gray-800">
              {orders.length}
            </span>
          </p>
        </header>

        {/* SHORT LIST (LINKS) */}
        {orders.length > 0 && (
          <div className="max-w-4xl mx-auto mb-5 flex flex-col gap-1">
            {orders.map((o) => (
              <a
                key={o.id}
                href={`#order-${o.id}`}
                className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition ${
                  o.completed
                    ? "bg-green-100 text-green-800 border-l-4 border-green-500"
                    : "bg-gray-100 text-gray-700 border-l-4 border-gray-400"
                } hover:bg-gray-200`}
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {o.time_range} — {o.client_name}
                  </span>
                  <span className="text-sm text-gray-600">{o.address}</span>
                </div>
                <div className="flex gap-3">
                  <a
                    href={`tel:${o.phone_number}`}
                    className="bg-green-600 text-white p-1.5 rounded-xl hover:bg-green-700 transition"
                  >
                    <Phone size={18} />
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      o.address
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white p-1.5 rounded-xl hover:bg-blue-700 transition"
                  >
                    <MapPin size={18} />
                  </a>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* FULL LIST */}
        <main className="max-w-4xl mx-auto flex flex-col gap-5">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white p-5 rounded-2xl shadow-sm"
                >
                  <div className="h-6 w-1/3 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded mb-2" />
                  <div className="h-20 w-full bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl shadow text-center text-gray-500">
              Brak zleceń do wyświetlenia.
            </div>
          ) : (
            orders.map((o) => (
              <section
                key={o.id}
                id={`order-${o.id}`}
                className={`scroll-mt-16 bg-white rounded-2xl shadow p-5 flex flex-col gap-4 transition hover:shadow-md ${
                  o.completed
                    ? "border-l-4 border-green-500 bg-green-50"
                    : "border-l-4 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock size={20} />
                    <span className="text-lg font-semibold">
                      {o.time_range}
                    </span>
                  </div>
                  <span
                    className={`text-sm px-3 py-1 rounded-xl font-medium ${
                      o.completed
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {o.completed
                      ? `Zrealizowano • ${formatTime(o.completed_at)}`
                      : "Do realizacji"}
                  </span>
                </div>

                <h2 className="text-xl font-semibold text-gray-800">
                  {o.client_name}
                </h2>
                <p className="text-gray-600">{o.type}</p>
                {o.description && (
                  <p className="text-gray-700 text-sm">{o.description}</p>
                )}

                <div className="flex flex-col gap-2">
                  <a
                    href={`tel:${o.phone_number}`}
                    className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-xl hover:bg-gray-200 transition text-gray-800"
                  >
                    <Phone size={18} /> {o.phone_number}
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      o.address
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl hover:bg-gray-100 transition text-gray-800"
                  >
                    <MapPin size={18} /> {o.address}
                  </a>
                </div>

                {/* DELETE BUTTON */}
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => deleteOrder(o.id)}
                    disabled={deleting === o.id}
                    className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition text-sm"
                  >
                    <Trash2 size={16} />
                    {deleting === o.id ? "Usuwanie..." : "Usuń"}
                  </button>
                </div>
              </section>
            ))
          )}
        </main>
      </div>

      {/* SIDEBAR FORM */}
      <aside className="md:w-[360px] w-full bg-white rounded-2xl shadow p-5 h-fit sticky top-6 self-start">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
          <PlusCircle className="text-blue-600" /> Dodaj dostawę
        </h2>

        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <input
            type="text"
            value={form.clientName}
            placeholder="Imię i nazwisko klienta"
            className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
          />
          <input
            type="text"
            value={form.phoneNumber}
            placeholder="Numer telefonu"
            className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          />
          <input
            type="text"
            value={form.timeRange}
            placeholder="Przedział godzinowy (np. 12–14)"
            className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setForm({ ...form, timeRange: e.target.value })}
          />
          <input
            type="text"
            value={form.address}
            placeholder="Adres dostawy"
            className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <textarea
            value={form.description}
            placeholder="Opis (opcjonalnie)"
            className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none min-h-[70px]"
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <select
            value={form.type}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="Transport">Sam transport</option>
            <option value="Transport + wniesienie">
              Transport + wniesienie
            </option>
            <option value="Transport + wniesienie + montaż">
              Transport + wniesienie + montaż
            </option>
          </select>

          <button
            disabled={adding}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-all"
          >
            {adding ? "Dodawanie..." : "Dodaj dostawę"}
          </button>
        </form>
      </aside>
    </div>
  );
}
