"use client";

import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Polyline,
    Popup,
} from "react-leaflet";
import { motion } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type OrderWithCoords = {
    id: number;
    client_name: string;
    address: string;
    time_range: string;
    completed: boolean;
    coords?: [number, number];
};

const WAREHOUSE = {
    coords: [52.1679445, 22.2841944] as [number, number],
    name: "Magazyn",
};

export default function RouteMap({ orders }: { orders: OrderWithCoords[] }) {
    const [route, setRoute] = useState<[number, number][]>([]);
    const [showMap, setShowMap] = useState(false);

    const parseTimeRange = (range: string) => {
        const [start] = range.split("-").map((s) => s.trim());
        const [h, m] = start.split(":").map(Number);
        return h * 60 + m;
    };

    // Sortowanie orders po time_range
    const sortedOrders = [...orders].sort((a, b) => {
        if (!a.time_range) return 1;
        if (!b.time_range) return -1;
        return parseTimeRange(a.time_range) - parseTimeRange(b.time_range);
    });

    // Sprawdzenie, czy wszystkie zamówienia mają time_range
    const allHaveTimeRange = sortedOrders.every(
        (o) => o.time_range && o.time_range.trim() !== ""
    );

    useEffect(() => {
        if (sortedOrders.length && allHaveTimeRange) {
            const coordsOnly = sortedOrders
                .map((o) => o.coords)
                .filter((c): c is [number, number] => c !== undefined);
            setRoute([WAREHOUSE.coords, ...coordsOnly]);
        }

        const timer = setTimeout(() => setShowMap(true), 100);
        return () => clearTimeout(timer);
    }, [sortedOrders, allHaveTimeRange]);

    const warehouseIcon = new L.Icon({
        iconUrl: "/home.svg",
        iconSize: [25, 25],
        iconAnchor: [12, 25],
    });

    const hasCoords = orders.some((o) => o.coords);

    // Render mapy tylko jeśli wszystkie orders mają time_range
    if (!allHaveTimeRange) return null;

    return (
        <motion.div
            initial={{ height: 0 }}
            animate={{ height: hasCoords ? 450 : 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="w-full rounded-2xl overflow-hidden z-0"
        >
            {showMap && route.length > 1 && (
                <MapContainer
                    center={WAREHOUSE.coords}
                    zoom={12}
                    style={{ width: "100%", height: "450px" }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    <Marker position={WAREHOUSE.coords} icon={warehouseIcon}>
                        <Popup>{WAREHOUSE.name}</Popup>
                    </Marker>

                    {sortedOrders.map(
                        (o, i) =>
                            o.coords && (
                                <Marker
                                    key={o.id}
                                    position={o.coords}
                                    icon={
                                        new L.DivIcon({
                                            html: `<div style="
                        background-color:${o.completed ? "#119334" : "#d23f73"};
                        color:white;
                        border-radius:50%;
                        width:20px;
                        height:20px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:12px;
                        font-weight:bold;
                        pointer-events:none;
                        border:1px solid white;
                        box-shadow:0 0 4px rgba(0,0,0,0.3);
                    ">${i + 1}</div>`,
                                            className: "",
                                            iconSize: [35, 35],
                                            iconAnchor: [12, 12],
                                        })
                                    }
                                >
                                    <Popup>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "4px",
                                            }}
                                        >
                                            <strong>
                                                {i + 1}. Godzina: (
                                                {o.time_range})
                                            </strong>
                                            <span className="ml-4">
                                                {o.client_name}
                                            </span>
                                            <span className="ml-4">
                                                {o.address}
                                            </span>
                                        </div>
                                    </Popup>
                                </Marker>
                            )
                    )}

                    {route.length > 1 && route.every(Boolean) && (
                        <Polyline
                            positions={route as [number, number][]}
                            pathOptions={{ color: "#4f8df0", weight: 4 }}
                        />
                    )}
                </MapContainer>
            )}
        </motion.div>
    );
}
