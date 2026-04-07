import Head from "next/head";

import { usePlayers } from "@/contexts/players-context";
import { usePreferences } from "@/contexts/preferences-context";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import { toast } from "sonner";

export default function Account() {
	const { savePath, setSavePath, refreshSave, lastUpdated, isLoading } =
		usePlayers();
	const { show, toggleShow } = usePreferences();

	const handleChangePath = async () => {
		const newPath = prompt(
			"Enter the path to your Stardew Valley save file:",
			savePath || "",
		);
		if (newPath) {
			try {
				await setSavePath(newPath);
				toast.success("Save path updated!");
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Failed to set save path",
				);
			}
		}
	};

	return (
		<>
			<Head>
				<title>Settings | Stardew Tracker</title>
				<meta name="robots" content="noindex,nofollow" />
			</Head>
			<main className="flex min-h-[calc(100vh-65px)] border-neutral-200 px-5 pb-8 pt-2 dark:border-neutral-800 md:border-l md:px-8">
				<div className="mx-auto mt-4 w-full max-w-5xl space-y-8">
					<section className="flex flex-col space-y-3">
						<div>
							<h1 className="text-xl font-semibold text-gray-900 dark:text-white">
								Settings
							</h1>
							<p className="text-sm text-neutral-500 dark:text-neutral-400 md:text-base">
								Manage your tracker settings.
							</p>
						</div>

						<Card>
							<CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
								<span className="flex flex-row items-center justify-between">
									<div className="space-y-1">
										<CardTitle>Show New Content</CardTitle>
										<CardDescription>
											This will enable 1.6 content on the site — don&apos;t use
											if you don&apos;t want to see 1.6 spoilers!
										</CardDescription>
									</div>
									<div>
										<Switch
											id="new-content-switch"
											defaultChecked={show}
											onCheckedChange={() => {
												const res = toggleShow();
												toast.success(
													`1.6 content has been ${res ? "enabled" : "disabled"}.`,
												);
											}}
										/>
									</div>
								</span>
							</CardHeader>
						</Card>

						<Card>
							<CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
								<CardTitle>Save File</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 p-5">
								{savePath ? (
									<>
										<p className="text-sm">
											Current path:{" "}
											<code className="rounded bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-800">
												{savePath}
											</code>
										</p>
										{lastUpdated && (
											<p className="text-sm text-neutral-500">
												Last updated: {lastUpdated.toLocaleString()}
											</p>
										)}
									</>
								) : (
									<p className="text-sm text-neutral-500">
										No save file configured.
									</p>
								)}
								<div className="flex gap-2">
									<Button variant="outline" onClick={handleChangePath}>
										{savePath ? "Change Path" : "Set Path"}
									</Button>
									{savePath && (
										<Button
											variant="secondary"
											onClick={() => refreshSave()}
											disabled={isLoading}
										>
											{isLoading ? "Loading..." : "Refresh Now"}
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					</section>
				</div>
			</main>
		</>
	);
}