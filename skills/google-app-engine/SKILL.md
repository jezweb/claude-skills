---
name: google-app-engine
description: |
  Deploy Python applications to Google App Engine Standard/Flexible. Covers app.yaml configuration, Cloud SQL socket connections, Cloud Storage for static files, scaling settings, and environment variables.

  Use when: deploying to App Engine, configuring app.yaml, connecting Cloud SQL, setting up static file serving, or troubleshooting 502 errors, cold starts, or memory limits.
---

# Google App Engine

**Status**: Production Ready
**Last Updated**: 2026-01-24
**Dependencies**: Google Cloud SDK (gcloud CLI)
**Skill Version**: 1.0.0

---

## Quick Start (10 Minutes)

### 1. Prerequisites

```bash
# Install Google Cloud SDK
# macOS
brew install google-cloud-sdk

# Or download from https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable appengine.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. Create app.yaml

```yaml
# app.yaml - Standard Environment (Python 3.12)
runtime: python312
instance_class: F2

env_variables:
  DJANGO_SETTINGS_MODULE: "myproject.settings.production"

handlers:
  # Static files (served directly by App Engine)
  - url: /static
    static_dir: staticfiles/
    secure: always

  # All other requests go to the app
  - url: /.*
    script: auto
    secure: always

automatic_scaling:
  min_instances: 0
  max_instances: 10
  target_cpu_utilization: 0.65
```

### 3. Deploy

```bash
# Deploy to App Engine
gcloud app deploy

# Deploy with specific version
gcloud app deploy --version=v1 --no-promote

# View logs
gcloud app logs tail -s default
```

---

## Standard vs Flexible Environment

### Standard Environment (Recommended for Most Apps)

**Use when**: Building typical web apps, APIs, or services that fit within runtime constraints.

| Aspect | Standard |
|--------|----------|
| **Startup** | Fast (milliseconds) |
| **Scaling** | Scale to zero |
| **Pricing** | Pay per request |
| **Runtimes** | Python 3.8-3.12 |
| **Instance Classes** | F1, F2, F4, F4_1G |
| **Max Request** | 60 seconds |
| **Background** | Cloud Tasks only |

```yaml
# app.yaml - Standard
runtime: python312
instance_class: F2
```

### Flexible Environment

**Use when**: Need custom runtimes, Docker, longer request timeouts, or background threads.

| Aspect | Flexible |
|--------|----------|
| **Startup** | Slower (minutes) |
| **Scaling** | Min 1 instance |
| **Pricing** | Per-hour VM |
| **Runtimes** | Any (Docker) |
| **Max Request** | 60 minutes |
| **Background** | Native threads |

```yaml
# app.yaml - Flexible
runtime: python
env: flex

runtime_config:
  runtime_version: "3.12"

resources:
  cpu: 1
  memory_gb: 0.5
  disk_size_gb: 10

automatic_scaling:
  min_num_instances: 1
  max_num_instances: 5
```

**Cost Warning**: Flexible always runs at least 1 instance (~$30-40/month minimum).

---

## Cloud SQL Connection

### Standard Environment (Unix Socket)

App Engine Standard connects to Cloud SQL via Unix sockets, not TCP/IP.

```python
# settings.py
import os

if os.getenv('GAE_APPLICATION'):
    # Production: Cloud SQL via Unix socket
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ['DB_NAME'],
            'USER': os.environ['DB_USER'],
            'PASSWORD': os.environ['DB_PASSWORD'],
            'HOST': f"/cloudsql/{os.environ['CLOUD_SQL_CONNECTION_NAME']}",
            'PORT': '',  # Empty for Unix socket
        }
    }
else:
    # Local development: Cloud SQL Proxy or local DB
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'localdb'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': '127.0.0.1',
            'PORT': '5432',
        }
    }
```

```yaml
# app.yaml
env_variables:
  DB_NAME: "mydb"
  DB_USER: "myuser"
  CLOUD_SQL_CONNECTION_NAME: "project:region:instance"

# CRITICAL: Beta settings for Cloud SQL socket
beta_settings:
  cloud_sql_instances: "project:region:instance"
```

**CRITICAL**: The `beta_settings.cloud_sql_instances` enables the Unix socket. Without it, connection fails.

### Local Development with Cloud SQL Proxy

```bash
# Download and run Cloud SQL Proxy
cloud-sql-proxy PROJECT:REGION:INSTANCE --port=5432

# Or use Docker
docker run -p 5432:5432 \
  gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.8.0 \
  PROJECT:REGION:INSTANCE
```

---

## Static Files with Cloud Storage

### Option 1: App Engine Static Handlers (Simple)

```yaml
# app.yaml
handlers:
  - url: /static
    static_dir: staticfiles/
    secure: always
    expiration: "1d"
```

```bash
# Collect static files before deploy
python manage.py collectstatic --noinput
gcloud app deploy
```

**Limitation**: Files bundled with deploy, limited to 32MB per file.

### Option 2: Cloud Storage (Recommended for Production)

```python
# settings.py
from google.cloud import storage

GS_BUCKET_NAME = os.environ.get('GS_BUCKET_NAME')
STATICFILES_STORAGE = 'storages.backends.gcloud.GoogleCloudStorage'
DEFAULT_FILE_STORAGE = 'storages.backends.gcloud.GoogleCloudStorage'

# Or with django-storages
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.gcloud.GoogleCloudStorage",
        "OPTIONS": {
            "bucket_name": GS_BUCKET_NAME,
            "location": "media",
        },
    },
    "staticfiles": {
        "BACKEND": "storages.backends.gcloud.GoogleCloudStorage",
        "OPTIONS": {
            "bucket_name": GS_BUCKET_NAME,
            "location": "static",
        },
    },
}
```

```bash
# Install django-storages
pip install django-storages[google]

# Create bucket with public access for static files
gsutil mb -l us-central1 gs://YOUR_BUCKET_NAME
gsutil iam ch allUsers:objectViewer gs://YOUR_BUCKET_NAME
```

---

## Environment Variables and Secrets

### Simple: app.yaml env_variables

```yaml
# app.yaml - NOT for secrets!
env_variables:
  DJANGO_SETTINGS_MODULE: "myproject.settings.production"
  DEBUG: "False"
```

**Warning**: `app.yaml` is committed to source control. Never put secrets here.

### Production: Secret Manager

```python
# settings.py
from google.cloud import secretmanager

def get_secret(secret_id, version="latest"):
    """Fetch secret from Google Secret Manager."""
    client = secretmanager.SecretManagerServiceClient()
    project_id = os.environ.get('GOOGLE_CLOUD_PROJECT')
    name = f"projects/{project_id}/secrets/{secret_id}/versions/{version}"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")

# Usage
if os.getenv('GAE_APPLICATION'):
    SECRET_KEY = get_secret('django-secret-key')
    DB_PASSWORD = get_secret('db-password')
```

```bash
# Create secrets
echo -n "your-secret-key" | gcloud secrets create django-secret-key --data-file=-
echo -n "db-password" | gcloud secrets create db-password --data-file=-

# Grant App Engine access
gcloud secrets add-iam-policy-binding django-secret-key \
    --member="serviceAccount:YOUR_PROJECT@appspot.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

---

## Scaling Configuration

### Automatic Scaling (Default)

```yaml
automatic_scaling:
  min_instances: 0        # Scale to zero when idle
  max_instances: 10       # Cap maximum instances
  target_cpu_utilization: 0.65
  target_throughput_utilization: 0.6
  max_concurrent_requests: 80
  min_pending_latency: 30ms
  max_pending_latency: automatic
```

### Basic Scaling (Background Tasks)

```yaml
basic_scaling:
  max_instances: 5
  idle_timeout: 5m
```

**Use for**: Services that need to run background work without scaling to zero immediately.

### Manual Scaling (Fixed Instances)

```yaml
manual_scaling:
  instances: 3
```

**Use for**: Predictable workloads, WebSocket connections, or when you need guaranteed capacity.

---

## Instance Classes

| Class | Memory | CPU | Cost/hour |
|-------|--------|-----|-----------|
| F1 | 256 MB | 600 MHz | $0.05 |
| F2 | 512 MB | 1.2 GHz | $0.10 |
| F4 | 1 GB | 2.4 GHz | $0.20 |
| F4_1G | 2 GB | 2.4 GHz | $0.30 |

```yaml
# Recommended for Django
instance_class: F2  # 512MB usually sufficient
```

**Upgrade to F4** if you see memory errors or slow response times.

---

## Known Issues Prevention

This skill prevents **6 documented issues**:

### Issue #1: Cloud SQL Connection Refused
**Error**: `could not connect to server: Connection refused`
**Why It Happens**: Missing `beta_settings.cloud_sql_instances` in app.yaml
**Prevention**: Always include:
```yaml
beta_settings:
  cloud_sql_instances: "project:region:instance"
```

### Issue #2: Static Files 404
**Error**: Static files return 404 after deploy
**Why It Happens**: `collectstatic` not run, or handler order wrong
**Prevention**:
```bash
python manage.py collectstatic --noinput
```
And ensure static handler comes before catch-all:
```yaml
handlers:
  - url: /static
    static_dir: staticfiles/
  - url: /.*
    script: auto
```

### Issue #3: 502 Bad Gateway
**Error**: 502 errors on first request or under load
**Why It Happens**: Cold start timeout, app takes too long to initialize
**Prevention**:
- Optimize app startup (lazy imports, connection pooling)
- Use `min_instances: 1` to avoid cold starts
- Increase `instance_class` for more CPU/memory

### Issue #4: Memory Limit Exceeded
**Error**: `Exceeded soft memory limit` in logs
**Why It Happens**: F1 class (256MB) too small for Django + dependencies
**Prevention**: Use `instance_class: F2` minimum for Django apps

### Issue #5: Request Timeout
**Error**: `DeadlineExceededError` after 60 seconds
**Why It Happens**: Standard environment has 60s request limit
**Prevention**:
- Move long tasks to Cloud Tasks
- Use Flexible environment for longer timeouts
- Optimize database queries

### Issue #6: Secret Key in Source Control
**Error**: Django `SECRET_KEY` exposed in git history
**Why It Happens**: Putting secrets in `app.yaml` env_variables
**Prevention**: Use Secret Manager (see Environment Variables section)

---

## Deployment Commands

```bash
# Deploy default service
gcloud app deploy

# Deploy specific service
gcloud app deploy app.yaml --service=api

# Deploy without promoting (for testing)
gcloud app deploy --version=v2 --no-promote

# Split traffic between versions
gcloud app services set-traffic default --splits=v1=0.5,v2=0.5

# Promote version
gcloud app versions migrate v2

# View logs
gcloud app logs tail -s default

# Open app in browser
gcloud app browse

# List versions
gcloud app versions list

# Delete old versions
gcloud app versions delete v1 v2 --quiet
```

---

## Multi-Service Architecture

```
myproject/
├── app.yaml              # Default service
├── api/
│   └── app.yaml          # API service
├── worker/
│   └── app.yaml          # Background worker
└── dispatch.yaml         # URL routing
```

```yaml
# dispatch.yaml
dispatch:
  - url: "*/api/*"
    service: api
  - url: "*/tasks/*"
    service: worker
```

```bash
# Deploy all services
gcloud app deploy app.yaml api/app.yaml worker/app.yaml dispatch.yaml
```

---

## Common Patterns

### Health Check Endpoint

```python
# urls.py
urlpatterns = [
    path('_ah/health', lambda r: HttpResponse('ok')),
    # ... other urls
]
```

```yaml
# app.yaml
liveness_check:
  path: "/_ah/health"
  check_interval_sec: 30
  timeout_sec: 4
  failure_threshold: 2
  success_threshold: 2

readiness_check:
  path: "/_ah/health"
  check_interval_sec: 5
  timeout_sec: 4
  failure_threshold: 2
  success_threshold: 2
```

### Warmup Requests

```yaml
# app.yaml
inbound_services:
  - warmup
```

```python
# urls.py
urlpatterns = [
    path('_ah/warmup', warmup_view),
]

# views.py
def warmup_view(request):
    """Pre-warm caches and connections."""
    from django.db import connection
    connection.ensure_connection()
    return HttpResponse('ok')
```

### HTTPS Redirect

```yaml
# app.yaml
handlers:
  - url: /.*
    script: auto
    secure: always  # Redirects HTTP to HTTPS
```

---

## Local Development

### Using Cloud SQL Proxy

```bash
# Terminal 1: Run Cloud SQL Proxy
cloud-sql-proxy PROJECT:REGION:INSTANCE --port=5432

# Terminal 2: Run Django
export DB_HOST=127.0.0.1
export DB_PORT=5432
python manage.py runserver
```

### Using dev_appserver (Legacy)

```bash
# Not recommended - use Django's runserver instead
dev_appserver.py app.yaml
```

### Environment Detection

```python
# settings.py
import os

# Detect App Engine environment
IS_GAE = os.getenv('GAE_APPLICATION') is not None
IS_GAE_LOCAL = os.getenv('GAE_ENV') == 'localdev'

if IS_GAE:
    DEBUG = False
    ALLOWED_HOSTS = ['.appspot.com', '.your-domain.com']
else:
    DEBUG = True
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']
```

---

## Bundled Resources

### Templates (templates/)

- `app.yaml` - Standard environment configuration
- `app-flex.yaml` - Flexible environment configuration
- `requirements.txt` - Common dependencies for App Engine

### References (references/)

- `instance-classes.md` - Detailed instance class comparison
- `common-errors.md` - Error messages and solutions

---

## Official Documentation

- **App Engine Python**: https://cloud.google.com/appengine/docs/standard/python3
- **app.yaml Reference**: https://cloud.google.com/appengine/docs/standard/reference/app-yaml
- **Cloud SQL**: https://cloud.google.com/sql/docs/postgres/connect-app-engine-standard
- **Secret Manager**: https://cloud.google.com/secret-manager/docs
- **Scaling**: https://cloud.google.com/appengine/docs/standard/how-instances-are-managed

---

## Dependencies

```
# requirements.txt
gunicorn>=21.0.0
google-cloud-secret-manager>=2.16.0
google-cloud-storage>=2.10.0
django-storages[google]>=1.14.0
psycopg2-binary>=2.9.9  # For PostgreSQL
```

---

## Production Checklist

- [ ] `SECRET_KEY` in Secret Manager (not app.yaml)
- [ ] `DEBUG = False` in production settings
- [ ] `ALLOWED_HOSTS` configured for your domain
- [ ] `collectstatic` runs before deploy
- [ ] `beta_settings.cloud_sql_instances` set
- [ ] Instance class appropriate (F2+ for Django)
- [ ] HTTPS enforced (`secure: always`)
- [ ] Health check endpoint configured
- [ ] Error monitoring set up (Cloud Error Reporting)

---

**Last verified**: 2026-01-24 | **Skill version**: 1.0.0
