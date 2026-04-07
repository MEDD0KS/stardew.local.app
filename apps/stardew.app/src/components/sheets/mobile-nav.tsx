import Link from "next/link";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Dispatch, SetStateAction, useContext } from "react";

import packageJson from "../../../package.json";
const { version } = packageJson;

import { PlayersContext } from "@/contexts/players-context";

import {
	collectionsNavigation,
	islandNavigation,
	miscNavigation,
	playerNavigation,
	SidebarCategory,
} from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ScrollArea } from "../ui/scroll-area";

import { IconRefresh } from "@tabler/icons-react";

interface Props {
	open: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export const MobileNav = ({ open, setIsOpen }: Props) => {
	const pathname = usePathname();
	const { refreshSave, isLoading, savePath } = useContext(PlayersContext);

	return (
		<Drawer open={open} onOpenChange={setIsOpen}>
			<DrawerContent className="fixed bottom-0 left-0 right-0 max-h-[90dvh]">
				<ScrollArea className="overflow-auto">
					<div className="space-y-6 p-6">
						{/* Actions */}
						<section className="space-y-2">
							<h3 className="font-semibold">Stardew Tracker {version}</h3>
							{savePath && (
								<Button
									variant="secondary"
									className="w-full"
									onClick={() => {
										refreshSave();
										setIsOpen(false);
									}}
									disabled={isLoading}
								>
									<IconRefresh
										className={`mr-1 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
									/>
									{isLoading ? "Loading..." : "Refresh Save"}
								</Button>
							)}
						</section>

						{/* Navigation */}
						<nav className="space-y-1">
							<SidebarCategory>Player</SidebarCategory>
							{playerNavigation.map((item) => (
								<Button
									key={item.href}
									variant={pathname === item.href ? "secondary" : "ghost"}
									className={cn(
										"w-full justify-start",
										item.href === pathname
											? ""
											: "text-neutral-600 dark:text-neutral-400",
									)}
									asChild
									onClick={() => setIsOpen(false)}
								>
									<Link href={item.href}>
										<item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
										{item.name}
									</Link>
								</Button>
							))}

							<SidebarCategory>Collections</SidebarCategory>
							{collectionsNavigation.map((item) => (
								<Button
									key={item.href}
									variant={pathname === item.href ? "secondary" : "ghost"}
									className={cn(
										"w-full justify-start",
										item.href === pathname
											? ""
											: "text-neutral-600 dark:text-neutral-400",
									)}
									asChild
									onClick={() => setIsOpen(false)}
								>
									<Link href={item.href}>
										<item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
										{item.name}
									</Link>
								</Button>
							))}

							<SidebarCategory>Ginger Island</SidebarCategory>
							{islandNavigation.map((item) => (
								<Button
									key={item.href}
									variant={pathname === item.href ? "secondary" : "ghost"}
									className={cn(
										"w-full justify-start",
										item.href === pathname
											? ""
											: "text-neutral-600 dark:text-neutral-400",
									)}
									asChild
									onClick={() => setIsOpen(false)}
								>
									<Link href={item.href}>
										<item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
										{item.name}
									</Link>
								</Button>
							))}

							<SidebarCategory>Misc</SidebarCategory>
							{miscNavigation.map((item) => (
								<Button
									key={item.href}
									variant={pathname === item.href ? "secondary" : "ghost"}
									className={cn(
										"w-full justify-start",
										item.href === pathname
											? ""
											: "text-neutral-600 dark:text-neutral-400",
									)}
									asChild
									onClick={() => setIsOpen(false)}
								>
									<Link href={item.href}>
										<item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
										{item.name}
									</Link>
								</Button>
							))}
						</nav>
					</div>
				</ScrollArea>
			</DrawerContent>
		</Drawer>
	);
};
