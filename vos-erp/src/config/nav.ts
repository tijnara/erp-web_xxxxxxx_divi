// src/config/nav.ts
import {
    LayoutDashboard,
    Shield,
    Box,
    Users,
    Truck,
    Percent,
    Cog,
    ShoppingCart,
    Clipboard,
    Barcode,
    Archive,
    File,
    FileText,
    Boxes,
    DollarSign,
    ArrowRightLeft,
    User,
    Megaphone,
    BarChart,
    Book,
    ArrowDown,
    ArrowUp,
    Landmark,
    BarChart2,
    type LucideIcon,
} from "lucide-react";

export type NavLeaf = { label: string; href: string; icon?: LucideIcon };
export type NavNode = { label: string; children: NavItem[]; icon?: LucideIcon };
export type NavItem = NavLeaf | NavNode;

export const nav: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
        label: "Admin",
        icon: Shield,
        children: [
            { label: "Product", href: "/admin/product", icon: Box },
            { label: "Salesman", href: "/admin/salesman", icon: Users },
            { label: "Supplier", href: "/admin/supplier", icon: Truck },
            { label: "Consumables", href: "/admin/consumables", icon: Box },
            { label: "Customer", href: "/admin/customer", icon: Users },
            {
                label: "Discount Setup",
                icon: Percent,
                children: [
                    {
                        label: "Discount Type",
                        href: "/admin/discount-setup/discount-type",
                        icon: Percent,
                    },
                    {
                        label: "Line Discount",
                        href: "/admin/discount-setup/line-discount",
                        icon: Percent,
                    },
                ],
            },
            { label: "Branch", href: "/admin/branch", icon: Landmark },
        ],
    },
    {
        label: "Operation",
        icon: Cog,
        children: [
            { label: "Sales Order", href: "/operation/sales-order", icon: ShoppingCart },
            {
                label: "Job Order",
                href: "/operation/job-order",
                icon: Clipboard,
            },
            { label: "Serializing", href: "/operation/serializing", icon: Barcode },
            { label: "Purchase Order", href: "/operation/purchase-order", icon: Clipboard },
            { label: "Receiving", href: "/operation/receiving", icon: Archive },
            {
                label: "Document Transmittal",
                href: "/operation/document-transmittal",
                icon: File,
            },
            { label: "Invoicing", href: "/operation/invoicing", icon: FileText },
            {
                label: "Physical Inventory",
                href: "/operation/inventory",
                icon: Boxes,
            },
            {
                label: "Collection Posting Balancing",
                href: "/operation/collection-posting-balancing",
                icon: DollarSign,
            },
            { label: "Stock Transfer", href: "/operation/stock-transfer", icon: ArrowRightLeft },
        ],
    },
    {
        label: "Human Resources",
        icon: Users,
        children: [
            { label: "User", href: "/hr/user", icon: User },
            { label: "Announcements", href: "/hr/announcements", icon: Megaphone },
        ],
    },
    {
        label: "Reports",
        icon: BarChart,
        children: [
            { label: "Chart of Account", href: "/reports/chart-of-account", icon: Book },
            { label: "Assets & Equipments", href: "/reports/assets-equipments", icon: Truck },
            { label: "Accounts Payable", href: "/reports/accounts-payable", icon: ArrowDown },
            {
                label: "Accounts Receivable",
                href: "/reports/accounts-receivable",
                icon: ArrowUp,
            },
            { label: "Loans", href: "/reports/loans", icon: Landmark },
            { label: "Sales Report", href: "/reports/sales-report", icon: BarChart2 },
            {
                label: "Financial Statement",
                icon: Book,
                children: [
                    {
                        label: "Balance Sheet",
                        href: "/reports/financial-statement/balance-sheet",
                        icon: Book,
                    },
                    {
                        label: "Income Statement",
                        href: "/reports/financial-statement/income-statement",
                        icon: Book,
                    },
                ],
            },
            {
                label: "Tax Compliance Report",
                icon: Book,
                children: [
                    {
                        label: "EWT Report",
                        href: "/reports/tax-compliance/ewt-report",
                        icon: Book,
                    },
                    {
                        label: "VAT Payable",
                        href: "/reports/tax-compliance/vat-payable",
                        icon: Book,
                    },
                    {
                        label: "Creditable Withholding Tax",
                        href: "/reports/tax-compliance/creditable-withholding-tax",
                        icon: Book,
                    },
                ],
            },
        ],
    },
];
