import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "VOS ERP",
    description: "Internal ops platform",
    icons: {
        icon: "/vos.ico",
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        {children}
        </body>
        </html>
    );
}
