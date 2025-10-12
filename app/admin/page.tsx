"use client";
import { useEffect, useState } from "react";
import {
    Phone,
    MapPin,
    Trash2,
    PlusCircle,
    Clock,
    Loader2,
    Download,
    Route,
} from "lucide-react"; // 🌀 Dodano Loader2
import { SwiperModal } from "@/components/SwiperMd";

import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import LoadingAcordeonSkeleon from "@/components/LoadingAcordeonSkeleon";
import { RoutePlanDialog } from "@/components/RoutePlanDialog";
import RouteMap from "@/components/RouteMap";

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
    coords?: [number, number];
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
    const [settings, setSettings] = useState({
        start_hour: 10,
        page_title: "",
    });
    const [savingSettings, setSavingSettings] = useState(false);

    const [modal, setModal] = useState<{
        photos: string[];
        index: number;
    } | null>(null);
    const [phoneError, setPhoneError] = useState("");
    const [calculating, setCalculating] = useState(false);
    const [downloading, setDownloading] = useState(false);

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

    // Ładowanie ustawień przy starcie
    useEffect(() => {
        (async () => {
            const res = await fetch("/api/settings");
            const data = await res.json();
            setSettings(data);
        })();
    }, []);

    // Zapis ustawień
    async function saveSettings() {
        setSavingSettings(true);
        await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(settings),
        });
        setSavingSettings(false);
        alert("Zapisano ustawienia ✅");
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

    const deliveriesWithTime = orders.map((o, index) => {
        const duration =
            o.type === "Transport"
                ? 0.5
                : o.type === "Transport + wniesienie"
                ? 1
                : 2;
        const travelTime =
            index === 0 ? 0 : (orders[index - 1].travelTime || 0) / 60;
        const start = travelTime;
        const end = start + duration;

        const fmt = (t: number) => {
            const h = Math.floor(t);
            const m = Math.round((t - h) * 60);
            return `${String(h).padStart(2, "0")}:${String(m).padStart(
                2,
                "0"
            )}`;
        };
        return { ...o, startTime: fmt(start), endTime: fmt(end) };
    });

    deliveriesWithTime.sort((a, b) => {
        const [aH, aM] = a.startTime.split(":").map(Number);
        const [bH, bM] = b.startTime.split(":").map(Number);
        return aH * 60 + aM - (bH * 60 + bM);
    });

    const [showRouteModal, setShowRouteModal] = useState(false);

    async function handleRoutePlan(mode: "manual" | "auto") {
        setShowRouteModal(false);
        setCalculating(true);

        try {
            const endpoint =
                mode === "manual" ? "/api/travel-calc" : "/api/travel-optimize";
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orders }),
            });
            const data = await res.json();
            if (data.ok) {
                setOrders(data.updated);
            } else {
                alert("Błąd podczas przeliczania tras");
            }
        } catch (err) {
            console.error(err);
            alert("Wystąpił błąd połączenia z API");
        } finally {
            setCalculating(false);
        }
    }
    const parseTimeRange = (range: string) => {
        const [start] = range.split("-").map((s) => s.trim());
        const [h, m] = start.split(":").map(Number);
        return h * 60 + m;
    };
    // Sortowanie orders po time_range
    const sortedOrders = [...orders].sort((a, b) => {
        if (!a.time_range) return 1; // brak godziny na końcu
        if (!b.time_range) return -1;
        return parseTimeRange(a.time_range) - parseTimeRange(b.time_range);
    });

    return (
        <div className="min-h-screen p-4 md:p-6 flex flex-col md:flex-row gap-6 max-w-screen-2xl mx-auto mb-40">
            <main className="flex-1 flex flex-col gap-4">
                <div className="w-full flex-col md:flex-row bg-white border border-gray-200 p-6 pt-7 shadow rounded-xl flex items-end justify-center md:space-x-4 md:space-y-0 space-y-5">
                    <div className="w-full md:max-w-60 relative">
                        <p className="font-semibold absolute -top-3 left-3 bg-white px-1 text-sm text-gray-600">
                            Godzina startu dostaw
                        </p>
                        <input
                            type="number"
                            min={5}
                            max={20}
                            step={0.5}
                            value={settings.start_hour}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    start_hour: parseFloat(e.target.value),
                                })
                            }
                            className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                        />
                    </div>

                    <div className="w-full relative">
                        <label className="font-semibold absolute -top-3 left-3 bg-white px-1 text-sm text-gray-600">
                            Tytuł dostaw
                        </label>
                        <input
                            type="text"
                            value={settings.page_title}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    page_title: e.target.value,
                                })
                            }
                            className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                        />
                    </div>

                    <button
                        onClick={saveSettings}
                        disabled={savingSettings}
                        className="text-blue-700  hover:text-blue-600 hover:border-blue-200 w-full md:w-auto  font-semibold text-sm md:text-xs py-2 md:py-1.5 px-4 bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg border border-blue-500"
                    >
                        {savingSettings
                            ? "Zapisywanie..."
                            : "Zapisz ustawienia"}
                    </button>
                </div>

                {/* <RouteMap
                    orders={orders.map((o, i) => ({
                        id: o.id,
                        client_name: o.client_name,
                        address: o.address,
                        time_range: o.time_range,
                        completed: o.completed,
                        coords: o.coords,
                    }))}
                /> */}

                <div className="font-semibold text-lg text-slate-800 flex justify-between items-center mt-4">
                    <span>
                        Ilość dostaw:{" "}
                        <span className="font-medium text-xl text-sky-600">
                            ({orders.length})
                        </span>
                    </span>
                    <div className="flex items-center justify-center gap-3">
                        {/* === Usuń wszystkie zlecenia === */}
                        {orders.length > 0 && (
                            <button
                                onClick={async () => {
                                    if (
                                        !confirm(
                                            "Na pewno chcesz usunąć wszystkie zlecenia?"
                                        )
                                    )
                                        return;
                                    setDeleting(-1); // np. -1 oznacza usuwanie wszystkich
                                    try {
                                        const res = await fetch("/api/orders", {
                                            method: "DELETE",
                                        });
                                        const data = await res.json();
                                        if (data.ok) loadOrders();
                                        else
                                            alert(
                                                "Błąd podczas usuwania zleceń"
                                            );
                                    } catch (err) {
                                        console.error(err);
                                        alert("Błąd połączenia z API");
                                    } finally {
                                        setDeleting(null);
                                    }
                                }}
                                className="text-red-700  hover:text-red-600 hover:border-red-200  font-semibold text-xs py-1.5 px-4 bg-red-50 hover:bg-red-100 transition-colors rounded-lg border border-red-500"
                            >
                                Usuń wszystkie zlecenia
                            </button>
                        )}
                    </div>
                </div>

                {loading || calculating ? (
                    <LoadingAcordeonSkeleon />
                ) : orders.length === 0 ? (
                    <div className="mt-6 text-center text-gray-500">
                        Brak zleceń.
                    </div>
                ) : (
                    <Accordion
                        type="single"
                        collapsible
                        className="flex flex-col gap-4 w-full"
                    >
                        {sortedOrders.map((o) => (
                            <AccordionItem
                                key={o.id}
                                value={`order-${o.id}`}
                                className={`border rounded-xl shadow-sm border-gray-200 bg-white ${
                                    o.completed
                                        ? "border-l-green-400 border-l-2"
                                        : "border-white"
                                }`}
                            >
                                <AccordionTrigger className="flex justify-between items-center p-4 text-lg font-medium">
                                    {o.time_range ? (
                                        <div className="flex items-center gap-2">
                                            <Clock size={20} />{" "}
                                            {o.time_range || "Brak godziny"}
                                        </div>
                                    ) : (
                                        <p className="">{o.address}</p>
                                    )}
                                    <span
                                        className={`px-3 py-1 rounded-xl text-xs md:text-sm border font-medium ${
                                            o.completed
                                                ? "bg-green-100 text-green-700 border-green-200"
                                                : "bg-gray-200 text-gray-700 border-gray-300"
                                        }`}
                                    >
                                        {o.completed
                                            ? `Zrealizowano ${new Date(
                                                  o.completed_at ?? ""
                                              ).toLocaleTimeString("pl-PL", {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })}`
                                            : "Do realizacji"}
                                    </span>
                                </AccordionTrigger>

                                <AccordionContent className="p-4 flex flex-col gap-3 border-t border-gray-200 relative">
                                    <h2 className="text-lg font-semibold">
                                        {o.client_name}
                                    </h2>
                                    <span className="text-sm text-gray-500">
                                        {o.type}
                                    </span>
                                    {o.description && (
                                        <p className="text-gray-600">
                                            {o.description}
                                        </p>
                                    )}

                                    <a
                                        href={`tel:${o.phone_number}`}
                                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
                                    >
                                        <Phone size={18} /> {o.phone_number}
                                    </a>

                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            o.address
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
                                    >
                                        <MapPin size={18} /> {o.address}
                                    </a>

                                    {o.photo_urls?.length && (
                                        <div className="flex gap-2 mt-2 overflow-x-auto w-full py-1">
                                            {o.photo_urls.map((url, j) => (
                                                <button
                                                    key={j}
                                                    onClick={() =>
                                                        setModal({
                                                            photos: o.photo_urls!,
                                                            index: j,
                                                        })
                                                    }
                                                    className="w-20 h-20 rounded-xl overflow-hidden shadow-sm flex-shrink-0 "
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Zdjęcie ${j + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* === Przycisk usuwania === */}
                                    <button
                                        onClick={() => deleteOrder(o.id)}
                                        disabled={deleting === o.id}
                                        className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </main>

            {/* === SIDEBAR FORM === */}
            <aside className="md:w-[360px] w-full h-fit sticky top-6 self-start space-y-6">
                <div className="w-full bg-white border border-gray-200 p-6 shadow rounded-2xl">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
                        <PlusCircle className="text-blue-600" /> Dodaj zlecenie
                    </h2>

                    <form onSubmit={handleAdd} className="flex flex-col gap-3">
                        <input
                            type="text"
                            value={form.clientName}
                            placeholder="Imię i nazwisko klienta"
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring focus:ring-blue-500 outline-none"
                            onChange={(e) =>
                                setForm({ ...form, clientName: e.target.value })
                            }
                            required
                        />
                        <input
                            type="tel"
                            value={form.phoneNumber}
                            placeholder="Numer telefonu"
                            className={`border rounded-lg px-3 py-2 bg-gray-50 focus:ring outline-none transition-all ${
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
                            <p className="text-red-500 text-sm -mt-2">
                                {phoneError}
                            </p>
                        )}

                        <input
                            type="text"
                            value={form.address}
                            placeholder="Adres dostawy"
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring focus:ring-blue-500 outline-none"
                            onChange={(e) =>
                                setForm({ ...form, address: e.target.value })
                            }
                            required
                        />
                        <textarea
                            value={form.description}
                            placeholder="Opis (opcjonalnie)"
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring focus:ring-blue-500 outline-none min-h-[70px]"
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    description: e.target.value,
                                })
                            }
                        />
                        <select
                            value={form.type}
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring focus:ring-blue-500 outline-none"
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
                            className="text-blue-700  hover:text-blue-600 hover:border-blue-200  font-semibold text-sm py-2 px-4 bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg border border-blue-500"
                        >
                            {adding ? "Dodawanie..." : "Dodaj zlecenie"}
                        </button>
                    </form>
                </div>

                <div className="w-full bg-white border border-gray-200 p-6 shadow rounded-2xl space-y-3">
                    <button
                        onClick={async () => {
                            setDownloading(true); // start loadera
                            try {
                                const res = await fetch(
                                    "/api/export-transports"
                                );
                                if (!res.ok) throw new Error("Błąd eksportu");
                                const blob = await res.blob();
                                if (typeof window !== "undefined") {
                                    const url =
                                        window.URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `${
                                        settings.page_title || "Dostawy"
                                    }.zip`;
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                }
                            } catch (err) {
                                alert("Nie udało się pobrać pliku.");
                                console.error(err);
                            } finally {
                                setDownloading(false); // stop loadera
                            }
                        }}
                        disabled={downloading}
                        className="text-sky-700 w-full hover:text-sky-600 hover:border-sky-200 font-semibold text-sm py-2 px-4 bg-sky-50 hover:bg-sky-100 transition-colors rounded-lg border border-sky-500 flex items-center justify-center gap-2"
                    >
                        {downloading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Pobieranie...
                            </>
                        ) : (
                            <>
                                <Download size={18} />
                                Pobierz transporty
                            </>
                        )}
                    </button>

                    <RoutePlanDialog
                        open={showRouteModal}
                        onClose={() => setShowRouteModal(false)}
                        handleRoutePlan={handleRoutePlan}
                    />

                    <button
                        onClick={() => setShowRouteModal(true)}
                        disabled={calculating}
                        className="text-pink-700 w-full hover:text-pink-600 hover:border-pink-200 font-semibold text-sm py-2 px-4 bg-pink-50 hover:bg-pink-100 transition-colors rounded-lg border border-pink-500 flex items-center justify-center gap-2"
                    >
                        {calculating ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Analizuję...
                            </>
                        ) : (
                            <>
                                <MapPin size={18} />
                                Rozpisz trasę
                            </>
                        )}
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
