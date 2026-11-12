# Ubuntu Deployment Guide: Wrike Timesheet & Remote Work Tracker

This guide covers deploying the application on **Ubuntu Linux (22.04 LTS & 24.04 LTS)** using either:
- **Method 1: Native Ubuntu Server (systemd + Nginx)** *(Fastest, no Docker required)*
- **Method 2: Ubuntu-Based Docker Container (`docker compose`)** *(Containerized, isolated)*

---

## Method 1: Native Ubuntu Server Deployment (Recommended)

Run the application directly on your Ubuntu bare-metal server or Virtual Machine (VM).

### Prerequisites
- An Ubuntu 22.04 LTS or 24.04 LTS server (AWS EC2, DigitalOcean Droplet, on-premise Proxmox/VMware, or physical server).
- Root or `sudo` access.

### Step 1: Copy Code to Your Ubuntu Server
On your server (or via SSH), clone or copy the project into a directory (e.g. `~/wrike-timesheet-app`):
```bash
git clone <your-repository-url> ~/wrike-timesheet-app
cd ~/wrike-timesheet-app
```

### Step 2: Run the Automated Installer
Make the installer executable and run it:
```bash
chmod +x scripts/install-ubuntu.sh scripts/update-ubuntu.sh
sudo ./scripts/install-ubuntu.sh
```

**What the installer does automatically:**
1. Installs Node.js 22 LTS (via NodeSource) and Nginx via `apt`.
2. Creates an unprivileged system user (`wrikeapp`) and moves files to `/opt/wrike-timesheet-app`.
3. Installs dependencies and builds the production frontend (`npm run build`).
4. Installs and starts the `wrike-timesheet.service` systemd unit (auto-starts on boot).
5. Configures Nginx reverse proxy to forward traffic from port 80 to `127.0.0.1:3000`.

### Step 3: Configure Domain & Enable Free SSL (Optional)
If your server has a public domain (e.g., `timesheet.yourdomain.com`):
1. Update `/etc/nginx/sites-available/wrike-timesheet` and replace `server_name` with your domain name.
2. Obtain a free Let's Encrypt SSL certificate:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d timesheet.yourdomain.com
```

### Step 4: Useful Management Commands
- **View live application logs**:
  ```bash
  sudo journalctl -u wrike-timesheet -f
  ```
- **Restart the application**:
  ```bash
  sudo systemctl restart wrike-timesheet
  ```
- **Check service status**:
  ```bash
  sudo systemctl status wrike-timesheet
  ```
- **Deploy updates**:
  ```bash
  sudo /opt/wrike-timesheet-app/scripts/update-ubuntu.sh
  ```

---

## Method 2: Ubuntu-Based Docker Deployment

If your corporate IT requires running inside an Ubuntu container:

### Prerequisites
- Docker and Docker Compose installed on your Ubuntu server:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
```

### Step 1: Build & Launch with Docker Compose
From the project root:
```bash
docker compose up -d --build
```

### Step 2: Verify Container Health
Check that the container is healthy and listening on port 3000:
```bash
docker ps
```
You should see:
```text
CONTAINER ID   IMAGE                           STATUS                    PORTS
a1b2c3d4e5f6   wrike-timesheet-app:latest      Up 25 seconds (healthy)   0.0.0.0:3000->3000/tcp
```

### Step 3: View Container Logs
```bash
docker compose logs -f
```

---

## Intranet & Hospital Network Configuration

1. **Firewall (UFW)**:
   Ensure ports 80 and 443 are open to client devices:
   ```bash
   sudo ufw allow 'Nginx Full'
   sudo ufw reload
   ```

2. **Mobile Device Access**:
   Field technicians on hospital Wi-Fi or internal VPN can navigate to:
   `http://<SERVER_INTERNAL_IP>` or `https://timesheet.hospital.internal`
   
   Once loaded, technicians can tap **"Get the App"** in the navigation bar to install the app icon onto their iOS or Android home screen for instant offline access.
