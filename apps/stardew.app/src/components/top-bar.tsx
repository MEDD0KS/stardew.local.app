import Image from "next/image";
import Link from "next/link";

import packageJson from "../../package.json";
const { version } = packageJson;

import { useContext, useState } from "react";

import { PlayersContext } from "@/contexts/players-context";

import { CreditsDialog } from "@/components/dialogs/credits-dialog";
import { PresetSelector } from "@/components/preset-selector";
import { MobileNav } from "@/components/sheets/mobile-nav";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { IconRefresh, IconSettings } from "@tabler/icons-react";

export function Topbar() {
	const [mobileOpen, setMobileOpen] = useState(false);
	const [creditsOpen, setCreditsOpen] = useState(false);

	const { activePlayer, players, refreshSave, isLoading, lastUpdated, savePath } =
		useContext(PlayersContext);

	const gameDate = (() => {
		const daysPlayed = players?.[0]?.general?.daysPlayed;
		if (!daysPlayed) return null;
		const seasons = ["Spring", "Summer", "Fall", "Winter"] as const;
		const dayInYear = ((daysPlayed - 1) % 112) + 1;
		const seasonIndex = Math.floor((dayInYear - 1) / 28);
		const dayOfMonth = ((dayInYear - 1) % 28) + 1;
		const year = Math.floor((daysPlayed - 1) / 112) + 1;
		return `${seasons[seasonIndex]} ${dayOfMonth}, Year ${year}`;
	})();

	return (
		<>
			<div className="flex items-center justify-between bg-white px-7 py-3.5 dark:bg-neutral-950 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
				<div className="flex flex-shrink-0 items-center">
					<Image
						width={36}
						height={36}
						className="h-9 w-auto"
						src="/favicon.png"
						alt="stardew.app logo"
					/>
					<h1 className="pl-3 font-medium">Stardew Tracker</h1>
				</div>
				{/* Mobile Menu */}
				<div className="flex justify-end md:hidden">
					<Button variant="outline" onClick={() => setMobileOpen(true)}>
						<HamburgerMenuIcon className="h-4 w-4" />
					</Button>
				</div>
				{/* Desktop Version */}
				<div className="ml-auto hidden w-full space-x-2 sm:justify-end md:flex">
					<PresetSelector />
					{savePath && (
						<Button
							variant="secondary"
							onClick={() => refreshSave()}
							disabled={isLoading}
							className="hover:bg-green-500 hover:text-neutral-50 dark:hover:bg-green-500 dark:hover:text-neutral-50"
						>
							<IconRefresh
								className={`mr-1 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
							/>
							{isLoading ? "Loading..." : "Refresh"}
						</Button>
					)}
					{lastUpdated && (
						<span className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
							{lastUpdated.toLocaleTimeString()}
						</span>
					)}
					{gameDate && (
						<span className="flex items-center rounded-md border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
							{gameDate}
						</span>
					)}
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="icon">
								<IconSettings className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="mr-[26px] w-[200px]">
							<DropdownMenuLabel className="text-xs font-normal text-gray-400">
								stardew.app {version}
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => setCreditsOpen(true)}>
								Credits
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<Link href="/account">Settings</Link>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			<Separator />
			<MobileNav open={mobileOpen} setIsOpen={setMobileOpen} />
			<CreditsDialog open={creditsOpen} setOpen={setCreditsOpen} />
		</>
	);
}
