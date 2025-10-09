"use client";
import { useEffect, useState } from "react";
import {
    Phone,
    MapPin,
    Upload,
    Check,
    Clock,
    X,
} from "lucide-react";
import Link from "next/link";
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
};

function formatTime(time?: string) {
    if (!time) return "";
    try {
        return new Date(time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return time;
    }
}


export default function HomePage() {
    const [orders, setOrders] = useState<Order[]>([]);
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
                const parseStart = (s = "") => {
                    const p = s.split("-")[0].trim();
                    const n = parseInt(p, 10);
                    return Number.isNaN(n) ? 0 : n;
                };
                return parseStart(a.time_range) - parseStart(b.time_range);
            });
            setOrders(data);
        } catch (e) {
            console.error("Unable to load orders", e);
        } finally {
            setLoading(false);
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
            console.error("Mark completed failed", e);
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
            console.error("Upload error", e);
            alert("Błąd przesyłania. Spróbuj ponownie.");
        } finally {
            setUploading(null);
        }
    }

    useEffect(() => {
        loadOrders();
    }, []);

    return (
        <div className="min-h-screen p-5 sm:p-8">
            <header className="max-w-3xl mx-auto mb-6">
                <div className="flex items-center justify-between w-full">
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                        Lista Dostaw
                    </h1>
                    <Link
                        href="tel:570037077"
                        className="text-sm text-white rounded-xl bg-black px-4 py-2.5 hover:bg-green-200 transition-colors font-semibold"
                    >
                        Zadzwoń na salon
                    </Link>
                </div>
                <div className="text-sm text-gray-600">
                    <div>
                        Stan:{" "}
                        <span className="font-medium text-gray-800">
                            {orders.length} dostawy
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="animate-pulse bg-gray-50 p-4 rounded-xl border border-gray-100"
                            >
                                <div className="h-4 w-1/3 bg-gray-200 rounded mb-3" />
                                <div className="h-3 w-1/2 bg-gray-200 rounded mb-2" />
                                <div className="h-10 w-full bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-100 text-center">
                        <p className="text-gray-600">
                            Brak zleceń do wyświetlenia.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {orders.map((o) => (
                            <li
                                key={o.id}
                                className={`group border border-gray-300 rounded-xl p-4 sm:p-5 shadow-sm transition-shadow flex flex-col sm:flex-row gap-4 ${
                                    o.completed
                                        ? " border-green-600 bg-green-50/55"
                                        : "bg-white hover:shadow-md"
                                }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="w-full">
                                            <div className="flex items-center justify-between w-full gap-2 mt-2 text-sm text-gray-600 mb-6">
                                                <div className="flex items-center gap-1 text-blue-700">
                                                    <Clock size={27} />
                                                    <span className="font-semibold text-2xl">
                                                        {o.time_range}
                                                    </span>
                                                </div>
                                                <div className="flex">
                                                    {o.completed ? (
                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-200 border border-green-100 text-sm text-green-700">
                                                            <Check size={14} />
                                                            <span>
                                                                {formatTime(
                                                                    o.completed_at
                                                                )}{" "}
                                                                • Zrealizowano
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-yellow-50 border border-yellow-800/20 text-sm text-yellow-700">
                                                            <span>
                                                                Do realizacji
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-semibold mb-2 ml-1">
                                                {o.client_name}
                                            </h3>

                                            <span className="text-lg inline-block px-3 py-1 rounded-xl bg-blue-100 text-blue-800 font-medium">
                                                {o.type}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 items-start space-y-3">
                                        <div className="flex items-center gap-2 w-full">
                                            <a
                                                href={`tel:${o.phone_number}`}
                                                className="flex items-center border border-gray-400 px-3 py-1 w-full rounded-xl justify-center gap-2 font-medium text-lg text-gray-800 hover:underline"
                                            >
                                                <Phone size={18} className="text-gray-400" />
                                                {o.phone_number}
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-2 w-full">
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                    o.address
                                                )}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center border border-gray-400 px-3 w-full py-1 text-lg rounded-xl justify-center gap-2 font-medium text-blue-600 hover:underline"
                                            >
                                                <MapPin size={18} />
                                                {o.address}
                                            </a>
                                        </div>
                                    </div>

                                    <p className="mt-3 text-lg text-red-600 ml-1">
                                        {o.description}
                                    </p>

                                    {o.photo_urls?.length ? (
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            {o.photo_urls.map((url, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => {
                                                        setGalleryImages(o.photo_urls!);
                                                        setGalleryIndex(i);
                                                    }}
                                                    aria-label={`Otwórz zdjęcie ${i + 1}`}
                                                    className="w-16 h-16 rounded-md cursor-pointer overflow-hidden border border-gray-100 shadow-sm bg-white"
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Zdjęcie ${i + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="flex-shrink-0 flex flex-col py-2 items-stretch sm:items-end gap-2 w-full sm:w-auto">
                                    <label className="relative flex items-center gap-2 text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-xl cursor-pointer hover:bg-blue-700 transition">
                                        {uploading === o.id ? (
                                            <div className="flex items-center gap-2">
                                                <span className="loader-border w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></span>
                                                Przesyłanie...
                                            </div>
                                        ) : (
                                            <>
                                                <Upload size={16} />
                                                <span>
                                                    {o.photo_urls?.length
                                                        ? "Dodaj kolejne zdjęcie"
                                                        : "Dodaj zdjęcie"}
                                                </span>
                                            </>
                                        )}
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

                                    {!o.completed && (
                                        <button
                                            onClick={() => {
                                                if (!confirm("Oznaczyć jako zrealizowane bez zdjęć?"))
                                                    return;
                                                markCompleted(o.id);
                                            }}
                                            className="mt-1 text-sm px-3 py-2 rounded-xl border font-semibold border-gray-200 bg-white hover:bg-gray-50 transition"
                                        >
                                            Oznacz jako zrealizowane
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </main>

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
