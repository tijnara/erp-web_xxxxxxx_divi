import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Announcement } from "../types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
    announcements: Announcement[];
}

export default function ResponsiveAnnouncementCarousel({ announcements }: Props) {
    const today = new Date();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardsPerView, setCardsPerView] = useState(3);
    const containerRef = useRef<HTMLDivElement>(null);

    const visibleAnnouncements = announcements.filter(item => {
        if (!item.hidden_date) return true;
        return new Date(item.hidden_date) >= today;
    });

    const displayList = visibleAnnouncements;

    // Responsive cards per view
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) setCardsPerView(1); // mobile
            else if (window.innerWidth < 1024) setCardsPerView(2); // tablet
            else setCardsPerView(3); // desktop
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Auto-slide
    useEffect(() => {
        if (displayList.length <= cardsPerView) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % displayList.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [displayList.length, cardsPerView]);

    const slidePrev = () => {
        setCurrentIndex(prev => (prev - 1 + displayList.length) % displayList.length);
    };

    const slideNext = () => {
        setCurrentIndex(prev => (prev + 1) % displayList.length);
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "General": return "bg-gray-200 text-gray-900";
            case "Update": return "bg-blue-100 text-blue-800";
            case "Urgent": return "bg-red-100 text-red-800";
            case "Event": return "bg-purple-100 text-purple-800";
            case "Maintenance": return "bg-amber-100 text-amber-800";
            case "Holiday": return "bg-green-100 text-green-800";
            default: return "bg-gray-200 text-gray-900";
        }
    };

    // Calculate pixel width per card dynamically
    const getCardWidth = () => {
        if (containerRef.current) {
            return containerRef.current.offsetWidth / cardsPerView;
        }
        return 300; // fallback
    };

    return (
        <div className="relative w-full">
            {/* Carousel container */}
            <div className="overflow-hidden w-full" ref={containerRef}>
                <div
                    className="flex transition-transform duration-700 ease-in-out"
                    style={{
                        transform: `translateX(-${currentIndex * getCardWidth()}px)`,
                    }}
                >
                    {displayList.concat(displayList.slice(0, cardsPerView)).map((item, idx) => (
                        <Link
                            key={idx}
                            href={`/hr/announcementpage/${item.id}`}
                            className="flex-shrink-0 border rounded-xl shadow-lg hover:shadow-2xl transition hover:bg-gray-50 flex flex-col overflow-hidden
                w-full sm:w-1/2 lg:w-1/3"
                        >
                            {item.image && (
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-40 object-cover"
                                />
                            )}
                            <div className="p-4 flex flex-col flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-700 flex-1 mb-3">
                                    {item.content.length > 120 ? item.content.slice(0, 120) + "..." : item.content}
                                </p>
                                <div className="flex justify-between items-center mt-auto">
                                    <p className="text-xs text-gray-400">
                                        Posted by {item.created_by} on {new Date(item.posting_date).toLocaleDateString()}
                                    </p>
                                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getTypeColor(item.type)}`}>
                    {item.type}
                  </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Arrows */}
            <button
                onClick={slidePrev}
                className="absolute top-1/2 left-2 -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-100 transition z-10"
            >
                <ChevronLeft size={20} />
            </button>
            <button
                onClick={slideNext}
                className="absolute top-1/2 right-2 -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-100 transition z-10"
            >
                <ChevronRight size={20} />
            </button>

            {/* Dots indicators */}
            <div className="flex justify-center mt-4 gap-2">
                {displayList.map((_, idx) => (
                    <span
                        key={idx}
                        className={`h-2 w-2 rounded-full transition ${
                            idx === currentIndex % displayList.length
                                ? "bg-blue-500"
                                : "bg-gray-300"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
