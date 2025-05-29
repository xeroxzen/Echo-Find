#!/bin/bash

# EchoFind Deployment Script
# This script to be run after initial setup as srvadmin user

set -e

echo "🚀 Starting EchoFind deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as srvadmin (not root)
if [ "$EUID" -eq 0 ]; then
    print_error "Please run this script as srvadmin user, not root"
    print_error "Use: su - srvadmin, then run this script"
    exit 1
fi

# Check if user has sudo access
if ! sudo -n true 2>/dev/null; then
    print_error "This script requires sudo access. Please ensure srvadmin has sudo privileges."
    exit 1
fi

# Get domain name
read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
    print_error "Domain name is required"
    exit 1
fi

# Get OpenAI API key
read -s -p "Enter your OpenAI API key: " OPENAI_KEY
echo
if [ -z "$OPENAI_KEY" ]; then
    print_error "OpenAI API key is required"
    exit 1
fi

print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

print_status "Installing essential packages..."
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx ufw htop

print_status "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

print_status "Installing PM2..."
sudo npm install -g pm2

print_status "Setting up application directory..."
sudo mkdir -p /var/www
cd /var/www

# Check if directory already exists
if [ -d "echo-find" ]; then
    print_warning "Directory echo-find already exists. Removing..."
    sudo rm -rf echo-find
fi

print_status "Cloning repository..."
sudo git clone https://github.com/xeroxzen/Echo-Find.git echo-find

print_status "Setting proper ownership to srvadmin..."
sudo chown -R srvadmin:srvadmin /var/www/echo-find

cd echo-find

print_status "Installing dependencies..."
npm ci --production=false

print_status "Creating environment file..."
cat > .env.local << EOF
OPENAI_API_KEY=$OPENAI_KEY
NODE_ENV=production
PORT=3000
EOF

print_status "Building application..."
npm run build

print_status "Creating PM2 ecosystem file..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'echo-find',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

print_status "Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save

print_status "Setting up PM2 startup..."
print_warning "You may need to run the startup command as sudo. PM2 will provide instructions."
pm2 startup

print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/echo-find > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Handle large file uploads
        client_max_body_size 100M;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    # Serve static files directly
    location /_next/static/ {
        alias /var/www/echo-find/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
EOF

print_status "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/echo-find /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

print_status "Testing Nginx configuration..."
sudo nginx -t

print_status "Restarting Nginx..."
sudo systemctl restart nginx

print_status "Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

print_status "Creating update script..."
cat > /var/www/echo-find/update.sh << 'EOF'
#!/bin/bash
cd /var/www/echo-find
git pull origin main
npm ci --production=false
npm run build
pm2 restart echo-find
echo "Update completed!"
EOF

chmod +x /var/www/echo-find/update.sh

print_status "Creating backup script..."
mkdir -p $HOME/backups
cat > $HOME/backup-echo-find.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="$HOME/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/echo-find_$DATE.tar.gz /var/www/echo-find

# Keep only last 7 backups
find $BACKUP_DIR -name "echo-find_*.tar.gz" -mtime +7 -delete

echo "Backup completed: echo-find_$DATE.tar.gz"
EOF

chmod +x $HOME/backup-echo-find.sh

# Set up daily backup cron job
print_status "Setting up daily backup cron job..."
(crontab -l 2>/dev/null; echo "0 2 * * * $HOME/backup-echo-find.sh") | crontab -

print_status "Setting up SSL certificate..."
read -p "Would you like to install SSL certificate now? (y/n): " INSTALL_SSL

if [ "$INSTALL_SSL" = "y" ] || [ "$INSTALL_SSL" = "Y" ]; then
    print_warning "Make sure your domain DNS is pointing to this server before continuing..."
    read -p "Press Enter when DNS is configured..."
    
    sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME
    
    # Test auto-renewal
    sudo certbot renew --dry-run
    
    print_status "SSL certificate installed successfully!"
else
    print_warning "SSL certificate skipped. You can install it later with:"
    echo "sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME"
fi

print_status "Deployment completed! 🎉"
echo
echo "============================================"
echo "🚀 EchoFind Deployment Summary"
echo "============================================"
echo "Domain: http://$DOMAIN_NAME"
echo "Application: Running on PM2 (user: srvadmin)"
echo "Web Server: Nginx"
echo "Firewall: UFW enabled"
echo "Backups: Daily at 2 AM"
echo "Update script: /var/www/echo-find/update.sh"
echo "Backup script: $HOME/backup-echo-find.sh"
echo
echo "Next steps:"
echo "1. Configure your DNS to point to this server"
echo "2. Install SSL certificate if not done already"
echo "3. Test the application by uploading an audio file"
echo
echo "Useful commands:"
echo "- Check app status: pm2 status"
echo "- View app logs: pm2 logs echo-find"
echo "- Update app: /var/www/echo-find/update.sh"
echo "- Backup app: $HOME/backup-echo-find.sh"
echo "- Check nginx status: sudo systemctl status nginx"
echo "- View nginx logs: sudo tail -f /var/log/nginx/error.log"
echo
print_status "EchoFind application is now live!" 