"use client";
import { useEffect, useState } from "react";
import { Phone, MapPin, Trash2, PlusCircle, Clock } from "lucide-react";
import { SwiperModal } from "@/components/SwiperMd";

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
    travelTime?: number;
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

    const [modal, setModal] = useState<{
        photos: string[];
        index: number;
    } | null>(null);
    const [phoneError, setPhoneError] = useState("");

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

    useEffect(() => {
        loadOrders();
    }, []);

    const formatStartTime = (t: number) => {
        const hours = Math.floor(t);
        const minutes = Math.round((t - hours) * 60);
        return minutes < 30 ? hours : hours + 1;
    };

    const formatEndTime = (start: number, duration: number) => {
        let end = start + duration;
        const hours = Math.floor(end);
        const minutes = Math.round((end - hours) * 60);
        let rounded = minutes < 30 ? hours : hours + 1;
        if (rounded <= start) rounded = start + 1; // upewniamy się, że end > start
        return rounded;
    };
    // 📦 Szacowanie godzin dostaw
    const startHour = 10; // start 10:00
    let currentTime = startHour;

    const deliveriesWithTime = orders.map((o) => {
        const duration =
            o.type === "Transport"
                ? 0.5
                : o.type === "Transport + wniesienie"
                ? 1
                : 2;

        const startHour = formatStartTime(currentTime);
        const endHour = formatEndTime(startHour, duration);
        currentTime = endHour;

        return {
            ...o,
            startTime: `${startHour}:00`,
            endTime: `${endHour}:00`,
        };
    });

    // Sortowanie po godzinie startu (rosnąco)
    deliveriesWithTime.sort((a, b) => {
        const [aH, aM] = a.startTime.split(":").map(Number);
        const [bH, bM] = b.startTime.split(":").map(Number);
        return aH * 60 + aM - (bH * 60 + bM);
    });



    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex flex-col md:flex-row gap-6">
            {/* === MAIN LIST === */}
            <main className="flex-1 flex flex-col gap-4">
                <div className="space-y-2">
                    <div className="font-semibold text-lg text-slate-800 flex items-center justify-between">
                        <span>
                            Ilość dostaw:{" "}
                            <span className="font-medium text-xl text-gray-800">
                                ({orders.length})
                            </span>
                        </span>
                    </div>
                </div>

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
                    <div className="mt-6 text-center text-gray-500">
                        Brak zleceń.
                    </div>
                ) : (
                    deliveriesWithTime.map((o) => (
                        <div
                            key={o.id}
                            className={`bg-white rounded-2xl shadow p-5 flex flex-col gap-3 transition hover:shadow-md ${
                                o.completed
                                    ? "border-l-4 border-green-400 bg-green-50"
                                    : ""
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1">
                                        <Clock />
                                        <p className="text-2xl">
                                            {o.startTime} - {o.endTime}
                                        </p>
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-800">
                                        {o.client_name}
                                    </h2>
                                    <span className="text-sm text-gray-500">
                                        {o.type}
                                    </span>
                                    {o.description && (
                                        <p className="text-gray-600 text-sm mt-1">
                                            {o.description}
                                        </p>
                                    )}
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            o.address
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 mt-1"
                                    >
                                        <MapPin size={18} /> {o.address}
                                    </a>
                                    <a
                                        href={`tel:${o.phone_number}`}
                                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
                                    >
                                        <Phone size={18} /> {o.phone_number}
                                    </a>
                                </div>

                                <button
                                    onClick={() => deleteOrder(o.id)}
                                    disabled={deleting === o.id}
                                    className="bg-red-500 text-white px-3 py-1.5 rounded-xl hover:bg-red-600 text-sm font-medium transition"
                                >
                                    {deleting === o.id ? (
                                        "..."
                                    ) : (
                                        <Trash2 size={18} />
                                    )}
                                </button>
                            </div>
                            {o.photo_urls?.length ? (
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {" "}
                                    {o.photo_urls.map((url, i) => (
                                        <img
                                            key={i}
                                            src={url}
                                            alt={`Zdjęcie ${i + 1}`}
                                            onClick={() =>
                                                setModal({
                                                    photos: o.photo_urls!,
                                                    index: i,
                                                })
                                            }
                                            className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                                        />
                                    ))}
                                </div>
                            ) : null}
                            {o.completed && (
                                <p className="text-green-700 text-sm font-medium">
                                    {" "}
                                    ✅ Zrealizowano:{" "}
                                    {new Date(
                                        o.completed_at!
                                    ).toLocaleTimeString()}{" "}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </main>

            {/* === SIDEBAR FORM === */}
            <aside className="md:w-[360px] w-full h-fit sticky top-6 self-start space-y-6">
                <div className="w-full bg-white p-6 shadow rounded-2xl">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
                        <PlusCircle className="text-blue-600" /> Dodaj zlecenie
                    </h2>

                    <form onSubmit={handleAdd} className="flex flex-col gap-3">
                        <input
                            type="text"
                            value={form.clientName}
                            placeholder="Imię i nazwisko klienta"
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={(e) =>
                                setForm({ ...form, clientName: e.target.value })
                            }
                            required
                        />
                        <input
                            type="tel"
                            value={form.phoneNumber}
                            placeholder="Numer telefonu"
                            className={`border rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 outline-none transition-all ${
                                phoneError
                                    ? "border-red-400 focus:ring-red-400"
                                    : "border-gray-300 focus:ring-blue-500"
                            }`}
                            onChange={(e) => {
                                const value = e.target.value;
                                setForm({ ...form, phoneNumber: value });

                                // Walidacja PL (9 cyfr, tylko liczby)
                                const phoneRegex = /^[0-9]{9}$/;
                                if (!phoneRegex.test(value)) {
                                    setPhoneError(
                                        "Podaj poprawny 9-cyfrowy numer telefonu"
                                    );
                                } else {
                                    setPhoneError("");
                                }
                            }}
                            required
                        />
                        {phoneError && (
                            <p className="text-red-500 text-sm mt-1">
                                {phoneError}
                            </p>
                        )}

                        <input
                            type="text"
                            value={form.address}
                            placeholder="Adres dostawy"
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={(e) =>
                                setForm({ ...form, address: e.target.value })
                            }
                            required
                        />
                        <textarea
                            value={form.description}
                            placeholder="Opis (opcjonalnie)"
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none min-h-[70px]"
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    description: e.target.value,
                                })
                            }
                        />
                        <select
                            value={form.type}
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={(e) =>
                                setForm({ ...form, type: e.target.value })
                            }
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
                            className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white py-2 rounded-lg font-semibold transition-all"
                        >
                            {adding ? "Dodawanie..." : "Dodaj zlecenie"}
                        </button>
                    </form>
                </div>
                <div className="w-full bg-white p-6 shadow rounded-2xl">
                    <button
                        onClick={async () => {
                            try {
                                const res = await fetch(
                                    "/api/export-transports"
                                );
                                if (!res.ok) throw new Error("Błąd eksportu");
                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `transporty-${orders.length}x.zip`;
                                a.click();
                                window.URL.revokeObjectURL(url);
                            } catch (err) {
                                alert("Nie udało się pobrać pliku.");
                                console.error(err);
                            }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer w-full text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                        📦 Ściągnij transporty
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                const res = await fetch("/api/travel-calc", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({ orders }),
                                });
                                const data = await res.json();
                                if (data.ok) {
                                    alert("Trasy przeliczone i zapisane ✅");
                                    setOrders(data.updated);
                                } else {
                                    alert("Błąd podczas przeliczania tras");
                                }
                            } catch (err) {
                                console.error(err);
                                alert("Wystąpił błąd połączenia z API");
                            }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 w-full text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                        🚗 Przelicz trasy
                    </button>
                </div>
            </aside>

            {modal && (
                <SwiperModal
                    images={modal.photos}
                    initialIndex={modal.index}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    );
}
