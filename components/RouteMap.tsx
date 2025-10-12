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
    coords?: [number, number] | undefined;
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

  useEffect(() => {
    if (sortedOrders.length) {
        const coordsOnly = sortedOrders
            .map((o) => o.coords)
            .filter((c): c is [number, number] => c !== undefined);
        setRoute([WAREHOUSE.coords, ...coordsOnly]);
    }

    const timer = setTimeout(() => setShowMap(true), 100);
    return () => clearTimeout(timer);
}, [sortedOrders]);

    const warehouseIcon = new L.Icon({
        iconUrl: "/home.svg",
        iconSize: [25, 25],
        iconAnchor: [12, 25],
    });

    const orderIcon = new L.Icon({
        iconUrl: "/map-pin.svg",
        iconSize: [20, 20],
        iconAnchor: [10, 20],
    });

    const hasCoords = orders.some((o) => o.coords);

    return (
        <motion.div
            initial={{ height: 0 }}
            animate={{ height: hasCoords ? 600 : 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="w-full rounded-2xl overflow-hidden z-0"
        >
            {showMap && (
                <MapContainer
                    center={WAREHOUSE.coords}
                    zoom={12}
                    style={{ width: "100%", height: "600px" }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    <Marker position={WAREHOUSE.coords} icon={warehouseIcon}>
                        <Popup>{WAREHOUSE.name}</Popup>
                    </Marker>

                    {sortedOrders.map((o, i) =>
                        o.coords ? (
                            <Marker
                                key={o.id}
                                position={o.coords}
                                icon={orderIcon}
                            >
                                <Popup>
                                    {i + 1}. {o.client_name} ({o.time_range})
                                </Popup>
                            </Marker>
                        ) : null
                    )}

                    {route.length > 1 && route.every(Boolean) && (
                        <Polyline
                            positions={route as [number, number][]}
                            pathOptions={{ color: "#3b82f6", weight: 4 }}
                        />
                    )}
                </MapContainer>
            )}
        </motion.div>
    );
}
