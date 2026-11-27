# Asyad TV • أسياد TV

> **Dedicated to Asser & Eyad (آسر وإياد)**  
> A fast, OLED-friendly 10-foot IPTV, Kids Learning & Offline Arabic Azan web app built specifically for **LG OLED E8 65" (2018)** running **webOS 4.0** (Chromium 53 engine).

---

## Features

- **LG webOS 4.0 & OLED Optimized**
  - Vite + React + Vanilla CSS with `base: './'` and `@vitejs/plugin-legacy` targeting `chrome >= 53`.
  - Chromium 53-safe CSS layout (no CSS grid, no flex `gap` dependencies, pure `#050608` OLED black).
  - Full **LG D-pad** spatial navigation (Arrows, OK/Enter, Back `461`, Media keys `415/19/413/412/417`, Channel Up/Down `427/428`) + **Magic Remote** pointer/wheel support.
  - Packaged with `public/appinfo.json` (`com.family.asyadtv`, `1920x1080`, `handlesRelaunch: true`, `disableBackHistoryAPI: true`) and custom gold-on-dark `icon.png` (80×80) & `largeIcon.png` (130×130).

- **IPTV Sources (M3U_Plus + Xtream Codes)**
  - Load **M3U / M3U_Plus URLs**, upload local `.m3u` / `.m3u8` files, or connect **Xtream Codes API** (`Server URL`, `Username`, `Password`).
  - Credentials & playlist settings persist locally in `localStorage` and auto-load on startup (nothing is hardcoded in the repo).
  - Default-ON `output=ts → output=m3u8` rewrite for smoother HLS playback on webOS 4.0, with automatic fallback to native `<video>`.
  - Paginated rendering handles **10,000+ channels, movies, and series** smoothly without slowing down the 2018 TV.

- **Instant Auto-Search (English & Arabic)**
  - ~100ms debounced search across **Live TV**, **Movies**, and **Series** simultaneously.
  - Normalizes Arabic diacritics/tashkeel, `أ/إ/آ → ا`, `ة → ه`, `ى → ي`, and Latin accents.
  - On-screen **TV Keyboard** with **English / العربية** toggle, category filter chips, and `dir="auto"` RTL titles.

- **10-Foot Video Player, Subtitles (CC), Resume & Favorites**
  - Fullscreen HTML5 `<video>` + `hls.js` player with auto-hiding OSD: Play/Pause, `-10s/+10s` seek, Live Channel Zapping (`Up`/`Down` or `CH+`/`CH-`), Aspect Ratio (`Contain`/`Cover`/`Fill`), HLS Quality selector, Audio track switcher, and Favorite toggle (`★`).
  - **Subtitles / Captions (CC)**: Auto-detects HLS subtitle tracks (`hls.subtitleTracks`) and native HTML5 `video.textTracks`, with high-contrast OLED RTL/LTR subtitle rendering.
  - **Continue Watching**: Saves progress for Movies and Series episodes in `localStorage`, shows progress bars, offers **Resume** / **Start Over**, and supports individual **Remove (`✕`)** and **Clear All**.
  - **EPG**: Displays Current & Next program when connected via Xtream Codes.

- **Offline Arabic Azan Player with Auto-Pause**
  - 100% offline prayer time calculations powered by `adhan` (Fajr, Dhuhr, Asr, Maghrib, Isha) with city presets, custom coordinates, calculation methods, Asr Madhab, per-prayer toggles, and minute offsets.
  - Subtle **Next Prayer** Arabic + English countdown pill in the top bar.
  - When prayer time arrives (or when testing): automatically **pauses** active playback, displays the calm OLED fullscreen Arabic Azan overlay (`حان الآن موعد أذان ...`), plays `public/audio/azan.mp3` (or custom URL / built-in Hijaz chime fallback), and **resumes** playback automatically when finished or dismissed.

- **Kids Watch Timer & Ages 3–4 English Learning (Asser & Eyad)**
  - Parent screen-time limits (15 / 30 / 45 / 60 min + 10s test) protected by a 4-digit **Parent PIN** (default `0000`).
  - Live countdown badge in the top bar; pauses playback and locks the screen behind a PIN gate when time expires.
  - Built-in offline **Ages 3–4 English Learning** animated lessons (Numbers 1–10, ABC Alphabet, Colors, Shapes, Animals) plus one-click loaders for `iptv-org` Kids & Education M3U playlists.

---

## Custom Azan Audio (Optional)

Drop your preferred Arabic Azan MP3 into:
```text
public/audio/azan.mp3
```
(or enter a custom MP3 URL inside the **Prayer & Azan** tab). If no MP3 is present, Asyad TV automatically plays its built-in calm Hijaz harmonic chime.

---

## Adding Your IPTV Provider (URL, Username & Password)

Your credentials stay **100% private on your LG TV** (`localStorage`) — never committed to GitHub.

1. Open **Asyad TV** on your TV and go to **⚙ Sources & Setup**.
2. Keep **✓ output=ts → m3u8: ON** (recommended for LG webOS 4.0).
3. Choose either method your provider gave you:
   - **Option A — Xtream Codes API (Recommended if you have Server URL + Username + Password):**
     - **Server URL:** e.g. `http://your-provider-host:8080`
     - **Username:** your username
     - **Password:** your password
     - Click **Connect & Save Xtream Codes** (loads Live TV, Movies, Series, and EPG).
   - **Option B — M3U / M3U_Plus URL:**
     - Paste your full URL, e.g. `http://your-provider-host/get.php?username=YOUR_USER&password=YOUR_PASS&type=m3u_plus&output=ts`
     - Click **Load & Save M3U URL**.
4. Next time you open **Asyad TV**, your channels, movies, and series auto-load on startup.

---

## Development & Testing

```bash
npm install
npm test          # Runs Vitest unit tests (M3U parser, Arabic/English search, Continue Watching, Azan)
npm run build     # Builds production bundle + Chrome 53 legacy chunks into dist/
npm run package:ipk  # Builds dist/ and packages com.family.asyadtv_<version>_all.ipk
npm run dev       # Starts local dev server
```

---

## Releases & Downloading the `.ipk`

- Pre-built `.ipk` packages are published under **GitHub Releases** (`v1.0.0` and newer).
- Pushing a version tag (`git tag v1.0.1 && git push origin v1.0.1`) automatically triggers `.github/workflows/release.yml` to test, build, package the `.ipk`, and attach it to a new GitHub Release.

---

## Deploying to Your LG OLED E8 (webOS 4.0)

### 1. Enable Developer Mode on Your LG TV
1. Open the **LG Content Store** on your TV, search for **Developer Mode**, and install it.
2. Open the **Developer Mode** app and sign in with your LG Developer account.
3. Turn **Dev Mode Status** to **ON** and **Key Server** to **ON**.
4. Note your TV's **IP Address** and the **Passphrase** displayed on screen.

### 2. Install webOS TV CLI (`@webosose/ares-cli`) on Your Computer
```bash
npm install -g @webosose/ares-cli
```

### 3. Register Your LG TV & Fetch the SSH Key
```bash
ares-setup-device
```
Choose `add`, set device name (e.g. `lgtv`), enter your TV's IP address, port `9922`, username `prisoner`, and leave password blank. Then fetch the passphrase key from the TV:
```bash
ares-novacom --device lgtv --getkey
```
Enter the 6-character **Passphrase** shown in the TV's Developer Mode app.

### 4. Install & Launch the `.ipk` (Download from Releases or Build Locally)
If building locally:
```bash
npm run build
ares-package --no-minify dist -o .
```
Then install and launch on your LG TV:
```bash
ares-install --device lgtv com.family.asyadtv_1.0.0_all.ipk
ares-launch --device lgtv com.family.asyadtv
```

> **Tip:** To prevent Developer Mode from expiring after 50 hours, remember to renew the session inside the Developer Mode app on your TV, or launch **Asyad TV** from the LG Home Launcher anytime!

