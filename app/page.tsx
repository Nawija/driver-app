"use client";
import { useEffect, useState, useRef } from "react";
import { Phone, MapPin, Upload, Clock, X, PencilLine } from "lucide-react";
import { SwiperModal } from "@/components/SwiperMd";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import SignatureCanvas from "react-signature-canvas";
import LoadingAcordeonSkeleon from "@/components/LoadingAcordeonSkeleon";

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
    signature?: string;
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
    const [savingSignature, setSavingSignature] = useState(false);
    // podpis
    const [signatureMap, setSignatureMap] = useState<{
        [id: number]: string | null;
    }>({});
    const [showSignatureMap, setShowSignatureMap] = useState<{
        [id: number]: boolean;
    }>({});
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [activeSignatureOrder, setActiveSignatureOrder] = useState<
        number | null
    >(null);

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

    async function markCompleted(
        id: number,
        photoUrls?: string[],
        signature?: string
    ) {
        try {
            await fetch(`/api/orders/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photoUrls, signature }),
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
            if (uploadedUrls.length > 0)
                await markCompleted(
                    id,
                    uploadedUrls,
                    signatureMap[id] || undefined
                );
        } catch (e) {
            console.error(e);
            alert("Błąd przesyłania zdjęć");
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
                <h1 className="text-3xl font-bold text-gray-800 mb-3">
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
                    <LoadingAcordeonSkeleon />
                ) : orders.length === 0 ? (
                    <div className="bg-white p-6 rounded-2xl shadow text-center text-gray-500">
                        Brak zleceń do wyświetlenia.
                    </div>
                ) : (
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full flex flex-col gap-4"
                    >
                        {orders.map((o) => (
                            <AccordionItem
                                key={o.id}
                                value={`order-${o.id}`}
                                className={`border-2 rounded-xl shadow-sm bg-white ${
                                    o.completed
                                        ? "border-l-green-400 border-l-2"
                                        : "border-white"
                                }`}
                            >
                                <AccordionTrigger className="flex justify-between items-center p-4 text-lg font-medium">
                                    <div className="flex items-center gap-2">
                                        <Clock size={24} />{" "}
                                        {o.time_range || "Brak godziny"}
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-xl text-sm font-medium ${
                                            o.completed
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-200 text-gray-700"
                                        }`}
                                    >
                                        {o.completed
                                            ? "Zrealizowano"
                                            : "Do realizacji"}
                                    </span>
                                </AccordionTrigger>

                                <AccordionContent className="p-4 border-t border-gray-200 flex flex-col gap-4">
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        {o.client_name}
                                    </h2>
                                    <span className="inline-block bg-gray-100 text-gray-700 px-3 py-2 rounded-xl font-medium">
                                        {o.type}
                                    </span>
                                    {o.description && (
                                        <p className="text-gray-800">
                                            {o.description}
                                        </p>
                                    )}

                                    <div className="flex flex-col gap-4">
                                        <a
                                            href={`tel:${o.phone_number}`}
                                            className="flex items-center gap-2 bg-green-50 text-green-800 rounded-xl px-4 py-2 font-medium hover:bg-green-100 transition-colors"
                                        >
                                            <Phone size={20} /> {o.phone_number}
                                        </a>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                o.address
                                            )}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 bg-blue-50 rounded-xl text-blue-800 px-4 py-2 font-medium hover:bg-blue-100 transition-colors"
                                        >
                                            <MapPin size={20} /> {o.address}
                                        </a>
                                    </div>

                                    {/* GALERIA */}
                                    {o.photo_urls?.length && (
                                        <div className="flex gap-2 mt-2 overflow-x-auto py-1">
                                            {o.photo_urls.map((url, j) => (
                                                <button
                                                    key={j}
                                                    onClick={() => {
                                                        setGalleryImages(
                                                            o.photo_urls!
                                                        );
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

                                    {/* AKCJE */}
                                    <div className="flex flex-col gap-3 mt-2">
                                        {/* DODAJ ZDJĘCIE */}
                                        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition cursor-pointer">
                                            {uploading === o.id ? (
                                                <span className="loader-border w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" />
                                            ) : (
                                                <>
                                                    <Upload size={20} />
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
                                                    const files =
                                                        e.target.files;
                                                    if (files)
                                                        handleFileUpload(
                                                            o.id,
                                                            files
                                                        );
                                                }}
                                            />
                                        </label>

                                        {/* POKAŻ PODPIS */}
                                        {!signatureMap[o.id] && (
                                            <button
                                                onClick={() =>
                                                    setActiveSignatureOrder(
                                                        o.id
                                                    )
                                                }
                                                className="px-4 py-2 bg-blue-200 rounded-xl font-semibold flex items-center justify-center gap-2"
                                            >
                                                <PencilLine size={20} />
                                                <span>Podpis klienta</span>
                                            </button>
                                        )}

                                        {/* OZNACZ JAKO ZREALIZOWANE */}
                                        {!o.completed && (
                                            <button
                                                onClick={() => {
                                                    if (!signatureMap[o.id]) {
                                                        alert(
                                                            "Klient musi podpisać się przed oznaczeniem jako zrealizowane."
                                                        );
                                                        return;
                                                    }
                                                    markCompleted(
                                                        o.id,
                                                        undefined,
                                                        signatureMap[o.id]!
                                                    );
                                                }}
                                                className="px-4 py-2 border cursor-pointer rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition"
                                            >
                                                Oznacz jako zrealizowane
                                            </button>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
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

            {/* FULLSCREEN PODPIS */}
            {activeSignatureOrder !== null && (
                <div className="fixed inset-0 bg-black/70 z-50 flex flex-col items-center justify-center p-4">
                    <div className="bg-white w-full h-full flex flex-col items-center justify-center relative rounded-xl">
                        <button
                            className="absolute top-4 right-4 p-2 text-gray-600 hover:text-black"
                            onClick={() => setActiveSignatureOrder(null)}
                        >
                            <X size={24} />
                        </button>
                        <SignatureCanvas
                            ref={sigCanvas}
                            penColor="black"
                            canvasProps={{
                                className: "w-full h-full border rounded-xl",
                            }}
                        />
                        <div className="flex gap-4 mt-2 pb-2">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded"
                                onClick={() => sigCanvas.current?.clear()}
                            >
                                Wyczyść
                            </button>

                            <button
                                className="px-4 py-2 bg-green-800 text-white rounded flex items-center justify-center gap-2"
                                onClick={async () => {
                                    if (
                                        !sigCanvas.current ||
                                        activeSignatureOrder === null
                                    )
                                        return;

                                    setSavingSignature(true); // 🔹 włączamy spinner

                                    const tempCanvas =
                                        document.createElement("canvas");
                                    tempCanvas.width =
                                        sigCanvas.current.getCanvas().width;
                                    tempCanvas.height =
                                        sigCanvas.current.getCanvas().height;
                                    const ctx = tempCanvas.getContext("2d");
                                    if (!ctx) {
                                        setSavingSignature(false);
                                        return;
                                    }
                                    ctx.fillStyle = "white";
                                    ctx.fillRect(
                                        0,
                                        0,
                                        tempCanvas.width,
                                        tempCanvas.height
                                    );
                                    ctx.drawImage(
                                        sigCanvas.current.getCanvas(),
                                        0,
                                        0
                                    );

                                    tempCanvas.toBlob(async (blob) => {
                                        if (!blob) {
                                            setSavingSignature(false);
                                            return;
                                        }

                                        const formData = new FormData();
                                        formData.append(
                                            "file",
                                            blob,
                                            `signature_${activeSignatureOrder}.png`
                                        );

                                        try {
                                            const uploadRes = await fetch(
                                                "/api/upload",
                                                {
                                                    method: "POST",
                                                    body: formData,
                                                }
                                            );
                                            const data = await uploadRes.json();
                                            if (data?.ok && data.url) {
                                                // Zapis podpisu w bazie
                                                await fetch(
                                                    `/api/orders/${activeSignatureOrder}`,
                                                    {
                                                        method: "PATCH",
                                                        headers: {
                                                            "Content-Type":
                                                                "application/json",
                                                        },
                                                        body: JSON.stringify({
                                                            photoUrls: [
                                                                data.url,
                                                            ],
                                                        }),
                                                    }
                                                );

                                                // Aktualizacja frontend
                                                setOrders((prev) =>
                                                    prev.map((o) =>
                                                        o.id ===
                                                        activeSignatureOrder
                                                            ? {
                                                                  ...o,
                                                                  photo_urls: [
                                                                      ...(o.photo_urls ||
                                                                          []),
                                                                      data.url,
                                                                  ],
                                                              }
                                                            : o
                                                    )
                                                );

                                                setSignatureMap((prev) => ({
                                                    ...prev,
                                                    [activeSignatureOrder]:
                                                        data.url,
                                                }));
                                                setActiveSignatureOrder(null);
                                            }
                                        } catch (err) {
                                            console.error(
                                                "❌ Błąd zapisu podpisu",
                                                err
                                            );
                                            alert(
                                                "Nie udało się zapisać podpisu"
                                            );
                                        } finally {
                                            setSavingSignature(false); // 🔹 wyłączamy spinner
                                        }
                                    }, "image/png");
                                }}
                            >
                                {savingSignature ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="loader-border w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" />
                                        <p>Zapisuje...</p>
                                    </div>
                                ) : (
                                    "Zapisz podpis"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
