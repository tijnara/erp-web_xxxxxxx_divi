"use client";

interface Stats {
    total: number;
    pending: number;
    received: number;
    unpaid: number;
    paid: number;
}

export function StatBar({ stats }: { stats: Stats }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-3">
                <div className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <h3 className="text-sm font-medium">Total Orders</h3>
                </div>
                <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-3">
                <div className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <h3 className="text-sm font-medium">Pending Orders</h3>
                </div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-3">
                <div className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <h3 className="text-sm font-medium">Received Orders</h3>
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.received}</div>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-3">
                <div className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <h3 className="text-sm font-medium">Unpaid Orders</h3>
                </div>
                <div className="text-2xl font-bold text-red-600">{stats.unpaid}</div>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-3">
                <div className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <h3 className="text-sm font-medium">Paid Orders</h3>
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            </div>
        </div>
    );
}