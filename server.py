import http.server
import json
import os
import re
import socketserver
import urllib.parse

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Load rewrites from vercel.json
rewrites = []
vercel_json_path = os.path.join(DIRECTORY, 'vercel.json')
if os.path.exists(vercel_json_path):
    try:
        with open(vercel_json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            rewrites = data.get('rewrites', [])
    except Exception as e:
        print(f"Error loading vercel.json: {e}")

class RewriteHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def translate_path(self, path):
        parsed = urllib.parse.urlparse(path)
        clean_path = parsed.path

        for rule in rewrites:
            src = rule.get('source')
            dest = rule.get('destination')
            if not src or not dest:
                continue

            if ':match*' in src:
                prefix = src.replace(':match*', '')
                if clean_path.startswith(prefix):
                    rest = clean_path[len(prefix):]
                    path = dest.replace(':match*', rest)
                    break
            elif clean_path == src or clean_path == src + '/':
                dest_parsed = urllib.parse.urlparse(dest)
                path = dest_parsed.path
                if not path or path == '/':
                    path = '/index.html'
                break

        return super().translate_path(path)

if __name__ == '__main__':
    with http.server.ThreadingHTTPServer(("", PORT), RewriteHandler) as httpd:
        print("==================================================")
        print(f" CHSchat Local Dev Server running on http://localhost:{PORT}")
        print(" (Direct URL rewrites enabled from vercel.json)")
        print("==================================================")
        print(f" - http://localhost:{PORT}/face")
        print(f" - http://localhost:{PORT}/gaokao")
        print(f" - http://localhost:{PORT}/grade-calculator")
        print(f" - http://localhost:{PORT}/volume3d")
        print(f" - http://localhost:{PORT}/selection-logic")
        print(f" - http://localhost:{PORT}/honorroll")
        print(f" - http://localhost:{PORT}/developer")
        print(f" - http://localhost:{PORT}/menu")
        print(f" - http://localhost:{PORT}/suggestions")
        print("==================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down.")
