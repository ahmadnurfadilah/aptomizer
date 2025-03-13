"use client";

import { usePathname } from "next/navigation";
import { BotMessageSquare, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import Logo from "./logo";
import { WalletSelector } from "../wallet-selector";
import { ModeToggle } from "../mode-toggle";

export const Navbar = () => {
	const pathname = usePathname();

	return (
		<nav className="w-full h-16 grid grid-cols-3 items-center fixed top-0 inset-x-0 z-50 bg-white/5 backdrop-blur-xl border-b border-gray-800 px-4">
			<div>
				<Logo className="h-5" />
			</div>
			<div className="flex items-center justify-center">
				<div className="inline-flex items-center bg-gray-900 border border-gray-800 p-1 rounded-full gap-1">
					<Link href="/" className={`text-sm py-2 px-3 md:px-5 rounded-full flex items-center gap-1.5 bg-gradient-to-tr ${pathname === '/' ? 'from-white/20 to-white/10' : 'hover:bg-white/5'}`}>
						<BotMessageSquare className="size-4" />
						<span className={`hidden md:block ${pathname === '/' ? 'text-white/80' : 'text-white/60'}`}>Agent</span>
					</Link>
					<Link href="/dashboard" className={`text-sm py-2 px-3 md:px-5 rounded-full flex items-center gap-1.5 bg-gradient-to-tr ${pathname === '/dashboard' ? 'from-white/20 to-white/10' : 'hover:bg-white/5'}`}>
						<LayoutDashboard className="size-4" />
						<span className={`hidden md:block ${pathname === '/dashboard' ? 'text-white/80' : 'text-white/60'}`}>Dashboard</span>
					</Link>
				</div>
			</div>
			<div className="flex justify-end gap-2">
				<ModeToggle />
				<WalletSelector />
			</div>
		</nav>
	);
}
