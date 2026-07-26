import hmac
import http.server
import json
import os
import socketserver
import sys
import urllib.request

PORT = 8080
DIR = os.path.dirname(os.path.abspath(__file__))

PLACE_ID = 'ChIJlRrJHtZn4DsR7wN-UGhArIU'
API_KEY = 'AIzaSyAHySBnryAALwUAt_jqQ94VAzVMXv4eFBU'

ALLOWED_IP = '150.129.52.203'
EDIT_PASSWORD_FILE = os.path.expanduser('~/.utsah-edit-password')
ALLOWED_FILES = {
    'about.html', 'contact.html', 'corporate.html', 'events.html',
    'index.html', 'live.html', 'memories.html', 'privacy.html',
    'socials.html', 'team.html', 'terms.html', 'wedding.html'
}


def client_ip(handler):
    return handler.headers.get('Cf-Connecting-Ip') or handler.client_address[0]


def is_allowed_ip(handler):
    return client_ip(handler) == ALLOWED_IP


def check_password(handler):
    try:
        with open(EDIT_PASSWORD_FILE, 'r', encoding='utf-8') as f:
            expected = f.read().strip()
    except OSError:
        return False
    if not expected:
        return False
    auth = handler.headers.get('Authorization', '')
    provided = auth[7:] if auth.startswith('Bearer ') else ''
    return bool(provided) and hmac.compare_digest(provided, expected)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_json(self, status, obj):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode())

    def do_GET(self):
        if self.path == "/google-reviews":
            try:
                url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={PLACE_ID}&fields=name,rating,reviews,user_ratings_total&key={API_KEY}"
                req = urllib.request.Request(url)
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = resp.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(data)
            except Exception as e:
                self.send_json(500, {"error": str(e)})
        elif self.path == "/edit-check":
            self.send_json(200, {"allowed": is_allowed_ip(self)})
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/save":
            if not is_allowed_ip(self):
                self.send_json(403, {"error": "Forbidden"})
                return
            if not check_password(self):
                self.send_json(401, {"error": "Unauthorized"})
                return
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            filename = os.path.basename(body.get("file", ""))
            content = body.get("content", "")
            if filename in ALLOWED_FILES:
                filepath = os.path.join(DIR, filename)
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                self.send_json(200, {"ok": True})
            else:
                self.send_json(400, {"error": "File not allowed"})
        else:
            self.send_response(404)
            self.end_headers()

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

    def handle_error(self, request, client_address):
        exc_type = sys.exc_info()[0]
        if exc_type in (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            return
        super().handle_error(request, client_address)

print(f"Server running at http://localhost:{PORT}")
ThreadingHTTPServer(("", PORT), Handler).serve_forever()
