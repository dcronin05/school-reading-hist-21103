/* --- SCHOOL READING APP LOGIC --- */

document.addEventListener('DOMContentLoaded', () => {
  // --- APP STATE ---
  const state = {
    books: [],
    activeBook: null,
    theme: localStorage.getItem('reader-theme') || 'dark',
    fontFamily: localStorage.getItem('reader-font-family') || 'sans',
    fontSize: parseInt(localStorage.getItem('reader-font-size')) || 100,
    progress: JSON.parse(localStorage.getItem('reader-progress-map')) || {},
    customBooks: JSON.parse(localStorage.getItem('reader-custom-books')) || []
  };

  // --- DOM ELEMENTS ---
  const elements = {
    body: document.body,
    progressBar: document.getElementById('progressBar'),
    bookList: document.getElementById('bookList'),
    searchInput: document.getElementById('searchInput'),
    toggleSidebarBtn: document.getElementById('toggleSidebarBtn'),
    closeSidebarBtn: document.getElementById('closeSidebarBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    tocToggleBtn: document.getElementById('tocToggleBtn'),
    tocPanel: document.getElementById('tocPanel'),
    closeTocBtn: document.getElementById('closeTocBtn'),
    tocList: document.getElementById('tocList'),
    headerBookTitle: document.getElementById('headerBookTitle'),
    readingTime: document.getElementById('readingTime'),
    progressPercentage: document.getElementById('progressPercentage'),
    readingArticle: document.getElementById('readingArticle'),
    readingContainer: document.querySelector('.reading-container'),
    floatingProgress: document.getElementById('floatingProgress'),
    floatingProgressText: document.getElementById('floatingProgressText'),
    
    // Settings Controls
    themeButtons: document.querySelectorAll('.theme-btn'),
    fontSerifBtn: document.getElementById('fontSerifBtn'),
    fontSansBtn: document.getElementById('fontSansBtn'),
    decreaseTextBtn: document.getElementById('decreaseTextBtn'),
    increaseTextBtn: document.getElementById('increaseTextBtn'),
    textSizeDisplay: document.getElementById('textSizeDisplay'),
    
    // Drag & Drop
    dropzone: document.getElementById('dropzone'),
    fileInput: document.getElementById('fileInput')
  };

  // --- INITIALIZE APP ---
  function init() {
    applyTheme(state.theme);
    applyFontFamily(state.fontFamily);
    applyFontSize(state.fontSize);
    
    // Close sidebar by default on mobile screens on initial load
    if (window.innerWidth <= 900) {
      elements.body.classList.remove('sidebar-open');
    }
    
    setupEventListeners();
    fetchLibrary();
    
    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- STATE MUTATIONS & THEMES ---
  function applyTheme(themeName) {
    elements.body.classList.remove('theme-light', 'theme-sepia', 'theme-dark');
    elements.body.classList.add(`theme-${themeName}`);
    state.theme = themeName;
    localStorage.setItem('reader-theme', themeName);
    
    // Update active button state
    elements.themeButtons.forEach(btn => {
      if (btn.dataset.theme === themeName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function applyFontFamily(fontFamily) {
    if (fontFamily === 'serif') {
      elements.body.classList.remove('font-sans');
      elements.body.classList.add('font-serif');
      elements.fontSerifBtn.classList.add('active');
      elements.fontSansBtn.classList.remove('active');
    } else {
      elements.body.classList.remove('font-serif');
      elements.body.classList.add('font-sans');
      elements.fontSerifBtn.classList.remove('active');
      elements.fontSansBtn.classList.add('active');
    }
    state.fontFamily = fontFamily;
    localStorage.setItem('reader-font-family', fontFamily);
  }

  function applyFontSize(size) {
    // Keep between 60% and 180%
    const boundedSize = Math.max(60, Math.min(180, size));
    state.fontSize = boundedSize;
    elements.textSizeDisplay.textContent = `${boundedSize}%`;
    elements.readingArticle.style.fontSize = `${boundedSize / 100}em`;
    localStorage.setItem('reader-font-size', boundedSize);
  }

  // --- EVENT LISTENERS SETUP ---
  function setupEventListeners() {
    // Sidebar toggles
    elements.toggleSidebarBtn.addEventListener('click', () => {
      elements.body.classList.toggle('sidebar-open');
    });
    elements.closeSidebarBtn.addEventListener('click', () => {
      elements.body.classList.remove('sidebar-open');
    });

    // Settings Toggle
    elements.settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.settingsPanel.classList.toggle('hidden');
    });
    elements.settingsPanel.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent closing when clicking inside panel
    });
    document.addEventListener('click', () => {
      elements.settingsPanel.classList.add('hidden');
    });

    // TOC Toggle
    elements.tocToggleBtn.addEventListener('click', () => {
      elements.tocPanel.classList.toggle('open');
    });
    elements.closeTocBtn.addEventListener('click', () => {
      elements.tocPanel.classList.remove('open');
    });

    // Theme Switchers
    elements.themeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        applyTheme(btn.dataset.theme);
      });
    });

    // Font Switchers
    elements.fontSerifBtn.addEventListener('click', () => applyFontFamily('serif'));
    elements.fontSansBtn.addEventListener('click', () => applyFontFamily('sans'));

    // Text Size controls
    elements.decreaseTextBtn.addEventListener('click', () => applyFontSize(state.fontSize - 10));
    elements.increaseTextBtn.addEventListener('click', () => applyFontSize(state.fontSize + 10));

    // Scroll listener for progress tracking
    elements.readingContainer.addEventListener('scroll', updateProgressOnScroll);
    window.addEventListener('scroll', updateProgressOnScroll);

    // Intercept clicks on links inside the reading article for citation navigation
    elements.readingArticle.addEventListener('click', handleArticleLinkClick);

    // Book Search
    elements.searchInput.addEventListener('input', filterBooks);

    // Drag and Drop files
    setupDragAndDrop();
  }

  // --- LIBRARY & API INTEGRATION ---
  async function fetchLibrary() {
    try {
      // Fetch books from server endpoint
      const response = await fetch('/api/books');
      if (!response.ok) throw new Error('Failed to fetch backend library');
      const serverBooks = await response.json();
      
      // Combine server books with custom uploaded books in localStorage
      state.books = [...serverBooks];
      
      // Add custom books to list
      state.customBooks.forEach(customBook => {
        // Ensure no duplicate with server files
        if (!state.books.some(b => b.filename === customBook.filename)) {
          state.books.push(customBook);
        }
      });
      
      renderLibrary();
      
      // Load last read book if exists
      const lastRead = localStorage.getItem('reader-last-active');
      let lastReadFound = false;
      if (lastRead) {
        for (const b of state.books) {
          if (b.isBook) {
            if (b.chapters.some(ch => ch.filename === lastRead)) {
              lastReadFound = true;
              break;
            }
          } else if (b.filename === lastRead) {
            lastReadFound = true;
            break;
          }
        }
      }
      
      if (lastReadFound) {
        loadBook(lastRead);
      } else {
        loadDefaultBook();
      }
    } catch (error) {
      console.warn('Backend server error or not running. Loading offline/custom mode:', error);
      
      // Fallback to local files only
      state.books = [...state.customBooks];
      if (state.books.length === 0) {
        state.books.push({
          filename: 'welcome.md',
          title: 'Welcome to U.S. History to 1877!',
          size: 1000,
          custom: true,
          offlineMock: true
        });
      }
      renderLibrary();
      loadDefaultBook();
    }
  }

  function loadDefaultBook() {
    if (state.books.length > 0) {
      const first = state.books[0];
      if (first.isBook) {
        if (first.chapters && first.chapters.length > 0) {
          loadBook(first.chapters[0].filename);
        }
      } else {
        loadBook(first.filename);
      }
    }
  }

  function renderLibrary() {
    elements.bookList.innerHTML = '';
    
    if (state.books.length === 0) {
      elements.bookList.innerHTML = `<li class="loading-state">No books available. Upload one below!</li>`;
      return;
    }

    state.books.forEach(book => {
      if (book.isBook) {
        // Render a nested book folder
        const folderLi = document.createElement('li');
        folderLi.className = 'book-folder';
        folderLi.dataset.bookId = book.id;
        
        const hasActiveChapter = book.chapters.some(ch => ch.filename === state.activeBook);
        if (hasActiveChapter) {
          folderLi.classList.add('expanded');
        }
        
        const chaptersHtml = book.chapters.map(ch => {
          const chProgress = Math.round(state.progress[ch.filename] || 0);
          const isActive = state.activeBook === ch.filename ? 'active' : '';
          return `
            <li class="book-item chapter-item ${isActive}" data-filename="${ch.filename}">
              <div class="book-item-title">
                <i data-lucide="file-text"></i>
                <span>${ch.title}</span>
              </div>
              <span class="book-progress-badge">${chProgress}%</span>
            </li>
          `;
        }).join('');
        
        folderLi.innerHTML = `
          <div class="book-folder-header">
            <div class="book-folder-title">
              <i data-lucide="chevron-right" class="folder-toggle-icon"></i>
              <i data-lucide="book" class="folder-icon-closed"></i>
              <i data-lucide="book-open" class="folder-icon-opened"></i>
              <span>${book.title}</span>
            </div>
          </div>
          <ul class="book-folder-chapters ${hasActiveChapter ? '' : 'hidden'}">
            ${chaptersHtml}
          </ul>
        `;
        
        // Expand/collapse click handler
        const header = folderLi.querySelector('.book-folder-header');
        header.addEventListener('click', (e) => {
          e.stopPropagation();
          folderLi.classList.toggle('expanded');
          const list = folderLi.querySelector('.book-folder-chapters');
          list.classList.toggle('hidden');
        });
        
        // Load chapter handlers
        folderLi.querySelectorAll('.chapter-item').forEach(chItem => {
          chItem.addEventListener('click', (e) => {
            e.stopPropagation();
            loadBook(chItem.dataset.filename);
          });
        });
        
        elements.bookList.appendChild(folderLi);
      } else {
        // Render a standalone file with a spacer to align icons with book folders
        const li = document.createElement('li');
        li.className = `book-item ${state.activeBook === book.filename ? 'active' : ''}`;
        li.dataset.filename = book.filename;
        
        const bookProgress = Math.round(state.progress[book.filename] || 0);
        const progressBadge = `<span class="book-progress-badge">${bookProgress}%</span>`;

        li.innerHTML = `
          <div class="book-item-title">
            <span class="folder-toggle-spacer"></span>
            <i data-lucide="${book.custom ? 'file-text' : 'book'}"></i>
            <span>${book.title}</span>
          </div>
          ${progressBadge}
        `;
        
        li.addEventListener('click', () => loadBook(book.filename));
        elements.bookList.appendChild(li);
      }
    });

    if (window.lucide) {
      window.lucide.createIcons({ attrs: { class: 'lucide-icon' } });
    }
  }

  function filterBooks() {
    const query = elements.searchInput.value.toLowerCase();
    
    // Filter standalone items
    const standaloneItems = elements.bookList.querySelectorAll('.book-item:not(.chapter-item)');
    standaloneItems.forEach(item => {
      const title = item.querySelector('.book-item-title span').textContent.toLowerCase();
      item.style.display = title.includes(query) ? 'flex' : 'none';
    });
    
    // Filter book folders
    const folders = elements.bookList.querySelectorAll('.book-folder');
    folders.forEach(folder => {
      const folderTitle = folder.querySelector('.book-folder-title span').textContent.toLowerCase();
      let matchCount = 0;
      
      const chapters = folder.querySelectorAll('.chapter-item');
      chapters.forEach(ch => {
        const chTitle = ch.querySelector('.book-item-title span').textContent.toLowerCase();
        const matches = chTitle.includes(query) || folderTitle.includes(query);
        ch.style.display = matches ? 'flex' : 'none';
        if (matches) matchCount++;
      });
      
      if (folderTitle.includes(query) || matchCount > 0) {
        folder.style.display = 'block';
        if (query.length > 0) {
          folder.classList.add('expanded');
          folder.querySelector('.book-folder-chapters').classList.remove('hidden');
        } else {
          const hasActive = folder.querySelector('.chapter-item.active');
          if (!hasActive) {
            folder.classList.remove('expanded');
            folder.querySelector('.book-folder-chapters').classList.add('hidden');
          }
        }
      } else {
        folder.style.display = 'none';
      }
    });
  }

  // --- BOOK LOADING & RENDERING ---
  async function loadBook(filename) {
    state.activeBook = filename;
    localStorage.setItem('reader-last-active', filename);
    
    // Highlight active item in library sidebar and expand parents
    const items = elements.bookList.querySelectorAll('.book-item');
    items.forEach(item => {
      if (item.dataset.filename === filename) {
        item.classList.add('active');
        const parentFolder = item.closest('.book-folder');
        if (parentFolder) {
          parentFolder.classList.add('expanded');
          const chaptersList = parentFolder.querySelector('.book-folder-chapters');
          if (chaptersList) chaptersList.classList.remove('hidden');
        }
      } else {
        item.classList.remove('active');
      }
    });

    // Show loading state and show floating progress badge
    if (elements.floatingProgress) {
      elements.floatingProgress.classList.add('visible');
    }
    elements.readingArticle.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        Loading book content...
      </div>
    `;
    elements.headerBookTitle.textContent = "Loading...";
    elements.readingTime.innerHTML = `<i data-lucide="clock"></i> Calculating...`;
    
    try {
      // Find metadata in state (standalone or nested chapter)
      let bookData = null;
      let isChapter = false;
      let bookTitle = '';
      
      for (const b of state.books) {
        if (b.isBook) {
          const ch = b.chapters.find(c => c.filename === filename);
          if (ch) {
            bookData = ch;
            isChapter = true;
            bookTitle = b.title;
            break;
          }
        } else if (b.filename === filename) {
          bookData = b;
          bookTitle = b.title;
          break;
        }
      }
      
      if (!bookData) throw new Error('Book not found in library');

      let markdownContent = '';
      
      if (bookData.offlineMock && filename === 'welcome.md') {
        markdownContent = `# Welcome to U.S. History to 1877! 📚\n\nIt looks like the Python backend server might not be running or accessible, but you can still read documents here!\n\n## Get Started\n\n- **Drag & Drop**: Drag any markdown (\`.md\`) file from your computer and drop it in the sidebar box to start reading.\n- **Offline Storage**: Your custom files and progress are stored safely inside your browser's local storage.`;
      } else if (bookData.custom) {
        markdownContent = bookData.content || '';
      } else {
        const response = await fetch(`/books/${filename}`);
        if (!response.ok) throw new Error('Failed to load file from server');
        markdownContent = await response.text();
      }

      // Display short or full title
      const displayTitle = isChapter ? `${bookTitle} - ${bookData.title}` : bookData.title;
      renderMarkdown(displayTitle, markdownContent, filename);
    } catch (error) {
      console.error(error);
      elements.readingArticle.innerHTML = `
        <div class="empty-state">
          <i data-lucide="alert-triangle" class="empty-state-icon" style="color: var(--accent-color)"></i>
          <h2>Failed to load book</h2>
          <p>${error.message}</p>
        </div>
      `;
      elements.headerBookTitle.textContent = "Error";
      if (elements.floatingProgress) {
        elements.floatingProgress.classList.remove('visible');
      }
    }
  }

  function renderMarkdown(title, markdownText, filename) {
    // Set headers
    elements.headerBookTitle.textContent = title;
    
    // Estimate Reading Time (avg 200 words per minute)
    const wordCount = markdownText.split(/\s+/).filter(w => w.length > 0).length;
    const minutes = Math.max(1, Math.round(wordCount / 200));
    elements.readingTime.innerHTML = `<i data-lucide="clock"></i> ${minutes} min read`;
    
    // Parse Markdown using marked.js
    if (window.marked) {
      // Inject IDs into headings to build Table of Contents
      const renderer = new marked.Renderer();
      let headingIndex = 0;
      
      renderer.heading = (text, level) => {
        // Create an ID out of the text
        const textStr = typeof text === 'object' ? text.text : text;
        const cleanId = textStr.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        const uniqueId = `heading-${level}-${cleanId}-${headingIndex++}`;
        
        return `<h${level} id="${uniqueId}">${textStr}</h${level}>`;
      };
      
      // Preprocess standard Markdown footnotes if any
      const preprocessedText = preprocessFootnotes(markdownText);
      
      const parsedHTML = marked.parse(preprocessedText, { renderer });
      
      // Sanitize using DOMPurify, allowing ID and href attributes for footnotes
      const purifyConfig = {
        ADD_TAGS: ['sup', 'sub'],
        ADD_ATTR: ['id', 'href', 'target']
      };
      const sanitizedHTML = window.DOMPurify ? DOMPurify.sanitize(parsedHTML, purifyConfig) : parsedHTML;
      
      // Inject into DOM
      elements.readingArticle.innerHTML = sanitizedHTML;
      
      // Build Table of Contents
      buildTOC();
      
      // Restore scroll progress after layout/images load
      const images = elements.readingArticle.querySelectorAll('img');
      let loadedImagesCount = 0;
      const onImageLoadOrError = () => {
        loadedImagesCount++;
        if (loadedImagesCount === images.length) {
          restoreScrollProgress(filename);
        }
      };

      if (images.length === 0) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            restoreScrollProgress(filename);
          }, 50);
        });
      } else {
        images.forEach(img => {
          if (img.complete) {
            onImageLoadOrError();
          } else {
            img.addEventListener('load', onImageLoadOrError);
            img.addEventListener('error', onImageLoadOrError);
          }
        });
        setTimeout(() => {
          if (loadedImagesCount < images.length) {
            restoreScrollProgress(filename);
          }
        }, 250);
      }

      // Re-create icons for newly injected elements if needed
      if (window.lucide) {
        window.lucide.createIcons();
      }
    } else {
      elements.readingArticle.textContent = markdownText;
    }
  }

  // --- PROGRESS TRACKING ---
  let badgeTimer = null;

  function updateProgressOnScroll() {
    if (!state.activeBook) return;

    let scrollTop = 0;
    let docHeight = 0;

    const container = elements.readingContainer;
    const containerDocHeight = container.scrollHeight - container.clientHeight;

    if (window.innerWidth <= 900) {
      // Mobile root scroll mode
      scrollTop = window.scrollY || document.documentElement.scrollTop;
      docHeight = document.documentElement.scrollHeight - window.innerHeight;
    } else {
      // Desktop container scroll mode
      scrollTop = container.scrollTop;
      docHeight = containerDocHeight;
    }
    
    // Default to 100% if the document fits entirely in the viewport
    let percentage = 100;
    if (docHeight > 0) {
      percentage = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
    }
    
    percentage = Math.round(percentage);
    
    // Update progress elements
    elements.progressBar.style.width = `${percentage}%`;
    elements.progressBar.setAttribute('aria-valuenow', percentage);
    elements.progressPercentage.innerHTML = `<i data-lucide="compass"></i> ${percentage}%`;
    if (elements.floatingProgressText) {
      elements.floatingProgressText.textContent = `${percentage}%`;
    }
    
    // Update state & localStorage
    state.progress[state.activeBook] = percentage;
    localStorage.setItem('reader-progress-map', JSON.stringify(state.progress));

    // Throttle updating sidebar badge to keep UI snappy
    if (!badgeTimer) {
      badgeTimer = setTimeout(() => {
        const activeItem = elements.bookList.querySelector('.book-item.active .book-progress-badge');
        if (activeItem) {
          activeItem.textContent = `${percentage}%`;
        }
        badgeTimer = null;
      }, 150);
    }

    // Highlight active Table of Contents item based on viewport headings
    highlightActiveTocHeader();
  }

  function restoreScrollProgress(filename) {
    const savedPercentage = state.progress[filename] || 0;
    const container = elements.readingContainer;
    const containerDocHeight = container.scrollHeight - container.clientHeight;
    
    let docHeight = 0;
    if (window.innerWidth <= 900) {
      docHeight = document.documentElement.scrollHeight - window.innerHeight;
    } else {
      docHeight = containerDocHeight;
    }
    
    let percentage = savedPercentage;
    // If the book fits entirely in the viewport, it is 100% read (UI display only, do not save to localstorage here)
    if (docHeight <= 0) {
      percentage = 100;
    }
    
    if (docHeight > 0 && percentage > 0) {
      const scrollTop = (percentage / 100) * docHeight;
      if (window.innerWidth <= 900) {
        window.scrollTo(0, scrollTop);
      } else {
        container.scrollTop = scrollTop;
      }
    } else {
      if (window.innerWidth <= 900) {
        window.scrollTo(0, 0);
      } else {
        container.scrollTop = 0;
      }
    }
    
    const roundedPercentage = Math.round(percentage);
    // Instantly set progress bar width
    elements.progressBar.style.width = `${roundedPercentage}%`;
    elements.progressBar.setAttribute('aria-valuenow', roundedPercentage);
    elements.progressPercentage.innerHTML = `<i data-lucide="compass"></i> ${roundedPercentage}%`;
    if (elements.floatingProgressText) {
      elements.floatingProgressText.textContent = `${roundedPercentage}%`;
    }
    if (elements.floatingProgress) {
      elements.floatingProgress.classList.add('visible');
    }
 
    // Instantly update the sidebar progress badge
    const activeItemBadge = elements.bookList.querySelector('.book-item.active .book-progress-badge');
    if (activeItemBadge) {
      activeItemBadge.textContent = `${roundedPercentage}%`;
    }
  }

  // --- TABLE OF CONTENTS BUILDER ---
  function buildTOC() {
    elements.tocList.innerHTML = '';
    
    const headings = elements.readingArticle.querySelectorAll('h1, h2, h3');
    
    if (headings.length === 0) {
      elements.tocList.innerHTML = `<li class="empty-toc">No headings in this book</li>`;
      return;
    }

    headings.forEach(heading => {
      const li = document.createElement('li');
      li.className = `toc-item toc-item-${heading.tagName.toLowerCase()}`;
      
      const a = document.createElement('a');
      a.href = `#${heading.id}`;
      a.textContent = heading.textContent;
      
      a.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Scroll heading into view
        smoothScrollToElement(heading, 80);
        
        // Close TOC drawer on mobile
        if (window.innerWidth <= 900) {
          elements.tocPanel.classList.remove('open');
        }
      });
      
      li.appendChild(a);
      elements.tocList.appendChild(li);
    });
  }

  function highlightActiveTocHeader() {
    const headings = Array.from(elements.readingArticle.querySelectorAll('h1, h2, h3'));
    if (headings.length === 0) return;

    const scrollTop = window.innerWidth <= 900 ? window.scrollY : elements.readingContainer.scrollTop;
    const containerTop = scrollTop + 90; // Add header offset buffer
    
    // Find heading currently in view
    let activeHeadingId = null;
    
    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      if (heading.offsetTop <= containerTop) {
        activeHeadingId = heading.id;
      } else {
        break; // headings are ordered, so we can stop searching
      }
    }
    
    // If none are past the top, highlight the first one
    if (!activeHeadingId && headings.length > 0) {
      activeHeadingId = headings[0].id;
    }

    // Highlight matching link in TOC panel
    const tocLinks = elements.tocList.querySelectorAll('.toc-item');
    tocLinks.forEach(item => {
      const link = item.querySelector('a');
      if (link && link.getAttribute('href') === `#${activeHeadingId}`) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // --- DRAG AND DROP & CUSTOM UPLOAD ---
  function setupDragAndDrop() {
    const zone = elements.dropzone;
    
    // Highlight drop zone on dragover
    ['dragenter', 'dragover'].forEach(eventName => {
      zone.addEventListener(eventName, (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      zone.addEventListener(eventName, (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
      }, false);
    });

    // Handle dropped files
    zone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      handleUploadedFiles(files);
    });

    // Click to open file dialog
    zone.addEventListener('click', () => {
      elements.fileInput.click();
    });

    elements.fileInput.addEventListener('change', (e) => {
      handleUploadedFiles(e.target.files);
    });
  }

  function handleUploadedFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    if (!file.name.endsWith('.md')) {
      alert('Please upload a Markdown (.md) file only.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const content = e.target.result;
      const title = file.name.replace(/\.md$/i, '').replace(/_|-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const filename = `custom_${Date.now()}_${file.name}`;
      
      const newBook = {
        filename: filename,
        title: title || file.name,
        size: file.size,
        custom: true,
        content: content
      };

      // Add to custom books list
      state.customBooks.push(newBook);
      localStorage.setItem('reader-custom-books', JSON.stringify(state.customBooks));
      
      // Update running list
      state.books.push(newBook);
      renderLibrary();
      
      // Auto-load newly uploaded book
      loadBook(filename);
    };

    reader.readAsText(file);
  }

  // --- CITATION / FOOTNOTE NAVIGATION ---
  async function handleArticleLinkClick(e) {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    try {
      // Check if it's an internal hash or MD file navigation
      if (href.startsWith('#')) {
        e.preventDefault();
        scrollToHash(href);
      } else if (href.includes('.md')) {
        // Parse URL
        const url = new URL(href, window.location.origin + window.location.pathname);
        const pathname = url.pathname;
        
        // Check if pointing to a markdown file
        if (pathname.endsWith('.md')) {
          e.preventDefault();
          
          const parts = pathname.split('/');
          const filename = parts[parts.length - 1];
          const hash = url.hash;
          
          if (filename) {
            await navigateToFootnote(filename, hash);
          }
        }
      }
    } catch (err) {
      console.warn('Error handling link click:', err);
    }
  }

  async function navigateToFootnote(filename, hash) {
    if (state.activeBook === filename) {
      scrollToHash(hash);
    } else {
      await loadBook(filename);
      // Wait for rendering and then scroll
      setTimeout(() => {
        scrollToHash(hash);
      }, 150);
    }
  }

  function scrollToHash(hash) {
    if (!hash) return;

    const id = hash.replace(/^#/, '');
    
    // 1. Try direct ID lookup
    let targetElement = document.getElementById(id);
    
    // 2. Dynamic fallback for footnotes: if id ends with 'en', find link pointing to baseId
    if (!targetElement && id.endsWith('en')) {
      const baseId = id.slice(0, -2); // strip 'en'
      // Try to find a link whose href ends with #baseId
      const selector = `a[href$="#${baseId}"]`;
      targetElement = elements.readingArticle.querySelector(selector);
      if (targetElement) {
        targetElement.id = id; // dynamically set ID for future lookups
      }
    }

    if (targetElement) {
      smoothScrollToElement(targetElement, 90);
      flashHighlightElement(targetElement);
    } else {
      console.warn(`Footnote/Citation target not found for hash: ${hash}`);
    }
  }

  function smoothScrollToElement(targetElement, offset = 90) {
    if (window.innerWidth <= 900) {
      const elementTop = targetElement.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementTop - offset,
        behavior: 'smooth'
      });
    } else {
      const elementTop = targetElement.getBoundingClientRect().top + elements.readingContainer.scrollTop;
      elements.readingContainer.scrollTo({
        top: elementTop - offset,
        behavior: 'smooth'
      });
    }
  }

  function flashHighlightElement(element) {
    element.classList.remove('highlight-footnote');
    void element.offsetWidth; // trigger reflow to restart animation
    element.classList.add('highlight-footnote');
    
    setTimeout(() => {
      element.classList.remove('highlight-footnote');
    }, 2600);
  }

  function preprocessFootnotes(markdownText) {
    // 1. Extract footnote definitions: [^id]: text
    const definitions = [];
    const defRegex = /^[ \t]*\[\^([^\]]+)\]:[ \t]*(.+)$/gm;
    
    const cleanedText = markdownText.replace(defRegex, (match, id, text) => {
      definitions.push({ id, text });
      return '';
    });
    
    // 2. Replace footnote references: [^id]
    const refRegex = /\[\^([^\]]+)\]/g;
    let finalMarkdown = cleanedText.replace(refRegex, (match, id) => {
      return `<a href="#fn-${id}" id="fnref-${id}"><sup>${id}</sup></a>`;
    });
    
    // 3. Append footnotes section at the bottom
    if (definitions.length > 0) {
      finalMarkdown += '\n\n---\n\n### Footnotes\n\n<div class="footnotes-section">\n';
      definitions.forEach(def => {
        finalMarkdown += `<div id="fn-${def.id}" class="footnote-item" style="margin-bottom: 8px; font-size: 0.85em; opacity: 0.95;"><a href="#fnref-${def.id}" class="footnote-backlink" style="font-weight: bold; margin-right: 4px;">${def.id}.</a> ${def.text}</div>\n`;
      });
      finalMarkdown += '</div>';
    }
    
    return finalMarkdown;
  }

  // Run initial setup
  init();
});
