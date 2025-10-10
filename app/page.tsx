"use client";
import { useEffect, useState } from "react";
import { Phone, MapPin, Upload, Clock } from "lucide-react";
import { SwiperModal } from "@/components/SwiperMd";

type Order = {
    id: number;
    client_name: string;
    phone_number: string;
    description: string;
    type: string;
    address: string;
    completed: boolean;
    completed_at?: string;
    time_range?: string;
    photo_urls?: string[];
};

type Settings = {
    page_title: string;
    start_hour: number;
};

export default function HomePage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [settings, setSettings] = useState<Settings>({
        page_title: "",
        start_hour: 10,
    });
    const [uploading, setUploading] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [galleryIndex, setGalleryIndex] = useState<number>(0);

    async function loadOrders() {
        setLoading(true);
        try {
            const res = await fetch("/api/orders");
            const data: Order[] = await res.json();

            data.sort((a, b) => {
                if (!a.time_range) return 1;
                if (!b.time_range) return -1;
                const [aH, aM] = a.time_range
                    .split(" - ")[0]
                    .split(":")
                    .map(Number);
                const [bH, bM] = b.time_range
                    .split(" - ")[0]
                    .split(":")
                    .map(Number);
                return aH * 60 + aM - (bH * 60 + bM);
            });

            setOrders(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function loadSettings() {
        try {
            const res = await fetch("/api/settings");
            const data: Settings = await res.json();
            setSettings(data);
        } catch (e) {
            console.error(e);
        }
    }

    async function markCompleted(id: number, photoUrls?: string[]) {
        try {
            await fetch(`/api/orders/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photoUrls }),
            });
            await loadOrders();
        } catch (e) {
            console.error(e);
        }
    }

    async function handleFileUpload(id: number, files: FileList) {
        setUploading(id);
        const uploadedUrls: string[] = [];
        try {
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();
                if (data?.ok && data.url) uploadedUrls.push(data.url);
            }
            if (uploadedUrls.length > 0) await markCompleted(id, uploadedUrls);
        } catch (e) {
            console.error(e);
            alert("Błąd przesyłania");
        } finally {
            setUploading(null);
        }
    }

    useEffect(() => {
        loadSettings();
        loadOrders();
    }, []);

    return (
        <div className="min-h-screen p-5 mt-2">
            {/* HEADER */}
            <header className="max-w-4xl mx-auto mb-6 flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-800">
                    {settings.page_title || "Dostawy"}
                </h1>
                <div className="flex flex-row items-center justify-between sm:gap-6 text-gray-600 font-medium text-lg">
                    <span>
                        Załadunek:{" "}
                        <span className="font-semibold text-gray-800">
                            {settings.start_hour}:00
                        </span>
                    </span>
                    <span>
                        Ilość dostaw:{" "}
                        <span className="font-semibold text-gray-800">
                            ({orders.length})
                        </span>
                    </span>
                </div>
            </header>

            {/* ORDERS LIST */}
            <main className="max-w-4xl mx-auto flex flex-col gap-8">
                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
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
                        <div
                            key={o.id}
                            id={`order-${o.id}`}
                            className={`scroll-m-4 rounded-xl shadow-lg p-5 flex flex-col gap-4 transition border border-gray-300 ${
                                o.completed
                                    ? "border-l-4 border-green-400 bg-green-50/60"
                                    : "bg-white"
                            }`}
                        >
                            {/* INFO */}
                            <div className="flex items-center justify-between">
                                {o.time_range && (
                                    <div className="flex items-center gap-2 text-2xl text-gray-700">
                                        <Clock size={26} /> {o.time_range}
                                    </div>
                                )}

                                <div
                                    className={`text-sm font-medium px-3 py-1.5 rounded-xl ${
                                        o.completed
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-200 text-gray-700"
                                    }`}
                                >
                                    {o.completed
                                        ? "Zrealizowano"
                                        : "Do realizacji"}
                                </div>
                            </div>

                            <h2 className="text-xl font-semibold text-gray-800">
                                {o.client_name}
                            </h2>
                            <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                                {o.type}
                            </span>
                            {o.description && (
                                <p className="text-gray-800 ml-1 mt-1">
                                    {o.description}
                                </p>
                            )}

                            {/* CONTACT */}
                            <div className="flex flex-col gap-2">
                                <a
                                    href={`tel:${o.phone_number}`}
                                    className="flex items-center gap-2 bg-green-50 rounded-xl px-4 py-2 font-medium hover:bg-green-100 transition-colors"
                                >
                                    <Phone size={20} /> {o.phone_number}
                                </a>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                        o.address
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-2 text-gray-700 font-medium hover:bg-blue-100 transition-colors"
                                >
                                    <MapPin size={20} /> {o.address}
                                </a>
                            </div>

                            {/* PHOTOS */}
                            {o.photo_urls?.length && (
                                <div className="flex gap-2 mt-2 overflow-x-auto py-1">
                                    {o.photo_urls.map((url, j) => (
                                        <button
                                            key={j}
                                            onClick={() => {
                                                setGalleryImages(o.photo_urls!);
                                                setGalleryIndex(j);
                                            }}
                                            className="w-20 h-20 rounded-xl overflow-hidden shadow-sm flex-shrink-0 cursor-pointer"
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

                            {/* ACTIONS */}
                            <div className="flex flex-col gap-3 mt-2">
                                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition cursor-pointer">
                                    {uploading === o.id ? (
                                        <span className="loader-border w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" />
                                    ) : (
                                        <>
                                            <Upload size={20} />{" "}
                                            {o.photo_urls?.length
                                                ? "Dodaj kolejne zdjęcie"
                                                : "Dodaj zdjęcie"}
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            const files = e.target.files;
                                            if (files)
                                                handleFileUpload(o.id, files);
                                        }}
                                    />
                                </label>

                                {!o.completed && (
                                    <button
                                        onClick={() => {
                                            if (
                                                !confirm(
                                                    "Oznaczyć jako zrealizowane bez zdjęć?"
                                                )
                                            )
                                                return;
                                            markCompleted(o.id);
                                        }}
                                        className="px-4 py-2 border rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition"
                                    >
                                        Oznacz jako zrealizowane
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* SWIPER MODAL */}
            {galleryImages.length > 0 && (
                <SwiperModal
                    images={galleryImages}
                    initialIndex={galleryIndex}
                    onClose={() => setGalleryImages([])}
                />
            )}
        </div>
    );
}
