'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton({ className = '' }: { className?: string }) {
    const router = useRouter();
    return (
        <button
            className={className || 'border rounded px-3 py-1'}
            onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.replace('/login');
            }}
        >
            Logout
        </button>
    );
}
