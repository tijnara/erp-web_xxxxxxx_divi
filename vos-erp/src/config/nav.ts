// src/config/nav.ts
export type NavLeaf = { label: string; href: string };
export type NavNode = { label: string; children: NavItem[] };
export type NavItem = NavLeaf | NavNode;

export const nav: NavItem[] = [
    { label: "Dashboard", href: "/dashboard" },
    {
        label: "Admin",
        children: [
            { label: "Product", href: "/admin/product" },
            { label: "Salesman", href: "/admin/salesman" },
            { label: "Supplier", href: "/admin/supplier" },
            { label: "Customer", href: "/admin/customer" },
            {
                label: "Discount Setup",
                children: [
                    { label: "Discount Type", href: "/admin/discount-setup/discount-type" },
                    { label: "Line Discount", href: "/admin/discount-setup/line-discount" },
                ],
            },
        ],
    },
    {
        label: "Operation",
        children: [
            { label: "Sales Order", href: "/operation/sales-order" },
            { label: "Job Order", href: "/operation/job-order" },
            { label: "Serializing", href: "/operation/serializing" },
            { label: "Purchase Order", href: "/operation/purchase-order" },
            { label: "Receiving", href: "/operation/receiving" },
            { label: "Document Transmittal", href: "/operation/document-transmittal" },
            { label: "Invoicing", href: "/operation/invoicing" },
            { label: "Physical Inventory", href: "/operation/physical-inventory" },
            { label: "Collection Posting Balancing", href: "/operation/collection-posting-balancing" },
            { label: "Stock Transfer", href: "/operation/stock-transfer" },
        ],
    },
    {
        label: "Human Resources",
        children: [
            { label: "User", href: "/hr/user" },
            { label: "Memo", href: "/hr/memo" },
            { label: "Announcements", href: "/hr/announcements" },
        ],
    },
    {
        label: "Reports",
        children: [
            { label: "Chart of Account", href: "/reports/chart-of-account" },
            { label: "Asset & Equipment", href: "/reports/asset-equipment" },
            { label: "Accounts Payable", href: "/reports/accounts-payable" },
            { label: "Accounts Receivable", href: "/reports/accounts-receivable" },
            { label: "Loans", href: "/reports/loans" },
            { label: "Sales Report", href: "/reports/sales-report" },
            {
                label: "Financial Statement",
                children: [
                    { label: "Balance Sheet", href: "/reports/financial-statement/balance-sheet" },
                    { label: "Income Statement", href: "/reports/financial-statement/income-statement" },
                ],
            },
            {
                label: "Tax Compliance Report",
                children: [
                    { label: "EWT Report", href: "/reports/tax-compliance/ewt-report" },
                    { label: "VAT Payable", href: "/reports/tax-compliance/vat-payable" },
                    { label: "Creditable Withholding Tax", href: "/reports/tax-compliance/creditable-withholding-tax" },
                ],
            },
        ],
    },
    {
        label: "Account",
        children: [
            { label: "Profile", href: "/account/profile" },
            { label: "Logout", href: "/logout" },
        ],
    }
];
