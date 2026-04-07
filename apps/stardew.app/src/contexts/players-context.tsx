import {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { parseSaveFile } from "@/lib/file";

import type { CookingRet } from "@/lib/parsers/cooking";
import type { CraftingRet } from "@/lib/parsers/crafting";
import type { FishRet } from "@/lib/parsers/fishing";
import type { GeneralRet } from "@/lib/parsers/general";
import type { MonstersRet } from "@/lib/parsers/monsters";
import type { MuseumRet } from "@/lib/parsers/museum";
import type { NotesRet } from "@/lib/parsers/notes";
import type { PerfectionRet } from "@/lib/parsers/perfection";
import type { PowersRet } from "@/lib/parsers/powers";
import type { RarecrowRet } from "@/lib/parsers/rarecrows";
import type { ScrapsRet } from "@/lib/parsers/scraps";
import type { ShippingRet } from "@/lib/parsers/shipping";
import type { SocialRet } from "@/lib/parsers/social";
import type { WalnutRet } from "@/lib/parsers/walnuts";
import type { BundleWithStatus } from "@/types/bundles";
import type { AnimalsData } from "@/types/data";

export interface PlayerType {
	_id: string;
	general?: GeneralRet;
	bundles?: BundleWithStatus[];
	fishing?: FishRet;
	cooking?: CookingRet;
	crafting?: CraftingRet;
	shipping?: ShippingRet;
	museum?: MuseumRet;
	social?: SocialRet;
	monsters?: MonstersRet;
	walnuts?: WalnutRet;
	notes?: NotesRet;
	scraps?: ScrapsRet;
	perfection?: PerfectionRet;
	powers?: PowersRet;
	rarecrows?: RarecrowRet;
	animals?: AnimalsData;
}

interface PlayersContextProps {
	players?: PlayerType[];
	activePlayer?: PlayerType;
	setActivePlayer: (player?: PlayerType) => void;
	patchPlayer: (patch: any) => Promise<void>;
	uploadPlayers: (players: PlayerType[]) => Promise<{ status: number }>;
	savePath?: string;
	setSavePath: (path: string) => Promise<void>;
	refreshSave: () => Promise<void>;
	lastUpdated?: Date;
	isLoading: boolean;
	uploadMode: boolean;
}

export const PlayersContext = createContext<PlayersContextProps>({
	setActivePlayer: () => {},
	patchPlayer: () => Promise.resolve(),
	uploadPlayers: () => Promise.resolve({ status: 200 }),
	setSavePath: () => Promise.resolve(),
	refreshSave: () => Promise.resolve(),
	isLoading: false,
	uploadMode: false,
});

const REFRESH_INTERVAL = 60_000; // 1 minute

export const PlayersProvider = ({ children }: { children: ReactNode }) => {
	const [players, setPlayers] = useState<PlayerType[]>([]);
	const [activePlayerId, setActivePlayerId] = useState<string>();
	const [savePath, setSavePathState] = useState<string>();
	const [uploadMode, setUploadMode] = useState(false);
	const [lastModified, setLastModified] = useState<number>(0);
	const [lastUpdated, setLastUpdated] = useState<Date>();
	const [isLoading, setIsLoading] = useState(false);
	const timerRef = useRef<ReturnType<typeof setInterval>>();

	const activePlayer = useMemo(
		() => players.find((p) => p._id === activePlayerId),
		[players, activePlayerId],
	);

	// Load config (cached save path) on mount
	useEffect(() => {
		fetch("/api/config")
			.then((res) => res.json())
			.then((config) => {
				if (config.uploadMode) {
					// Upload mode: Go watcher pushes save files; no folder selection needed
					setUploadMode(true);
					setSavePathState("__upload_mode__");
				} else if (config.savePath) {
					setSavePathState(config.savePath);
				}
			})
			.catch(() => {});
	}, []);

	const loadSave = useCallback(
		async (checkOnly = false) => {
			try {
				const headers: Record<string, string> = {};
				if (checkOnly && lastModified > 0) {
					headers["x-last-modified"] = lastModified.toString();
				}

				const res = await fetch("/api/save", { headers });

				if (res.status === 304) {
					// File not changed
					return;
				}

				if (res.status === 404) {
					// No save path configured or file not found
					return;
				}

				if (!res.ok) {
					return;
				}

				const data = await res.json();
				if (!data.xml) return;

				setIsLoading(true);
				try {
					const parsed = parseSaveFile(data.xml);
					setPlayers(parsed);
					setLastModified(data.lastModified);
					setLastUpdated(new Date());

					// Restore active player from localStorage or pick first
					if (typeof window !== "undefined") {
						const stored = window.localStorage.getItem("player_id");
						if (
							stored &&
							parsed.some((player: PlayerType) => player._id === stored)
						) {
							setActivePlayerId(stored);
						} else if (parsed.length > 0) {
							setActivePlayerId(parsed[0]._id);
						}
					}
				} finally {
					setIsLoading(false);
				}
			} catch {
				// silently ignore errors during auto-refresh
			}
		},
		[lastModified],
	);

	// Load save when path is set
	useEffect(() => {
		if (savePath) {
			loadSave(false);
		}
	}, [savePath]);

	// Auto-refresh timer (every 60 seconds)
	useEffect(() => {
		if (savePath) {
			timerRef.current = setInterval(() => {
				loadSave(true);
			}, REFRESH_INTERVAL);
		}

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, [savePath, loadSave]);

	const setSavePath = useCallback(async (path: string) => {
		const res = await fetch("/api/config", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ savePath: path }),
		});
		if (!res.ok) {
			const data = await res.json();
			throw new Error(data.error || "Failed to set save path");
		}
		setSavePathState(path);
	}, []);

	const refreshSave = useCallback(async () => {
		setIsLoading(true);
		// Force full reload (not just check)
		setLastModified(0);
		try {
			const res = await fetch("/api/save");
			if (!res.ok) return;
			const data = await res.json();
			if (!data.xml) return;

			const parsed = parseSaveFile(data.xml);
			setPlayers(parsed);
			setLastModified(data.lastModified);
			setLastUpdated(new Date());

			if (typeof window !== "undefined") {
				const stored = window.localStorage.getItem("player_id");
				if (
					stored &&
					parsed.some((player: PlayerType) => player._id === stored)
				) {
					setActivePlayerId(stored);
				} else if (parsed.length > 0) {
					setActivePlayerId(parsed[0]._id);
				}
			}
		} finally {
			setIsLoading(false);
		}
	}, []);

	// No-op: in selfhosted mode, data comes from save file only
	const patchPlayer = useCallback(async (_patch: any) => {}, []);
	const uploadPlayers = useCallback(
		async (_players: PlayerType[]) => ({ status: 200 }),
		[],
	);

	const setActivePlayer = useCallback((player?: PlayerType) => {
		if (!player) {
			setActivePlayerId(undefined);
			return;
		}

		setActivePlayerId(player._id);

		if (typeof window !== "undefined") {
			window.localStorage.setItem("player_id", player._id);
		}
	}, []);

	return (
		<PlayersContext.Provider
			value={{
				players,
				activePlayer,
				setActivePlayer,
				patchPlayer,
				uploadPlayers,
				savePath,
				setSavePath,
				refreshSave,
				lastUpdated,
				isLoading,
				uploadMode,
			}}
		>
			{children}
		</PlayersContext.Provider>
	);
};

export const usePlayers = () => {
	return useContext(PlayersContext);
};
