# Cloud SQL Auth Proxy Setup

The Cloud SQL Auth Proxy provides secure connections to Cloud SQL from your local development machine without needing to whitelist IP addresses or manage SSL certificates.

## Installation

### macOS (Homebrew)

```bash
brew install cloud-sql-proxy
```

### macOS (Direct Download)

```bash
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.1/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy
sudo mv cloud-sql-proxy /usr/local/bin/
```

### Linux (x86_64)

```bash
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.1/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy
sudo mv cloud-sql-proxy /usr/local/bin/
```

### Linux (ARM64)

```bash
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.1/cloud-sql-proxy.linux.arm64
chmod +x cloud-sql-proxy
sudo mv cloud-sql-proxy /usr/local/bin/
```

### Windows

Download from: https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.1/cloud-sql-proxy.x64.exe

## Authentication

Before running the proxy, authenticate with Google Cloud:

```bash
# Option 1: Use default application credentials (recommended for dev)
gcloud auth application-default login

# Option 2: Use a service account key file
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

## Running the Proxy

### Basic Usage

```bash
# Connect to a single instance
cloud-sql-proxy PROJECT_ID:REGION:INSTANCE_NAME

# With explicit port
cloud-sql-proxy PROJECT_ID:REGION:INSTANCE_NAME --port=5432

# Run in background
cloud-sql-proxy PROJECT_ID:REGION:INSTANCE_NAME &
```

### Multiple Instances

```bash
# Connect to multiple instances on different ports
cloud-sql-proxy \
  PROJECT_ID:REGION:INSTANCE1 \
  PROJECT_ID:REGION:INSTANCE2?port=5433
```

### With Unix Socket (Matches App Engine)

```bash
# Create socket directory
mkdir -p /tmp/cloudsql

# Run with Unix socket (exactly like App Engine)
cloud-sql-proxy --unix-socket=/tmp/cloudsql PROJECT_ID:REGION:INSTANCE_NAME
```

Then configure Django to use the socket:
```python
DATABASES = {
    'default': {
        'HOST': '/tmp/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME',
        'PORT': '',  # Empty for socket
    }
}
```

## Common Issues

### Error: "dial unix: connect: connection refused"

The proxy is not running or failed to start.

**Solution:**
1. Check if proxy is running: `ps aux | grep cloud-sql-proxy`
2. Verify instance name: `gcloud sql instances list`
3. Check authentication: `gcloud auth application-default print-access-token`

### Error: "Error 403: Access denied"

Missing IAM permissions.

**Solution:**
```bash
# Grant Cloud SQL Client role to your user
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="user:YOUR_EMAIL" \
  --role="roles/cloudsql.client"
```

### Error: "connection refused" on port 5432

Port 5432 might be in use by a local PostgreSQL installation.

**Solution:**
```bash
# Check what's using port 5432
lsof -i :5432

# Use a different port
cloud-sql-proxy PROJECT:REGION:INSTANCE --port=5433
```

Then update `DB_PORT=5433` in your environment.

### Proxy Crashes When Computer Sleeps

The proxy doesn't handle network changes gracefully.

**Solution:**
Create a wrapper script that auto-restarts:
```bash
#!/bin/bash
while true; do
  cloud-sql-proxy PROJECT:REGION:INSTANCE
  echo "Proxy exited, restarting in 5s..."
  sleep 5
done
```

## Development Workflow

### Terminal Setup (3 terminals)

**Terminal 1: Cloud SQL Proxy**
```bash
cloud-sql-proxy PROJECT:REGION:INSTANCE
# Keep running...
```

**Terminal 2: Django Server**
```bash
export DB_NAME=mydb
export DB_USER=postgres
export DB_PASSWORD=xxx
python manage.py runserver
```

**Terminal 3: Django Commands**
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py shell
```

### Using a .env File

Create `.env` in project root:
```env
DB_NAME=mydb
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=127.0.0.1
DB_PORT=5432
DEBUG=True
```

Load with python-dotenv:
```python
# settings.py
from dotenv import load_dotenv
load_dotenv()
```

## Proxy Version

As of 2026-01-24, the latest version is **v2.14.1**.

Check for updates: https://github.com/GoogleCloudPlatform/cloud-sql-proxy/releases

## Official Documentation

- https://cloud.google.com/sql/docs/postgres/connect-auth-proxy
- https://github.com/GoogleCloudPlatform/cloud-sql-proxy
