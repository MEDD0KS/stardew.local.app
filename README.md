# stardew.app (fork)

A fork of [stardew.app](https://github.com/communitycenter/stardew.app) adapted for real-time progress tracking during gameplay based on Stardew Valley save files.

The **watcher** component monitors changes to the save file and pushes updated data to the web interface, so you can see your current progress without manually uploading anything.

### Deployment modes

- **Local (PC)** — run both the watcher and the web app on the same machine where the game is running.
- **Remote server** — host the web app on a remote server and run only the watcher locally. The watcher sends save data to the server over HTTP, letting you (or others) view progress from any device.

---

## Acknowledgements

The original project was created by the [communitycenter](https://github.com/communitycenter) team:  
**https://github.com/communitycenter/stardew.app**

Thanks to all the original developers and contributors for building an excellent perfection tracker for Stardew Valley.

---

## Local Setup

1. Run `bun install` to install project dependencies.
2. Run `bun run dev` to start the development server.

The app will be available at `http://localhost:3000`. Upload your save file manually via the UI.

---

## Watcher Mode (real-time tracking)

The watcher is a small Go binary that monitors your Stardew Valley save file for changes and automatically pushes it to the web app. No manual uploads needed.

### Web app environment variables

Set these in `apps/stardew.app/.env.local`:

| Variable | Required | Description |
|---|---|---|
| `UPLOAD_MODE=1` | **Yes** | Enables the `/api/upload-save` endpoint. Without this the endpoint returns 404. |
| `UPLOAD_USER` | No | HTTP Basic Auth username the watcher must send. If omitted, the endpoint is unauthenticated. |
| `UPLOAD_PASS` | No | HTTP Basic Auth password (used together with `UPLOAD_USER`). |

### Build and run the watcher

```sh
cd watcher
go build -o stardew-watcher .
```

**Option A — local (watcher and app on the same PC):**

```sh
./stardew-watcher --save "C:/Users/You/AppData/Roaming/StardewValley/Saves/MyFarmer_123456789"
```

The watcher defaults to `http://localhost:3000`.

**Option B — remote server (app hosted elsewhere, watcher on your PC):**

```sh
./stardew-watcher \
  --save "C:/Users/You/AppData/Roaming/StardewValley/Saves/MyFarmer_123456789" \
  --host https://your-server.example.com \
  --user admin \
  --password secret
```

### Watcher flags and env variables

All flags can alternatively be set via a `.env` file placed next to the binary, or via environment variables:

| Flag | Env variable | Default | Description |
|---|---|---|---|
| `--save` | `SAVE` | *(required)* | Path to save folder or save file |
| `--host` | `HOST` | `http://localhost:3000` | Web app base URL |
| `--user` | `USER` | *(none)* | HTTP Basic Auth username |
| `--password` | `PASSWORD` | *(none)* | HTTP Basic Auth password |
| `--interval` | — | `5` | Poll interval in seconds |

> **Save file location (Windows):** `%APPDATA%\StardewValley\Saves\<FarmerName_ID>\`
> You can pass either the save folder or the save file directly — both work.
