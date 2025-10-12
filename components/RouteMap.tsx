"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
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
    const [showMap, setShowMap] = useState(false); // kontrola animacji

    useEffect(() => {
        if (orders.length) {
            const validCoords = orders
                .map((o) => o.coords)
                .filter((c): c is [number, number] => !!c);

            setRoute([WAREHOUSE.coords, ...validCoords]);
        }

        // trigger animacji po zamontowaniu komponentu
        const timer = setTimeout(() => setShowMap(true), 100);
        return () => clearTimeout(timer);
    }, [orders]);

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
            animate={{ height: hasCoords ? 400 : 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="w-full rounded-2xl overflow-hidden z-0 h-[400px]"
        >
            {showMap && (
                <MapContainer
                    center={WAREHOUSE.coords}
                    zoom={12}
                    style={{ width: "100%", height: "400px" }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    <Marker position={WAREHOUSE.coords} icon={warehouseIcon}>
                        <Popup>{WAREHOUSE.name}</Popup>
                    </Marker>

                    {orders.map((o, i) =>
                        o.coords ? (
                            <Marker key={o.id} position={o.coords} icon={orderIcon}>
                                <Popup>
                                    {i + 1}. {o.client_name} ({o.time_range})
                                </Popup>
                            </Marker>
                        ) : null
                    )}

                    {route.length > 1 && (
                        <Polyline
                            positions={route}
                            pathOptions={{ color: "#3b82f6", weight: 4 }}
                        />
                    )}
                </MapContainer>
            )}
        </motion.div>
    );
}
