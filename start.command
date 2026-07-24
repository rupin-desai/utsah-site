#!/bin/bash

# Find this script's folder (works on any Mac)
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Kill any existing server or tunnel
pkill -f "http.server 8080" 2>/dev/null
pkill -f cloudflared 2>/dev/null
sleep 1

# Install cloudflared if not already installed
if [ ! -f "$HOME/bin/cloudflared" ]; then
  echo "Installing cloudflared..."
  mkdir -p "$HOME/bin"
  curl -L "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz" -o /tmp/cf.tgz
  tar -xzf /tmp/cf.tgz -C /tmp
  mv /tmp/cloudflared "$HOME/bin/cloudflared"
  chmod +x "$HOME/bin/cloudflared"
fi

# Copy tunnel credentials to this Mac's ~/.cloudflared if needed
mkdir -p "$HOME/.cloudflared"
cp "$DIR/.cloudflared/cert.pem" "$HOME/.cloudflared/" 2>/dev/null
cp "$DIR/.cloudflared/9e548463-fdc0-4341-8dd0-2b155968ee3f.json" "$HOME/.cloudflared/" 2>/dev/null

# Write config pointing to correct paths for this Mac
cat > "$HOME/.cloudflared/config.yml" << CONF
tunnel: 9e548463-fdc0-4341-8dd0-2b155968ee3f
credentials-file: $HOME/.cloudflared/9e548463-fdc0-4341-8dd0-2b155968ee3f.json

ingress:
  - hostname: utsahevents.com
    service: http://localhost:8080
  - hostname: www.utsahevents.com
    service: http://localhost:8080
  - service: http_status:404
CONF

# Start Python web server
python3 -m http.server 8080 &
echo "Website server started."

# Start Cloudflare tunnel
"$HOME/bin/cloudflared" tunnel --config "$HOME/.cloudflared/config.yml" run utsah-events &

echo ""
echo "Your website is live at: https://utsahevents.com"
echo "Keep this window open while working."
echo ""
wait
