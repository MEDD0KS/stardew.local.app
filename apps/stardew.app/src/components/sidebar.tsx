import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
	IconAward,
	IconBook,
	IconBox,
	IconBuildingWarehouse,
	IconCarrot,
	IconEgg,
	IconFishHook,
	IconGardenCart,
	IconHammer,
	IconHeart,
	IconHome2,
	IconId,
	IconNote,
	IconPaw,
	IconPencilUp,
	IconProgress,
	IconSettings,
	IconStars,
} from "@tabler/icons-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export const miscNavigation = [
	{ name: "Bundles", href: "/bundles", icon: IconBox },
	{ name: "Secret Notes", href: "/notes", icon: IconNote },
	{ name: "Rarecrows", href: "/rarecrows", icon: IconCarrot },
	{ name: "Settings", href: "/account", icon: IconSettings },
];

export const playerNavigation = [
	{ name: "Home", href: "/", icon: IconHome2 },
	{ name: "Farmer", href: "/farmer", icon: IconId },
	{ name: "Skills & Mastery", href: "/skills", icon: IconStars },
	{ name: "Perfection", href: "/perfection", icon: IconAward },
	{ name: "Relationships", href: "/relationships", icon: IconHeart },
	{ name: "Animals", href: "/animals", icon: IconPaw },
];

export const collectionsNavigation = [
	{ name: "Cooking", href: "/cooking", icon: IconEgg },
	{ name: "Crafting", href: "/crafting", icon: IconHammer },
	{ name: "Fishing", href: "/fishing", icon: IconFishHook },
	{ name: "Shipping", href: "/shipping", icon: IconGardenCart },
	{ name: "Museum", href: "/museum", icon: IconBuildingWarehouse },
];

export const islandNavigation = [
	{ name: "Golden Walnuts", href: "/island/walnuts", icon: IconProgress },
	{ name: "Journal Scraps", href: "/island/scraps", icon: IconBook },
	{ name: "Island Upgrades", href: "/island/upgrades", icon: IconPencilUp },
];



export const SidebarCategory = ({ children }: { children: string }) => (
	<h2 className="mb-2 mt-4 px-4 font-semibold tracking-tight text-neutral-700 dark:text-neutral-300">
		{children}
	</h2>
);

export function Sidebar({ className }: SidebarProps) {
	const pathname = usePathname();

	return (
		<div className={className}>
			<nav className="px-3 pb-2">
				<SidebarCategory>Player</SidebarCategory>
				<div className="space-y-1">
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
						>
							<Link href={item.href}>
								<item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
								{item.name}
							</Link>
						</Button>
					))}
				</div>
				<SidebarCategory>Collections</SidebarCategory>
				<div className="space-y-1">
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
						>
							<Link href={item.href}>
								<item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
								{item.name}
							</Link>
						</Button>
					))}
				</div>

				<SidebarCategory>Ginger Island</SidebarCategory>
				<div className="space-y-1">
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
						>
							<Link href={item.href}>
								<item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
								{item.name}
							</Link>
						</Button>
					))}
				</div>

				<SidebarCategory>Misc</SidebarCategory>
				<div className="space-y-1">
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
						>
							<Link href={item.href}>
								<item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
								{item.name}
							</Link>
						</Button>
					))}
				</div>
			</nav>
		</div>
	);
}
