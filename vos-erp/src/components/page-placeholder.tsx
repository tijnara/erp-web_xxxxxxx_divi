export default function PagePlaceholder({ title }: { title: string }) {
    return (
        <div className="rounded-xl border border-border bg-card p-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-muted-foreground mt-2">Content coming soon.</p>
        </div>
    );
}
