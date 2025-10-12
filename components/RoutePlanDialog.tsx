"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
            <DialogContent className="max-w-md text-center rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-gray-800">
                        Jak chcesz rozplanować trasę?
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Wybierz sposób, w jaki mam ułożyć dostawy.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 mt-4">
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 font-semibold transition"
                        onClick={() => handleRoutePlan("manual")}
                    >
                        Według kolejności dodania
                    </Button>
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white py-2 font-semibold transition"
                        onClick={() => handleRoutePlan("auto")}
                    >
                        Zoptymalizuj trasę automatycznie
                    </Button>
                </div>

                <DialogFooter className="mt-3">
                    <Button
                        variant="ghost"
                        className="text-gray-500 hover:text-gray-700 text-sm"
                        onClick={onClose}
                    >
                        Anuluj
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
