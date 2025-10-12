"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { List, Zap, X } from "lucide-react"; // Ikony

interface RoutePlanDialogProps {
    open: boolean;
    onClose: () => void;
    handleRoutePlan: (mode: "manual" | "auto") => void;
}

export function RoutePlanDialog({
    open,
    onClose,
    handleRoutePlan,
}: RoutePlanDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm text-center rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-gray-800">
                        Jak chcesz rozplanować trasę?
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Wybierz sposób, w jaki mam ułożyć dostawy.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 mt-4">
                    <button
                        onClick={() => {
                            handleRoutePlan("manual");
                            const element = document.getElementById("delivery");
                            if (element) {
                                element.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                });
                            }
                        }}
                        className="text-sky-700 w-full hover:text-sky-600 hover:border-sky-200 font-semibold text-sm py-2 px-4 bg-sky-50 hover:bg-sky-100 transition-colors rounded-lg border border-sky-500 flex items-center justify-center gap-2"
                    >
                        <List size={18} />
                        Według kolejności dodania
                    </button>

                    <button
                        onClick={() => {
                            handleRoutePlan("auto");
                            const element = document.getElementById("delivery");
                            if (element) {
                                element.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                });
                            }
                        }}
                        className="text-green-700 w-full hover:text-green-600 hover:border-green-200 font-semibold text-sm py-2 px-4 bg-green-50 hover:bg-green-100 transition-colors rounded-lg border border-green-500 flex items-center justify-center gap-2"
                    >
                        <Zap size={18} />
                        Zoptymalizuj trasę automatycznie
                    </button>
                </div>

                <DialogFooter className="mt-3">
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-sm w-full py-2 px-4 border border-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2 bg-white hover:bg-gray-50"
                    >
                        <X size={16} />
                        Anuluj
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
