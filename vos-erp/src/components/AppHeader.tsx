'use client';

import Link from 'next/link';
import LogoutButton from './LogoutButton';

export default function AppHeader() {
    return (
        <header className="h-14 flex items-center justify-between px-4 border-b">
            <div className="font-semibold">Vertex Admin</div>

            <div className="relative group">
                <button className="rounded-full border px-3 py-1">ajsiapno60@men2corp.com</button>
                <div className="absolute right-0 mt-2 hidden group-hover:block bg-white border rounded-lg shadow-md w-56">
                    <Link href="/account/profile" className="block px-3 py-2 hover:bg-gray-50">Profile</Link>
                    <Link href="/settings" className="block px-3 py-2 hover:bg-gray-50">Settings</Link>
                    <div className="border-t my-1" />
                    <LogoutButton className="w-full text-left px-3 py-2 hover:bg-gray-50" />
                </div>
            </div>
        </header>
    );
}
