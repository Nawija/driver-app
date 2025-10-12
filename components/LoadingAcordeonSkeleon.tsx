export default function LoadingAcordeonSkeleon() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    className="animate-pulse bg-white p-4.5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full" />
                        <div className="h-5 w-32 bg-gray-200 rounded" />
                    </div>
                    <div className="h-6 w-28 bg-gray-200 rounded-full" />
                    <div />
                </div>
            ))}
        </div>
    );
}
