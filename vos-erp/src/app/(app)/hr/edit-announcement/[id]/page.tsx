"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Announcement } from "@/modules/announcements-management/types";
import { fetchAnnouncements } from "@/modules/announcements-management/providers/HttpDataProvider";

export default function EditAnnouncementPage() {
    const params = useParams();
    const router = useRouter();
    const announcementId = params.id;

    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState("");
    const [hiddenDate, setHiddenDate] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        async function loadAnnouncement() {
            try {
                const data = await fetchAnnouncements();
                const found = data.find(a => a.id.toString() === announcementId);
                if (found) {
                    setAnnouncement(found);
                    setTitle(found.title);
                    setContent(found.content);
                    setType(found.type);
                    setHiddenDate(found.hidden_date);
                    setPreview(found.image || null);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadAnnouncement();
    }, [announcementId]);

    if (loading) return <p>Loading announcement...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!announcement) return <p>Announcement not found</p>;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImage(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let res;
            if (image) {
                // If new image uploaded, send as FormData
                const formDataToSend = new FormData();
                formDataToSend.append("title", title);
                formDataToSend.append("content", content);
                formDataToSend.append("type", type);
                formDataToSend.append("hidden_date", hiddenDate);
                formDataToSend.append("image", image);

                res = await fetch(`http://100.119.3.44:8090/items/announcement/${announcementId}`, {
                    method: "PATCH",
                    body: formDataToSend,
                });
            } else {
                // Otherwise send JSON
                res = await fetch(`http://100.119.3.44:8090/items/announcement/${announcementId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title,
                        content,
                        type,
                        hidden_date: hiddenDate,
                    }),
                });
            }

            if (!res.ok) throw new Error("Failed to save announcement");
            router.push("/hr/announcements");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Edit Announcement</h1>

            <div className="flex flex-col gap-4 max-w-xl">
                <label className="flex flex-col">
                    Title
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="border rounded p-2"
                    />
                </label>

                <label className="flex flex-col">
                    Content
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="border rounded p-2"
                        rows={5}
                    />
                </label>

                <label className="flex flex-col">
                    Type
                    <input
                        type="text"
                        value={type}
                        onChange={e => setType(e.target.value)}
                        className="border rounded p-2"
                    />
                </label>

                <label className="flex flex-col">
                    Hidden Date
                    <input
                        type="date"
                        value={hiddenDate}
                        onChange={e => setHiddenDate(e.target.value)}
                        className="border rounded p-2"
                    />
                </label>

                {/* ✅ Image Section */}
                <label className="flex flex-col">
                    Image
                    {preview && (
                        <img
                            src={
                                preview.startsWith("data:")
                                    ? preview
                                    : `http://100.119.3.44:8090/assets/${preview}`
                            }
                            alt="Current"
                            className="w-48 h-32 object-cover rounded border mb-2"
                        />
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="border p-2 rounded"
                    />
                </label>

                {error && <p className="text-red-500">{error}</p>}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    );
}
