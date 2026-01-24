# Google App Engine Correction Rules

Copy this file to `.claude/rules/google-app-engine.md` in your project.

## Cloud SQL Connection

**WRONG** - TCP connection (won't work in Standard):
```python
DATABASES = {
    'default': {
        'HOST': '10.0.0.1',  # Private IP won't work
        'PORT': '5432',
    }
}
```

**CORRECT** - Unix socket:
```python
DATABASES = {
    'default': {
        'HOST': f"/cloudsql/{os.environ['CLOUD_SQL_CONNECTION_NAME']}",
        'PORT': '',  # Empty for Unix socket
    }
}
```

**CRITICAL**: Also requires in app.yaml:
```yaml
beta_settings:
  cloud_sql_instances: "project:region:instance"
```

---

## app.yaml Handler Order

**WRONG** - Catch-all before static:
```yaml
handlers:
  - url: /.*
    script: auto
  - url: /static
    static_dir: staticfiles/
```

**CORRECT** - Static before catch-all:
```yaml
handlers:
  - url: /static
    static_dir: staticfiles/
  - url: /.*
    script: auto
```

---

## Environment Detection

**WRONG** - Checking DEBUG or other settings:
```python
if DEBUG:
    # local
else:
    # production
```

**CORRECT** - Use GAE_APPLICATION:
```python
if os.getenv('GAE_APPLICATION'):
    # Running on App Engine
else:
    # Local development
```

---

## Secrets in app.yaml

**WRONG** - Secrets in env_variables:
```yaml
env_variables:
  SECRET_KEY: "actual-secret-key-here"
  DB_PASSWORD: "database-password"
```

**CORRECT** - Use Secret Manager:
```python
from google.cloud import secretmanager

def get_secret(secret_id):
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{os.environ['GOOGLE_CLOUD_PROJECT']}/secrets/{secret_id}/versions/latest"
    return client.access_secret_version(name=name).payload.data.decode("UTF-8")

SECRET_KEY = get_secret('django-secret-key')
```

---

## Instance Class for Django

**WRONG** - F1 (256MB) for Django:
```yaml
instance_class: F1  # Will cause memory errors
```

**CORRECT** - F2 minimum:
```yaml
instance_class: F2  # 512MB - sufficient for most Django apps
```

---

## Service Worker Syntax (Legacy)

**WRONG** - Old service worker format:
```yaml
handlers:
  - url: /.*
    script: main.app  # Legacy format
```

**CORRECT** - Modern entrypoint:
```yaml
entrypoint: gunicorn -b :$PORT myproject.wsgi:application

handlers:
  - url: /.*
    script: auto
```

---

## Python Runtime

**WRONG** - Deprecated runtimes:
```yaml
runtime: python27  # End of life
runtime: python37  # Deprecated
```

**CORRECT** - Current runtimes:
```yaml
runtime: python312  # Recommended
# Also supported: python311, python310, python39, python38
```

---

## HTTPS Enforcement

**WRONG** - Missing secure setting:
```yaml
handlers:
  - url: /.*
    script: auto
    # No secure setting - allows HTTP
```

**CORRECT** - Always enforce HTTPS:
```yaml
handlers:
  - url: /.*
    script: auto
    secure: always  # Redirects HTTP to HTTPS
```

---

## Warmup Requests

**WRONG** - No warmup handling:
```yaml
# Missing warmup configuration
```

**CORRECT** - Enable warmup to reduce cold starts:
```yaml
inbound_services:
  - warmup
```

```python
# urls.py
path('_ah/warmup', warmup_view),

# views.py
def warmup_view(request):
    from django.db import connection
    connection.ensure_connection()
    return HttpResponse('ok')
```
