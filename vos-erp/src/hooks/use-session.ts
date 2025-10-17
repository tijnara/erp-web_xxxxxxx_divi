"use client";
import { useEffect, useState } from "react";

// Minimal session data we need in the app
export type Session = {
    user: {
        id: string;
        email: string;
        name: string;
        first_name?: string;
        last_name?: string;
    };
    accessToken: string;
};

export function useSession() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        fetch("/api/auth/session")
            .then((res) => res.json())
            .then((data) => {
                if (alive) {
                    if (data.user) {
                        setSession(data);
                    } else {
                        setSession(null);
                    }
                    setLoading(false);
                }
            })
            .catch(() => {
                if (alive) {
                    setSession(null);
                    setLoading(false);
                }
            });
        return () => {
            alive = false;
        };
    }, []);

    const user = session?.user || null; // Extract user for convenience

    return { session, user, loading }; // Include user in the returned object
}
