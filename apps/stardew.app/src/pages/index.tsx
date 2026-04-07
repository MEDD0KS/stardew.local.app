import Head from "next/head";
import Image from "next/image";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { usePlayers } from "@/contexts/players-context";

export default function Home() {
	const {
		savePath,
		setSavePath,
		refreshSave,
		lastUpdated,
		isLoading,
		players,
		uploadMode,
	} = usePlayers();
	const [pathInput, setPathInput] = useState("");
	const [defaultSavesDir, setDefaultSavesDir] = useState("");
	const [saveEntries, setSaveEntries] = useState<
		{ name: string; path: string; isDirectory: boolean }[]
	>([]);
	const [browsing, setBrowsing] = useState(false);
	const [changingSave, setChangingSave] = useState(false);
	const [pickingFolder, setPickingFolder] = useState(false);

	// Detect default save directory
	useEffect(() => {
		const defaultPath = `${process.env.APPDATA || ""}\\StardewValley\\Saves`;
		setDefaultSavesDir(defaultPath);
	}, []);

	// Load save entries from default directory
	useEffect(() => {
		if (savePath && !changingSave) return;
		if (!defaultSavesDir) return;
		fetch(`/api/browse?path=${encodeURIComponent(defaultSavesDir)}`)
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data?.items) {
					setSaveEntries(data.items.filter((e: any) => e.isDirectory));
					setBrowsing(true);
				}
			})
			.catch(() => {});
	}, [defaultSavesDir, savePath, changingSave]);

	const handleSetPath = async (folderPath: string) => {
		try {
			await setSavePath(folderPath);
			setChangingSave(false);
			toast.success("Save folder configured", {
				description: "Auto-refresh enabled (every 60 seconds).",
			});
		} catch (err) {
			toast.error("Error", {
				description: err instanceof Error ? err.message : "Unknown error",
			});
		}
	};

	const handlePickFolder = async () => {
		setPickingFolder(true);
		try {
			const res = await fetch("/api/pick-folder");
			const data = await res.json();
			if (data.cancelled || !data.path) return;
			await handleSetPath(data.path);
		} catch {
			toast.error("Failed to open folder dialog");
		} finally {
			setPickingFolder(false);
		}
	};

	// Setup / change-save UI (never shown in upload mode)
	const showSetup = !uploadMode && (!savePath || changingSave);

	if (!showSetup && players && players.length > 0) {
		return (
			<>
				<Head>
					<title>Stardew Valley Tracker</title>
				</Head>
				<main className="flex min-h-[calc(100vh-65px)] flex-col items-center border-neutral-200 px-5 pb-8 pt-2 dark:border-neutral-800 md:border-l md:px-8">
					<div className="flex max-w-2xl flex-grow flex-col items-center justify-center">
						<div className="mb-4 flex items-center gap-2">
							<Image
								src="/favicon.png"
								alt="stardew.app logo"
								className="rounded-sm"
								width={64}
								height={64}
							/>
							<h2 className="text-center text-3xl font-semibold">
								Stardew Tracker
							</h2>
						</div>
						<div className="space-y-4 text-center">
							{uploadMode ? (
								<p className="text-sm text-neutral-500 dark:text-neutral-400">
									Upload mode — save file is pushed by the Go watcher
								</p>
							) : (
								<p className="text-sm text-neutral-500 dark:text-neutral-400">
									Monitoring:{" "}
									<code className="rounded bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-800">
										{savePath}
									</code>
								</p>
							)}
							{lastUpdated && (
								<p className="text-sm text-neutral-500 dark:text-neutral-400">
									Last updated: {lastUpdated.toLocaleTimeString()}
								</p>
							)}
							<p className="text-sm text-neutral-500 dark:text-neutral-400">
								Auto-refresh every 60 seconds. Use the sidebar to navigate.
							</p>
							{!uploadMode && (
								<button
									onClick={() => setChangingSave(true)}
									className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
								>
									Change save
								</button>
							)}
							<button
								onClick={refreshSave}
								disabled={isLoading}
								className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
							>
								{isLoading ? "Refreshing..." : "Refresh now"}
							</button>
						</div>
					</div>
				</main>
			</>
		);
	}

	// Upload mode but no data yet — waiting for first push from watcher
	if (uploadMode && (!players || players.length === 0)) {
		return (
			<>
				<Head>
					<title>Stardew Valley Tracker — Upload Mode</title>
				</Head>
				<main className="flex min-h-[calc(100vh-65px)] flex-col items-center border-neutral-200 px-5 pb-8 pt-2 dark:border-neutral-800 md:border-l md:px-8">
					<div className="flex max-w-2xl flex-grow flex-col items-center justify-center gap-6">
						<div className="flex items-center gap-2">
							<Image
								src="/favicon.png"
								alt="stardew.app logo"
								className="rounded-sm"
								width={64}
								height={64}
							/>
							<h2 className="text-center text-3xl font-semibold">
								Stardew Tracker
							</h2>
						</div>
						<div className="w-full rounded-lg border border-blue-300 bg-blue-50 p-6 text-center dark:border-blue-700 dark:bg-blue-950">
							<p className="mb-2 text-lg font-semibold text-blue-800 dark:text-blue-200">
								Upload mode active
							</p>
							<p className="mb-4 text-sm text-blue-700 dark:text-blue-300">
								Waiting for the first save file from the Go watcher...
							</p>
							<code className="block rounded bg-blue-100 px-4 py-2 text-xs text-blue-900 dark:bg-blue-900 dark:text-blue-100">
								./stardew-watcher --save /path/to/SaveFolder --host http://localhost:3000
							</code>
						</div>
					</div>
				</main>
			</>
		);
	}

	return (
		<>
			<Head>
				<title>Stardew Valley Tracker — Setup</title>
			</Head>
			<main className="flex min-h-[calc(100vh-65px)] flex-col items-center border-neutral-200 px-5 pb-8 pt-2 dark:border-neutral-800 md:border-l md:px-8">
				<div className="flex max-w-2xl flex-grow flex-col items-center justify-center">
					<div className="mb-4 flex items-center gap-2">
						<Image
							src="/favicon.png"
							alt="stardew.app logo"
							className="rounded-sm"
							width={64}
							height={64}
						/>
						<h2 className="text-center text-3xl font-semibold">
							Stardew Tracker
						</h2>
					</div>
					<h3 className="mb-8 text-center text-lg font-normal">
						Select your Stardew Valley save folder to start tracking your
						progress. The save file inside the folder (matching the folder name)
						will be monitored automatically.
					</h3>

					{changingSave && savePath && (
						<div className="mb-4 w-full rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-200">
							Current save:{" "}
							<code className="rounded bg-amber-100 px-1 text-xs dark:bg-amber-800">
								{savePath}
							</code>
							<button
								onClick={() => setChangingSave(false)}
								className="ml-2 underline hover:no-underline"
							>
								Cancel
							</button>
						</div>
					)}

					{isLoading && (
						<div className="mb-4 rounded-md bg-blue-100 p-3 text-sm text-blue-700 dark:bg-blue-900 dark:text-blue-300">
							Loading save file...
						</div>
					)}

					{/* Folder picker button */}
					<div className="mb-6 w-full">
						<button
							onClick={handlePickFolder}
							disabled={pickingFolder}
							className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 px-4 py-4 text-sm font-medium text-blue-700 transition-colors hover:border-blue-500 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-600 dark:bg-blue-950 dark:text-blue-300 dark:hover:border-blue-400 dark:hover:bg-blue-900"
						>
							<span className="text-lg">📁</span>
							{pickingFolder
								? "Waiting for folder selection..."
								: "Choose folder..."}
						</button>
					</div>

					{/* Browse saves from default directory */}
					{browsing && saveEntries.length > 0 && (
						<div className="mb-6 w-full space-y-2">
							<h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
								Detected save folders:
							</h4>
							<div className="space-y-2">
								{saveEntries.map((entry) => (
									<button
										key={entry.path}
										onClick={() => handleSetPath(entry.path)}
										className="flex w-full items-center rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition-colors hover:border-blue-500 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-blue-500"
									>
										<span className="mr-3 text-lg">🌾</span>
										<span className="font-medium">{entry.name}</span>
									</button>
								))}
							</div>
						</div>
					)}

					{/* Manual path input */}
					<div className="w-full space-y-3">
						<h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
							Or enter the save folder path manually:
						</h4>
						<div className="flex space-x-2">
							<input
								type="text"
								value={pathInput}
								onChange={(e) => setPathInput(e.target.value)}
								placeholder="C:\Users\...\AppData\Roaming\StardewValley\Saves\FarmerName"
								className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
								onKeyDown={(e) => {
									if (e.key === "Enter" && pathInput) {
										handleSetPath(pathInput);
									}
								}}
							/>
							<button
								onClick={() => pathInput && handleSetPath(pathInput)}
								disabled={!pathInput}
								className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
							>
								Load
							</button>
						</div>
						<p className="text-xs text-neutral-400">
							Typically located at:{" "}
							<code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">
								%appdata%\StardewValley\Saves\YourFarm
							</code>
						</p>
					</div>
				</div>
			</main>
		</>
	);
}
