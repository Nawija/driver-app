"use client";
import { useEffect, useState, useCallback } from "react";
import {
    Phone,
    MapPin,
    Upload,
    Trash2,
    PlusCircle,
    X,
    ChevronLeft,
    ChevronRight,
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
    const [modalIndex, setModalIndex] = useState<number | null>(null);
    const [modalPhotos, setModalPhotos] = useState<string[]>([]);
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

    // === SWIPE MODAL HANDLING ===
    const closeModal = useCallback(() => setModalIndex(null), []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeModal();
            if (e.key === "ArrowRight" && modalIndex !== null) {
                setModalIndex((prev) =>
                    prev !== null && prev < modalPhotos.length - 1
                        ? prev + 1
                        : prev
                );
            }
            if (e.key === "ArrowLeft" && modalIndex !== null) {
                setModalIndex((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : prev
                );
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [modalIndex, modalPhotos.length, closeModal]);

    // === SWIPE GESTURE ===
    let startX = 0;
    const handleTouchStart = (e: React.TouchEvent) => {
        startX = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (modalIndex === null) return;
        const endX = e.changedTouches[0].clientX;
        const deltaX = endX - startX;
        if (deltaX > 80 && modalIndex > 0) {
            setModalIndex(modalIndex - 1);
        } else if (deltaX < -80 && modalIndex < modalPhotos.length - 1) {
            setModalIndex(modalIndex + 1);
        }
    };

    // Szacowanie łącznego czasu
    const totalEstimatedTime = orders.reduce((acc, order) => {
        if (order.type === "Transport") return acc + 0.5;
        if (order.type === "Transport + wniesienie") return acc + 1.6;
        if (order.type === "Transport + wniesienie + montaż") return acc + 2.6;
        return acc;
    }, 0);

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
                        <span className="text-sm text-slate-600">
                            ⏱️ Szacowany czas:{" "}
                            <span className="font-semibold text-slate-800">
                                {totalEstimatedTime.toFixed(1)} h
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
                    orders.map((o) => (
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
                                    <h2 className="text-lg font-semibold text-gray-800">
                                        {o.client_name}
                                    </h2>
                                    <span className="text-sm text-gray-500">
                                        {o.time_range} • {o.type}
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
                                    {o.photo_urls.map((url, i) => (
                                        <img
                                            key={i}
                                            src={url}
                                            alt={`Zdjęcie ${i + 1}`}
                                            onClick={() => {
                                                setModalPhotos(
                                                    o.photo_urls || []
                                                );
                                                setModalIndex(i);
                                            }}
                                            className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition"
                                        />
                                    ))}
                                </div>
                            ) : null}

                            {o.completed && (
                                <p className="text-green-700 text-sm font-medium">
                                    ✅ Zrealizowano:{" "}
                                    {new Date(
                                        o.completed_at!
                                    ).toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </main>

            {/* === SIDEBAR FORM === */}
            <aside className="md:w-[360px] w-full bg-white rounded-2xl shadow p-5 h-fit sticky top-6 self-start">
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
                        value={form.timeRange}
                        placeholder="Przedział godzinowy (np. 12-14)"
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                        onChange={(e) =>
                            setForm({ ...form, timeRange: e.target.value })
                        }
                    />
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
                            setForm({ ...form, description: e.target.value })
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
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-all"
                    >
                        {adding ? "Dodawanie..." : "Dodaj zlecenie"}
                    </button>
                </form>
            </aside>

            {/* === SWIPE MODAL === */}
            {modalIndex !== null && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
                    onClick={closeModal}
                >
                    <button
                        className="absolute top-5 right-5 text-white p-2 bg-black/40 rounded-full hover:bg-black/60 transition"
                        onClick={closeModal}
                    >
                        <X size={28} />
                    </button>

                    <div
                        className="relative w-full max-w-4xl flex items-center justify-center"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <img
                            src={modalPhotos[modalIndex]}
                            alt="Podgląd zdjęcia"
                            className="max-h-[80vh] rounded-lg object-contain"
                        />
                        {modalIndex > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setModalIndex(modalIndex - 1);
                                }}
                                className="absolute left-4 text-white p-3 bg-black/40 rounded-full hover:bg-black/60 transition"
                            >
                                <ChevronLeft size={32} />
                            </button>
                        )}
                        {modalIndex < modalPhotos.length - 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setModalIndex(modalIndex + 1);
                                }}
                                className="absolute right-4 text-white p-3 bg-black/40 rounded-full hover:bg-black/60 transition"
                            >
                                <ChevronRight size={32} />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
