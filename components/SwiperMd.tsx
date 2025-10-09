/** Swiper image modal z zoomem i ESC */
import { useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Keyboard, Zoom } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/zoom";
import { X } from "lucide-react";

export function SwiperModal({
    images,
    initialIndex,
    onClose,
}: {
    images: string[];
    initialIndex: number;
    onClose: () => void;
}) {
    useEffect(() => {
        // Zamknij na ESC
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    if (!images || images.length === 0) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative rounded-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    aria-label="Close gallery"
                    onClick={onClose}
                    className="absolute top-12 right-3 md:right-12 z-10 bg-white border-2 text-amber-600 border-amber-500 cursor-pointer rounded-full p-2 shadow hover:bg-white"
                >
                    <X size={19} />
                </button>

                <Swiper
                    modules={[Navigation, Pagination, Keyboard, Zoom]}
                    navigation
                    pagination={{ clickable: true }}
                    keyboard={{ enabled: true }}
                    zoom={{ maxRatio: 3 }}
                    initialSlide={initialIndex}
                    className="w-[97vw] h-[97vh]"
                >
                    {images.map((src, i) => (
                        <SwiperSlide
                            key={i}
                            className="flex items-center justify-center"
                        >
                            <div className="swiper-zoom-container">
                                <img
                                    src={src}
                                    alt={`Zdjęcie ${i + 1}`}
                                    className="object-contain w-full h-full select-none"
                                    draggable={false}
                                />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
}
