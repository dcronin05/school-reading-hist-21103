import os
import json
import http.server
import socketserver
import sys

PORT = 8383
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MarkdownReaderHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Initialize with the base directory
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        # Handle CORS preflight request
        self.send_response(200, "OK")
        self.end_headers()

    def do_GET(self):
        # Intercept API call to list books
        if self.path == '/api/books' or self.path == '/api/books/':
            books_dir = os.path.join(DIRECTORY, 'books')
            if not os.path.exists(books_dir):
                os.makedirs(books_dir, exist_ok=True)
            
            try:
                # 1. Read all structured book metadata files (.json)
                books = []
                chapter_files = set()
                
                for f in os.listdir(books_dir):
                    if f.endswith('.json'):
                        json_path = os.path.join(books_dir, f)
                        try:
                            with open(json_path, 'r', encoding='utf-8') as fj:
                                book_data = json.load(fj)
                                if book_data.get('isBook'):
                                    books.append(book_data)
                                    for ch in book_data.get('chapters', []):
                                        if 'filename' in ch:
                                            chapter_files.add(ch['filename'])
                        except Exception:
                            pass

                # 2. Get list of loose .md files (excluding files belonging to books)
                standalone_files = []
                for f in os.listdir(books_dir):
                    if f.endswith('.md') and f not in chapter_files:
                        file_path = os.path.join(books_dir, f)
                        stats = os.stat(file_path)
                        
                        # Try to parse frontmatter for title
                        title_val = None
                        try:
                            with open(file_path, 'r', encoding='utf-8') as fh:
                                first_line = fh.readline().strip()
                                if first_line == '---':
                                    for line in fh:
                                        line = line.strip()
                                        if line == '---':
                                            break
                                        if ':' in line:
                                            k, v = line.split(':', 1)
                                            if k.strip().lower() == 'title':
                                                title_val = v.strip().strip('"').strip("'")
                                                break
                        except Exception:
                            pass
                        
                        title = title_val if title_val else f[:-3].replace('_', ' ').replace('-', ' ').title()
                        standalone_files.append({
                            'filename': f,
                            'title': title,
                            'size': stats.st_size,
                            'modified': stats.st_mtime
                        })
                
                # Sort listings
                standalone_files.sort(key=lambda x: x['title'])
                books.sort(key=lambda x: x['title'])
                
                # Combined list
                response_data = books + standalone_files

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
        else:
            # Fallback to standard static file serving
            super().do_GET()

def run_server():
    # Allow port reuse to prevent "Address already in use" errors during testing
    socketserver.TCPServer.allow_reuse_address = True
    
    print(f"Starting server in directory: {DIRECTORY}")
    print(f"Books directory should be: {os.path.join(DIRECTORY, 'books')}")
    
    try:
        with socketserver.TCPServer(("", PORT), MarkdownReaderHandler) as httpd:
            print(f"\n=======================================================")
            print(f"  School Reading Server running at http://localhost:{PORT}")
            print(f"  Press Ctrl+C to stop.")
            print(f"=======================================================\n")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        sys.exit(0)
    except Exception as e:
        print(f"Error starting server: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    run_server()
