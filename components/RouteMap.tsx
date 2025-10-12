"use client";

import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Polyline,
    Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type OrderWithCoords = {
    id: number;
    client_name: string;
    address: string;
    time_range: string;
    completed: boolean;
    coords?: [number, number]; // może być undefined, więc trzeba to uwzględnić
};

const WAREHOUSE = { coords: [52.167, 22.29] as [number, number], name: "Magazyn" };

export default function RouteMap({ orders }: { orders: OrderWithCoords[] }) {
    const [route, setRoute] = useState<[number, number][]>([]);

    useEffect(() => {
        if (orders.length) {
            // filtrujemy tylko te zamówienia, które mają coords
            const validCoords = orders
                .map((o) => o.coords)
                .filter((c): c is [number, number] => !!c);

            setRoute([WAREHOUSE.coords, ...validCoords]);
        }
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

    return (
        <div className="w-full h-[400px] rounded-2xl overflow-hidden z-0">
            <MapContainer
                center={WAREHOUSE.coords}
                zoom={12}
                style={{ width: "100%", height: "100%" }}
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
        </div>
    );
}
