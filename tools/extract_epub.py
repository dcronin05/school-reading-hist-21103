import zipfile
import xml.etree.ElementTree as ET
import os
import re
import json
import shutil
from html.parser import HTMLParser

# UPDATE THESE PATHS TO YOUR LOCAL EPUB AND DESTINATION DIRECTORIES
epub_path = r"C:\path\to\your\book.epub"
dest_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "books")
images_dest_dir = os.path.join(dest_dir, "images")

# Defining the exact chapter section maps
SECTIONS = [
    {"title": "Cover", "files": ["cover.xhtml"]},
    {"title": "Title Page", "files": ["titlepage.xhtml"]},
    {"title": "Copyright & Legal", "files": ["copyright.xhtml"]},
    {"title": "Contents", "files": ["toc.xhtml"]},
    {"title": "Dedication", "files": ["dedication.xhtml"]},
    {"title": "Epigraph", "files": ["epigraph.xhtml"]},
    {"title": "Preface", "files": ["preface001.xhtml"]},
    {"title": "Author's Note", "files": ["preface003.xhtml"]},
    {"title": "Introduction", "files": ["introduction.xhtml"]},
    {"title": "Chapter One: Jamestown", "files": ["chapter001.xhtml"]},
    {"title": "Chapter Two: The Great Reforms", "files": ["chapter002.xhtml", "chapter003.xhtml", "chapter004.xhtml"]},
    {"title": "Chapter Three: First Africans", "files": ["chapter005.xhtml"]},
    {"title": "Chapter Four: Commonwealth", "files": ["chapter006.xhtml"]},
    {"title": "Chapter Five: Tumult and Liberty", "files": ["chapter007.xhtml", "chapter008.xhtml", "chapter009.xhtml"]},
    {"title": "Chapter Six: Inequality and Freedom", "files": ["chapter010.xhtml"]},
    {"title": "Epilogue: After 1619", "files": ["chapter011.xhtml"]},
    {"title": "Acknowledgements", "files": ["acknowledgements.xhtml"]},
    {"title": "About the Author", "files": ["personblurb.xhtml"]},
    {"title": "Notes & References", "files": ["endnotes.xhtml"]},
    {"title": "Index", "files": ["appendix001.xhtml"]},
]

# Build map from XHTML name to final Markdown filename
FILE_MAP = {}
for idx, sec in enumerate(SECTIONS, 1):
    sec_filename = f"1619_sec_{idx:02d}.md"
    for xhtml_file in sec["files"]:
        FILE_MAP[xhtml_file] = sec_filename

# Define clean HTML to Markdown parser with link support
class HTMLToMarkdown(HTMLParser):
    def __init__(self):
        super().__init__()
        self.markdown = []
        self.in_title = False
        self.title = ""
        self.in_h = False
        self.h_level = 0
        self.in_p = False
        self.in_blockquote = False
        self.in_em = False
        self.in_strong = False
        self.in_list = False
        self.list_type = None  # 'ul' or 'ol'
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == 'title':
            self.in_title = True
        elif tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            self.in_h = True
            self.h_level = int(tag[1])
            self.markdown.append(f'\n\n{"#" * self.h_level} ')
        elif tag == 'p':
            self.in_p = True
            self.markdown.append('\n\n')
        elif tag == 'blockquote':
            self.in_blockquote = True
            self.markdown.append('\n\n> ')
        elif tag in ['em', 'i']:
            self.in_em = True
            self.markdown.append('*')
        elif tag in ['strong', 'b']:
            self.in_strong = True
            self.markdown.append('**')
        elif tag == 'ul':
            self.in_list = True
            self.list_type = 'ul'
        elif tag == 'ol':
            self.in_list = True
            self.list_type = 'ol'
        elif tag == 'li':
            self.markdown.append('\n- ' if self.list_type == 'ul' else '\n1. ')
        elif tag == 'br':
            self.markdown.append('\n')
        elif tag == 'img':
            src = attrs_dict.get('src', '')
            alt = attrs_dict.get('alt', 'Image')
            if src:
                src_filename = os.path.basename(src)
                rewritten_src = f"books/images/{src_filename}"
                self.markdown.append(f'\n\n![{alt}]({rewritten_src})\n\n')
        elif tag == 'a':
            href = attrs_dict.get('href', '')
            a_id = attrs_dict.get('id', '')
            rewritten_href = ""
            
            if href:
                if '#' in href:
                    part_file, part_anchor = href.split('#', 1)
                    if part_file in FILE_MAP:
                        rewritten_href = f"{FILE_MAP[part_file]}#{part_anchor}"
                    elif not part_file:
                        # Same file anchor
                        rewritten_href = f"#{part_anchor}"
                    else:
                        rewritten_href = href
                else:
                    if href in FILE_MAP:
                        rewritten_href = FILE_MAP[href]
                    else:
                        rewritten_href = href
            
            # Preserving anchor tag as-is but with rewritten link path
            id_attr = f' id="{a_id}"' if a_id else ''
            href_attr = f' href="{rewritten_href}"' if rewritten_href else ''
            self.markdown.append(f'<a{href_attr}{id_attr}>')
        elif tag == 'sup':
            self.markdown.append('<sup>')
            
    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
        elif tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            self.in_h = False
            self.markdown.append('\n')
        elif tag == 'p':
            self.in_p = False
            self.markdown.append('\n')
        elif tag == 'blockquote':
            self.in_blockquote = False
            self.markdown.append('\n')
        elif tag in ['em', 'i']:
            self.in_em = False
            self.markdown.append('*')
        elif tag in ['strong', 'b']:
            self.in_strong = False
            self.markdown.append('**')
        elif tag in ['ul', 'ol']:
            self.in_list = False
        elif tag == 'a':
            self.markdown.append('</a>')
        elif tag == 'sup':
            self.markdown.append('</sup>')
            
    def handle_data(self, data):
        if self.in_title:
            self.title += data
        else:
            cleaned = re.sub(r'\s+', ' ', data)
            if cleaned:
                if self.in_blockquote:
                    cleaned = cleaned.replace('\n', '\n> ')
                self.markdown.append(cleaned)
                
    def get_markdown(self):
        text = "".join(self.markdown)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

def main():
    os.makedirs(dest_dir, exist_ok=True)
    os.makedirs(images_dest_dir, exist_ok=True)
    print(f"Opening EPUB file: {epub_path}")
    with zipfile.ZipFile(epub_path, 'r') as z:
        # Extract images first
        for name in z.namelist():
            if name.startswith("OEBPS/images/") and not name.endswith("/"):
                filename = os.path.basename(name)
                dest_path = os.path.join(images_dest_dir, filename)
                with z.open(name) as src_file, open(dest_path, 'wb') as dest_file:
                    shutil.copyfileobj(src_file, dest_file)
                print(f"Extracted image: {filename}")
                
        # Parse container.xml for OPF path
        container_xml = z.read("META-INF/container.xml")
        root = ET.fromstring(container_xml)
        ns = {"container": "urn:oasis:names:tc:opendocument:xmlns:container"}
        rootfile = root.find(".//container:rootfile", ns)
        opf_path = rootfile.attrib["full-path"]
        opf_dir = os.path.dirname(opf_path)
        
        # Converted chapters tracking
        chapters_json = []
        
        # Process sections
        for idx, section in enumerate(SECTIONS, 1):
            sec_title = section["title"]
            sec_files = section["files"]
            sec_filename = f"1619_sec_{idx:02d}.md"
            
            merged_markdown = []
            
            for file_name in sec_files:
                full_href = os.path.join(opf_dir, file_name).replace('\\', '/')
                try:
                    html_bytes = z.read(full_href)
                    html_content = html_bytes.decode('utf-8', errors='ignore')
                    
                    # Parse to markdown
                    parser = HTMLToMarkdown()
                    parser.feed(html_content)
                    markdown_text = parser.get_markdown()
                    if markdown_text:
                        merged_markdown.append(markdown_text)
                except Exception as e:
                    print(f"Error reading {file_name}: {e}")
            
            # Combine multiple files inside section with divider
            full_markdown = "\n\n---\n\n".join(merged_markdown)
            
            # Add simple frontmatter for debugging/metadata
            frontmatter = f"---\ntitle: \"{sec_title}\"\nbook: \"1619: Jamestown and the Forging of American Democracy\"\n---\n\n"
            final_content = frontmatter + full_markdown
            
            # Save section markdown file
            dest_file_path = os.path.join(dest_dir, sec_filename)
            with open(dest_file_path, 'w', encoding='utf-8') as f_out:
                f_out.write(final_content)
            
            print(f"Saved: {sec_filename} ({sec_title})")
            
            # Append to book json
            chapters_json.append({
                "filename": sec_filename,
                "title": sec_title
            })
            
        # Write 1619_book.json
        book_metadata = {
            "id": "1619_book",
            "title": "1619: Jamestown and the Forging of American Democracy",
            "isBook": True,
            "chapters": chapters_json
        }
        
        metadata_path = os.path.join(dest_dir, "1619_book.json")
        with open(metadata_path, 'w', encoding='utf-8') as f_meta:
            json.dump(book_metadata, f_meta, indent=2)
            
        print("Success! Created 1619_book.json and all chapter markdown files.")

if __name__ == '__main__':
    main()
