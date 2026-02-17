# Deployment Guide for Cockpit OS

This guide will walk you through deploying your Cockpit OS application to a VPS (Virtual Private Server), separating the frontend (app) and backend (server).

**Domains:**
- Frontend: `cockpit.ripun.site`
- Backend API: `cognode.ripun.site`

## Prerequisites

- A VPS (Ubuntu 20.04/22.04 LTS recommended) with root or sudo access.
- A GitHub account.
- Domain names pointed to your VPS IP address (A records).

---

## Part 1: Push Code to GitHub

First, you need to get your code onto GitHub.

1.  **Initialize Git (if not already done)**
    Open your terminal in the project root (`e:\Projects\COCKPIT-OS`):
    ```bash
    git init
    ```

2.  **Create a .gitignore file in the root**
    Create a file named `.gitignore` in the root directory with the following content:
    ```
    node_modules
    .env
    .DS_Store
    ```

3.  **Commit your code**
    ```bash
    git add .
    git commit -m "Initial commit for deployment"
    ```

4.  **Push to GitHub**
    - Go to [GitHub](https://github.com) and create a valid new repository (e.g., `cockpit-os`).
    - Copy the repository URL.
    - Run the following commands in your terminal:
    ```bash
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/cockpit-os.git
    git push -u origin main
    ```

---

## Part 2: Prepare the VPS

Log in to your VPS via SSH:
```bash
ssh root@YOUR_VPS_IP
```

1.  **Update System**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

2.  **Install Node.js (via NVM)**
    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    source ~/.bashrc
    nvm install 20
    nvm use 20
    nvm alias default 20
    ```

3.  **Install PM2 (Process Manager)**
    ```bash
    npm install -g pm2
    ```

4.  **Install Nginx (Web Server)**
    ```bash
    sudo apt install nginx -y
    ```

5.  **Install Certbot (SSL)**
    ```bash
    sudo apt install certbot python3-certbot-nginx -y
    ```

---

## Part 3: Deploy the Backend (Server)

1.  **Clone the Repository**
    ```bash
    cd /var/www
    git clone https://github.com/YOUR_USERNAME/cockpit-os.git
    cd cockpit-os/server
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file with your production values:
    ```bash
    nano .env
    ```
    Paste your production configuration. **Crucially**:
    - `PORT=9100`
    - `API_PUBLIC_URL=https://cognode.ripun.site`
    - `CORS_ORIGIN=https://cockpit.ripun.site`
    - `DATABASE_URL=...` (Your production DB URL)
    - `SMTP_HOST=smtppro.zoho.in`
    - ...other keys...

4.  **Build the Server**
    ```bash
    npm run build
    ```

5.  **Start with PM2**
    ```bash
    pm2 start dist/main.js --name "cockpit-server"
    ```

---

## Part 4: Deploy the Frontend (App)

1.  **Navigate to App Directory**
    ```bash
    cd ../app
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env.local` file:
    ```bash
    nano .env.local
    ```
    Paste your production configuration:
    ```bash
    NEXT_PUBLIC_API_BASE_URL=https://cognode.ripun.site
    # Add any other public vars
    ```

4.  **Build the App**
    ```bash
    npm run build
    ```

5.  **Start with PM2**
    ```bash
    pm2 start npm --name "cockpit-app" -- start -- -p 3000
    ```

6.  **Save PM2 List**
    ```bash
    pm2 save
    pm2 startup
    ```

---

## Part 5: Configure Nginx & SSL

1.  **Configure Backend Domain (`cognode.ripun.site`)**
    Create a config file:
    ```bash
    sudo nano /etc/nginx/sites-available/cognode.ripun.site
    ```
    Content:
    ```nginx
    server {
        server_name cognode.ripun.site;

        location / {
            proxy_pass http://localhost:9100;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

2.  **Configure Frontend Domain (`cockpit.ripun.site`)**
    Create a config file:
    ```bash
    sudo nano /etc/nginx/sites-available/cockpit.ripun.site
    ```
    Content:
    ```nginx
    server {
        server_name cockpit.ripun.site;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  **Enable Sites**
    ```bash
    sudo ln -s /etc/nginx/sites-available/cognode.ripun.site /etc/nginx/sites-enabled/
    sudo ln -s /etc/nginx/sites-available/cockpit.ripun.site /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

4.  **Secure with SSL (Certbot)**
    ```bash
    sudo certbot --nginx -d cognode.ripun.site
    sudo certbot --nginx -d cockpit.ripun.site
    ```

---

## Verification

- Visit `https://cockpit.ripun.site` - You should see your application.
- Visit `https://cognode.ripun.site/docs` - You should see your Swagger API docs.
