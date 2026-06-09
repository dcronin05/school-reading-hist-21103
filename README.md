# U.S. History to 1877 - Clean Reader 📚

A beautiful, minimalist, and distraction-free markdown reader custom-tailored for reading course materials, book chapters, and study notes. 

---

## 🤖 AI-Developed Software Notice
This application was fully developed by **Antigravity**, an AI software engineering agent designed by **Google DeepMind**, in a pair-programming collaboration with the repository owner. All interface components, styling rules, SPA navigations, and self-healing scripts were generated and polished programmatically.

---

## ⚠️ Content & Copyright Disclaimer
The book chapters, texts, documents, and illustrations served by this application inside the `books/` directory (including the chapters extracted from *1619: Jamestown and the Forging of American Democracy*) are the **exclusive property of their respective authors, publishers, and copyright owners**. 

These files are hosted locally and included here **solely for private academic study, research, and personal educational use**. No copyright infringement is intended.

---

## ✨ Features

### 1. Visual & Reading Comfort
* **Minimalist Aesthetics**: A clean interface with a centered reading column designed for maximum readability and zero distractions.
* **Premium Custom Themes**: Smooth switches between **Light**, **Sepia** (warm paper tone), and **Dark** (Zinc) modes.
* **Typography Options**: Select between elegant Serif (for long narratives) and clean Sans-Serif fonts, with adjustable text scaling from `60%` to `180%`.

### 2. Reading Progress Tracking
* **Progress Bar**: A sticky, color-themed bar at the top of the screen fills up as you read.
* **Percentage Badges**: Progress badges update dynamically in the sidebar.
* **Floating Badge**: A glassmorphic progress capsule in the bottom-right corner keeps track of reading percentage, adapting natively to all themes (highly useful on mobile viewports).
* **Scroll Memory**: Your reading position for every chapter is stored automatically in your browser's local cache and restored instantly when opened.

### 3. Navigation & Outlines
* **Table of Contents (TOC)**: An interactive drawer slides in from the right, scanning headings (`h1`, `h2`, `h3`) in real-time, highlighting your active section as you scroll, and enabling smooth scrolls to target sections.
* **Bidirectional Footnote Navigation**: Intercepts citation clicks in Single-Page Application (SPA) mode. Click a superscript number (e.g. `[1]`) to load the notes chapter and scroll directly to the citation, and click the note number to jump back to your reading spot.
* **Standard Markdown Footnotes**: Automatic parsing and formatting support for standard Markdown footnote syntax `[^1]`.

### 4. Interactive Library & Uploads
* **Collapsible Folders**: Books are served as nested folders showing chapters and sub-items, with dynamic icon states.
* **Drag-and-Drop Uploader**: Drop any local `.md` file onto the sidebar zone to load it locally using the browser's `FileReader` API.

### 5. Resilient Hosting (Self-Healing)
* **Port Conflict Resolution**: Clears port `8383` from stuck background tasks to prevent "Address already in use" errors.
* **Auto-Restart**: Monitors the python server process and automatically restarts it if it crashes.
* **Silent Auto-Start**: Registers as a background service in Windows Task Scheduler to start on boot before user login.

---

## 🚀 Getting Started

### 1. Prerequisites
You need **Python 3** installed on your system.

### 2. Startup (Crash-Resilient)
To start the server with the keep-alive monitor, open PowerShell in the directory and run:
```powershell
PowerShell.exe -ExecutionPolicy Bypass -File .\start_resilient.ps1
```
The server will start listening on [http://localhost:8383](http://localhost:8383).

### 3. Setup Auto-Start on Windows Boot (Background Service)
To configure the server to run silently in the background whenever your computer boots up (without needing command windows open):
1. Search for **PowerShell** in the Start Menu, right-click, and select **Run as Administrator**.
2. Run the setup script:
   ```powershell
   cd \path\to\school-reading
   .\setup_auto_start.ps1
   ```

---

## 📂 Project Structure
* [index.html](./index.html) - Application shell and interface markup.
* [style.css](./style.css) - Custom responsive stylesheet and theme definitions.
* [app.js](./app.js) - Client-side core logic (SPA rendering, progress tracking, and scroll-to-footnotes).
* [server.py](./server.py) - Minimal Python HTTP and API directory server.
* [start_resilient.ps1](./start_resilient.ps1) - Port clearing and server loop daemon.
* [setup_auto_start.ps1](./setup_auto_start.ps1) - Windows task scheduler configuration utility.
* [books/](./books) - Holds JSON book lists, chapter markdown files, and illustration images.

