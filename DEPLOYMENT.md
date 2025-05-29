# 🚀 Vultr Deployment Guide for EchoFind

A walkthrough of deploying the EchoFind application to my Vultr server.

## 📋 Prerequisites

- Vultr account
- OpenAI API key
- Local Git repository ready
- Basic familiarity with Linux/Ubuntu commands
- Non-root user with sudo privileges (e.g., srvadmin)

## 🖥️ Server Setup

### 1. Create Vultr Instance

1. **Log into Vultr Dashboard**

   - Go to [https://my.vultr.com](https://my.vultr.com)

2. **Deploy New Server**

   - Click "Deploy +" → "Deploy New Server"
   - **Server Type**: Cloud Compute - Regular Performance
   - **Location**: Choose closest to your users
   - **Server Image**: Ubuntu 22.04 LTS x64
   - **Server Size**:
     - Minimum: $6/month (1 vCPU, 1GB RAM, 25GB SSD)
     - Recommended: $12/month (1 vCPU, 2GB RAM, 55GB SSD)
   - **Additional Features**: Enable IPv6
   - **Server Hostname & Label**: echo-find-production
   - **SSH Keys**: Add your SSH key (recommended)

3. **Wait for Deployment** (usually 2-3 minutes)

### 2. Initial Server Configuration

```bash
# SSH into your server as root initially
ssh root@YOUR_SERVER_IP

# Create srvadmin user
adduser srvadmin

# Add srvadmin to sudo group
usermod -aG sudo srvadmin

# Copy SSH keys to srvadmin (if using SSH keys)
mkdir -p /home/srvadmin/.ssh
cp /root/.ssh/authorized_keys /home/srvadmin/.ssh/
chown -R srvadmin:srvadmin /home/srvadmin/.ssh
chmod 700 /home/srvadmin/.ssh
chmod 600 /home/srvadmin/.ssh/authorized_keys

# Switch to srvadmin user
su - srvadmin

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx ufw
```

### 3. Install Node.js & npm

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Install PM2 for process management
sudo npm install -g pm2
```

## 🔧 Application Deployment

### 1. Clone Your Repository

```bash
# Navigate to web directory
cd /var/www

# Clone your repository (replace with your actual repo URL)
sudo git clone https://github.com/xeroxzen/Echo-Find.git echo-find
cd echo-find

# Set proper ownership to srvadmin
sudo chown -R srvadmin:srvadmin /var/www/echo-find
```

### 2. Install Dependencies & Build

```bash
# Install Node.js dependencies
npm ci --production=false

# Create environment file
nano .env.local
```

Add your environment variables:

```env
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
PORT=3000
```

```bash
# Build the application
npm run build

# Test the build locally
npm start &
```

Test if it works:

```bash
curl http://localhost:3000
# Should return HTML content
```

Kill the test process:

```bash
pkill -f "npm start"
```

### 3. Configure PM2

Create PM2 ecosystem file:

```bash
nano ecosystem.config.js
```

Add the following content:

```javascript
module.exports = {
  apps: [
    {
      name: "echo-find",
      script: "npm",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
```

Start the application with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Follow the instructions provided by pm2 startup command
```

## 🌐 Nginx Configuration

### 1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/echo-find
```

Add the following configuration (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

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
}
```

### 2. Enable the Site

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/echo-find /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

## 🔒 SSL Certificate Setup

### 1. Configure Domain DNS

Point your domain to your Vultr server's IP address:

- **A Record**: `@` → `YOUR_SERVER_IP`
- **A Record**: `www` → `YOUR_SERVER_IP`

### 2. Install SSL Certificate

```bash
# Install Let's Encrypt certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 🔥 Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

## 📊 Monitoring & Maintenance

### 1. Monitor Application

```bash
# Check PM2 status
pm2 status
pm2 logs echo-find

# Monitor server resources
htop
df -h
free -h
```

### 2. Update Application

Create an update script:

```bash
nano /var/www/echo-find/update.sh
```

Add:

```bash
#!/bin/bash
cd /var/www/echo-find
git pull origin main
npm ci --production=false
npm run build
pm2 restart echo-find
```

Make it executable:

```bash
chmod +x update.sh
```

## 🎯 Performance Optimization

### 1. Enable Nginx Gzip Compression

Add to your nginx configuration:

```nginx
# Add inside the server block
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
```

### 2. Server Monitoring

```bash
# Install htop for monitoring
sudo apt install htop

# Set up log rotation
sudo nano /etc/logrotate.d/echo-find
```

Add:

```
/var/www/echo-find/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 srvadmin srvadmin
}
```

## 🚨 Troubleshooting

### Common Issues & Solutions

1. **Application won't start**

   ```bash
   pm2 logs echo-find
   # Check for errors in logs
   ```

2. **502 Bad Gateway**

   ```bash
   # Check if app is running
   pm2 status
   # Check nginx configuration
   sudo nginx -t
   ```

3. **Large file upload issues**

   ```bash
   # Increase nginx limits
   sudo nano /etc/nginx/nginx.conf
   # Add: client_max_body_size 100M;
   ```

4. **Memory issues**
   ```bash
   # Monitor memory usage
   free -h
   # Restart PM2 if needed
   pm2 restart echo-find
   ```

## 🔄 Backup Strategy

### 1. Application Backup

```bash
# Create backup script (in srvadmin home directory)
nano ~/backup-echo-find.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="$HOME/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/echo-find_$DATE.tar.gz /var/www/echo-find

# Keep only last 7 backups
find $BACKUP_DIR -name "echo-find_*.tar.gz" -mtime +7 -delete

echo "Backup completed: echo-find_$DATE.tar.gz"
```

Make it executable and set up cron job:

```bash
chmod +x ~/backup-echo-find.sh

# Set up cron job
crontab -e
# Add: 0 2 * * * /home/srvadmin/backup-echo-find.sh
```

## ✅ Post-Deployment Checklist

- [ ] Application is accessible via domain
- [ ] SSL certificate is working
- [ ] File uploads are working
- [ ] Audio transcription is working (test with OpenAI API)
- [ ] PM2 is managing the process
- [ ] Nginx is serving static files
- [ ] Firewall is configured
- [ ] Backups are scheduled
- [ ] Monitoring is in place

## 📞 Support

If you encounter issues:

1. Check application logs: `pm2 logs echo-find`
2. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check system resources: `htop` and `df -h`
4. Restart services: `pm2 restart echo-find` and `sudo systemctl restart nginx`

---

EchoFind application should now be live and accessible! 🎉
