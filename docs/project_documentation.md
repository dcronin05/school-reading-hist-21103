# School Reading - Clean Markdown Reader 📚

A beautiful, distraction-free reading application designed to serve markdown files in a premium reader view with progress tracking, table of contents, and customized themes.

---

## 📂 Project Structure

All files are located in the project folder:
- **Main Shell**: [index.html](../index.html)
- **Styling**: [style.css](../style.css)
- **Frontend Logic**: [app.js](../app.js)
- **Python Backend**: [server.py](../server.py)
- **Library Content**:
  - **1619 Book Readings (Structured)**:
    - [books/1619_book.json](../books/1619_book.json) (Book structure mapping)
    - [books/1619_sec_01.md](../books/1619_sec_01.md) through `1619_sec_20.md` (Extracted chapters/sections)
    - [books/images/](../books/images) (Extracted EPUB images)

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Single-file Python script ([server.py](../server.py)) that:
  - Serves static files from the project directory.
  - Exposes an API endpoint (`/api/books`) that reads all `.json` files in `books/` (representing structured books with chapters) and loose `.md` files.
  - Automatically excludes any `.md` file that belongs to a book outline from the top-level list, serving a nested layout.
  - Zero third-party dependencies required.
- **Frontend Layout**: Semantic HTML5 ([index.html](../index.html)) styled with a custom CSS design system ([style.css](../style.css)).
- **Frontend Core**: JavaScript module ([app.js](../app.js)) that handles:
  - Markdown-to-HTML conversion via [Marked.js](https://cdn.jsdelivr.net/npm/marked/marked.min.js) loaded via CDN.
  - HTML sanitization via [DOMPurify](https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js) to keep custom/local uploads safe.
  - Interface iconography using [Lucide Icons](https://unpkg.com/lucide@latest).

---

## ✨ Features Built

### 1. Reading Progress Tracker
- A sleek, sticky, dynamic **progress bar** at the top of the viewport.
- Auto-calculates reading progress as the user scrolls.
- Caches and restores the exact reading scroll position/percentage for each book using `localStorage`.
- Displays progress badges in the sidebar.

### 2. Reading Customization Panel
- **Themes**: Switch between Light, Sepia (warm, paper-like), and Dark themes.
- **Typography**: Switch between Serif (e.g., Georgia / Playfair Display for narratives) and Sans-serif (for docs).
- **Text Size**: Increase or decrease size from 60% to 180%.

### 3. Dynamic Table of Contents (TOC)
- Scans headings (`h1`, `h2`, `h3`) in the active book and generates an outline list in a collapsible right drawer.
- Smooth scrolls to the target section when clicked.
- Active TOC item highlights dynamically as the user scrolls through the document.

### 4. Drag & Drop Uploads
- A dashed upload box in the sidebar footer.
- Allows dragging any `.md` file from the computer directly into the app.
- Reads files locally using browser `FileReader`, saves them in `localStorage`, and instantly renders them.

### 5. Floating Progress Indicator
- A beautiful, glassmorphic capsule badge showing the current scroll percentage in the bottom right corner of the reader.
- Helps keep track of reading progress on mobile viewports (where the header stats are collapsed/hidden).
- Adapts dynamically to sepia, light, and dark themes.
- Disappears gracefully in the empty/loading state and transitions smoothly on scroll.

### 6. Bidirectional Footnote / Citation Navigation
- Automatically intercepts superscript citation clicks (e.g., `[1]`) and footnote back-links.
- Implements smooth single-page application (SPA) transitions to load target chapters dynamically without page reload.
- Resolves missing anchor IDs using context-aware back-link matching, enabling self-healing bidirectional navigation.
- Smoothly scrolls to target elements with sticky header height offsets to prevent content overlap.
- Flash-highlights the target citation or note with a visual glow animation so the reader's eye can immediately focus on the reference.
- Built-in preprocessing support for standard Markdown footnote syntax `[^1]` and definitions.

---

## 🚀 How to Run the App

1. **Start the server**:
   The Python web server has been started in the background on your machine.
   To run it manually in the future, navigate to the folder in PowerShell and run:
   ```powershell
   python server.py
   ```
2. **Access the App**:
   - Locally: [http://localhost:8383](http://localhost:8383)
   - Network-wide: `http://<server-ip>:8383` (e.g., `http://172.31.129.106:8383` or `http://100.114.165.13:8383` via Tailscale).

3. **Firewall Setup (for Remote Clients)**:
   If remote devices cannot load the page, open PowerShell as Administrator and run the following command to allow port 8383 inbound:
   ```powershell
   New-NetFirewallRule -DisplayName "School Reading Webserver" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8383
   ```

4. **Add custom files**:
   You can copy any new `.md` files directly into `books/` on the server, or drag-and-drop them directly onto the web interface.
