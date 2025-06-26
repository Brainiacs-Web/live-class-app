#!/usr/bin/env bash
set -e

# 1. Update package lists
echo "🛠️  Updating apt repositories..."
apt-get update -qq

# 2. Install NGINX with RTMP module
echo "🛠️  Installing nginx and rtmp module..."
apt-get install -y -qq nginx libnginx-mod-rtmp

# 3. Ensure HLS output directory exists
echo "🛠️  Creating HLS directory..."
mkdir -p /tmp/hls

# 4. Copy your nginx.conf into place
echo "🛠️  Deploying nginx.conf..."
cp nginx.conf /etc/nginx/nginx.conf

# 5. Start nginx in the foreground
echo "🚀 Starting NGINX with RTMP + HLS support..."
nginx -g 'daemon off;'
