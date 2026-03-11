"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
    href: string;
    label: string;
};

export default function NavLink({ href, label }: NavItem) {
    const pathname = usePathname();
    // Match exact for /dashboard, prefix for all others
    const isActive = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

    return (
        <Link
            href={href}
            className={`block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
        >
            {label}
        </Link>
    );
}
