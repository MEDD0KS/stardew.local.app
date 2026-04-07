// stardew-watcher — watches a Stardew Valley save file for changes and pushes
// it to a running Stardew Tracker instance started with --upload-mode.
//
// Build:
//   go build -o stardew-watcher .
//
// Usage:
//   ./stardew-watcher --save /path/to/SaveFolder [--host http://localhost:3000] [--interval 5]
//
// Authentication (HTTP Basic Auth):
//   Via flags:   --user admin --password secret
//   Via env:     USER=admin PASSWORD=secret ./stardew-watcher --save ...
//   Via .env:    place a .env file next to the binary with USER=, PASSWORD=, HOST=, SAVE=
//
// The save path may be either the folder (e.g. MyFarmer_123456789) or the
// save file itself (folder/MyFarmer_123456789). Both forms are supported.

package main

import (
	"bytes"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// resolveSaveFile returns the actual save file path.
// If savePath is a directory, it uses the Stardew Valley convention:
// the save file is SaveFolder/basename(SaveFolder).
func resolveSaveFile(savePath string) (string, error) {
	info, err := os.Stat(savePath)
	if err != nil {
		return "", fmt.Errorf("cannot access %q: %w", savePath, err)
	}
	if !info.IsDir() {
		// Already a file
		return savePath, nil
	}
	// It's a folder — save file has the same name as the folder
	base := filepath.Base(savePath)
	file := filepath.Join(savePath, base)
	if _, err := os.Stat(file); err != nil {
		return "", fmt.Errorf("save file not found: expected %q inside %q", base, savePath)
	}
	return file, nil
}

// sendFile posts the contents of filePath to serverURL/api/upload-save.
func sendFile(filePath, serverURL, user, password string) error {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("read: %w", err)
	}

	url := serverURL + "/api/upload-save"
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/xml")
	req.ContentLength = int64(len(data))

	if user != "" {
		req.SetBasicAuth(user, password)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("send: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return fmt.Errorf("server returned HTTP %d: %s", resp.StatusCode, bytes.TrimSpace(body))
	}
	return nil
}

// loadDotEnv reads a .env file (if present) and sets variables into the
// environment. Keys are uppercased. Values wrapped in single or double quotes
// are unquoted. Existing environment variables are never overwritten.
func loadDotEnv(path string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return // .env is optional
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		idx := strings.IndexByte(line, '=')
		if idx < 0 {
			continue
		}
		key := strings.ToUpper(strings.TrimSpace(line[:idx]))
		val := strings.TrimSpace(line[idx+1:])
		if len(val) >= 2 && ((val[0] == '\'' && val[len(val)-1] == '\'') || (val[0] == '"' && val[len(val)-1] == '"')) {
			val = val[1 : len(val)-1]
		}
		if key != "" && os.Getenv(key) == "" {
			os.Setenv(key, val)
		}
	}
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func ts() string {
	return time.Now().Format("15:04:05")
}

func main() {
	loadDotEnv(".env")

	user := flag.String("user", envOrDefault("USER", ""), "HTTP Basic Auth username (or env USER)")
	password := flag.String("password", envOrDefault("PASSWORD", ""), "HTTP Basic Auth password (or env PASSWORD)")

	var defaultURL string
	if h := os.Getenv("HOST"); strings.HasPrefix(h, "http://") || strings.HasPrefix(h, "https://") {
		defaultURL = strings.TrimRight(h, "/")
	} else {
		host := envOrDefault("HOST", "localhost")
		port := envOrDefault("PORT", "3000")
		defaultURL = "http://" + host + ":" + port
	}

	savePath := flag.String("save", envOrDefault("SAVE", ""), "Path to Stardew Valley save folder or save file (required or env SAVE)")
	serverURL := flag.String("host", defaultURL, "Stardew Tracker server base URL (or env HOST + PORT)")
	intervalSec := flag.Int("interval", 5, "Poll interval in seconds")
	flag.Parse()

	if *savePath == "" {
		fmt.Fprintln(os.Stderr, "Error: --save is required")
		fmt.Fprintln(os.Stderr, "")
		fmt.Fprintln(os.Stderr, "Usage:")
		fmt.Fprintln(os.Stderr, "  stardew-watcher --save /path/to/SaveFolder")
		fmt.Fprintln(os.Stderr, "  stardew-watcher --save /path/to/SaveFolder --host http://192.168.1.10:3000 --interval 10")
		os.Exit(1)
	}

	filePath, err := resolveSaveFile(*savePath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	interval := time.Duration(*intervalSec) * time.Second

	fmt.Printf("Stardew Watcher started\n")
	fmt.Printf("  File:     %s\n", filePath)
	fmt.Printf("  Server:   %s\n", *serverURL)
	if *user != "" {
		fmt.Printf("  Auth:     %s:***\n", *user)
	}
	fmt.Printf("  Interval: %s\n\n", interval)

	var lastMtime time.Time

	for {
		info, err := os.Stat(filePath)
		if err != nil {
			fmt.Fprintf(os.Stderr, "[%s] Cannot stat file: %v — retrying...\n", ts(), err)
			time.Sleep(interval)
			continue
		}

		mtime := info.ModTime()
		if !mtime.Equal(lastMtime) {
			action := "initial send"
			if !lastMtime.IsZero() {
				action = fmt.Sprintf("changed at %s", mtime.Format("15:04:05"))
			}
			fmt.Printf("[%s] %s — sending %.1f KB...\n", ts(), action, float64(info.Size())/1024)

			if err := sendFile(filePath, *serverURL, *user, *password); err != nil {
				fmt.Fprintf(os.Stderr, "[%s] Send failed: %v\n", ts(), err)
				// Do NOT update lastMtime — will retry on next tick
			} else {
				fmt.Printf("[%s] OK\n", ts())
				lastMtime = mtime
			}
		}

		time.Sleep(interval)
	}
}
