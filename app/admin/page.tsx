"use client";
import { useState } from "react";

export default function AdminPage() {
    const [form, setForm] = useState({
        clientName: "",
        timeRange: "",
        description: "",
        type: "transport",
        address: "",
    });
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        setLoading(false);
        if (res.ok) alert("Zlecenie dodane ✅");
    }

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Dodaj zlecenie</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                    type="text"
                    placeholder="Imię i nazwisko klienta"
                    className="border p-2 rounded"
                    onChange={(e) =>
                        setForm({ ...form, clientName: e.target.value })
                    }
                />
                <input
                    type="text"
                    placeholder="Przedział godzinowy (np. 12-14)"
                    className="border p-2 rounded"
                    onChange={(e) =>
                        setForm({ ...form, timeRange: e.target.value })
                    }
                />
                <input
                    type="text"
                    placeholder="Adres dostawy"
                    className="border p-2 rounded"
                    onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                    }
                />
                <textarea
                    placeholder="Opis"
                    className="border p-2 rounded"
                    onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                    }
                />
                <select
                    className="border p-2 rounded"
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
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
                    disabled={loading}
                    className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                    {loading ? "Dodawanie..." : "Dodaj zlecenie"}
                </button>
            </form>
        </div>
    );
}
