# Django Cloud SQL PostgreSQL Correction Rules

These rules correct common mistakes when deploying Django to Google App Engine with Cloud SQL PostgreSQL.

## Database Connection Rules

### Rule 1: Unix Socket Path for App Engine

**Wrong (localhost or IP address):**
```python
DATABASES = {
    'default': {
        'HOST': 'localhost',  # Wrong!
        'HOST': '127.0.0.1',  # Wrong!
        'HOST': '10.0.0.1',   # Wrong!
    }
}
```

**Correct (Unix socket path):**
```python
DATABASES = {
    'default': {
        'HOST': f"/cloudsql/{os.environ['CLOUD_SQL_CONNECTION_NAME']}",
        'PORT': '',  # Empty string for socket
    }
}
```

### Rule 2: PORT Must Be Empty for Unix Socket

**Wrong:**
```python
'PORT': '5432',  # Wrong for App Engine
'PORT': 5432,    # Wrong for App Engine
```

**Correct:**
```python
'PORT': '',  # Empty string for Unix socket
```

### Rule 3: Never Hardcode Connection Credentials

**Wrong:**
```python
DATABASES = {
    'default': {
        'PASSWORD': 'my-secret-password',  # Never hardcode!
        'HOST': '/cloudsql/my-project:us-central1:instance',  # Avoid
    }
}
```

**Correct:**
```python
DATABASES = {
    'default': {
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': f"/cloudsql/{os.environ['CLOUD_SQL_CONNECTION_NAME']}",
    }
}
```

## app.yaml Rules

### Rule 4: Always Include beta_settings

**Wrong (missing beta_settings):**
```yaml
runtime: python310
entrypoint: gunicorn myproject.wsgi
```

**Correct:**
```yaml
runtime: python310
entrypoint: gunicorn -b :$PORT myproject.wsgi:application

beta_settings:
  cloud_sql_instances: "project-id:region:instance-name"
```

### Rule 5: Never Put Passwords in app.yaml

**Wrong:**
```yaml
env_variables:
  DB_PASSWORD: "my-secret-password"  # Never commit passwords!
```

**Correct:**
```yaml
env_variables:
  DB_NAME: "mydb"
  DB_USER: "postgres"
  # Set DB_PASSWORD at deploy time:
  # gcloud app deploy --set-env-vars="DB_PASSWORD=xxx"
```

### Rule 6: Gunicorn Must Bind to $PORT

**Wrong:**
```yaml
entrypoint: gunicorn myproject.wsgi:application
entrypoint: gunicorn -b :8080 myproject.wsgi:application
```

**Correct:**
```yaml
entrypoint: gunicorn -b :$PORT myproject.wsgi:application
```

## Connection Pooling Rules

### Rule 7: Always Set CONN_MAX_AGE

**Wrong (new connection per request):**
```python
DATABASES = {
    'default': {
        # No CONN_MAX_AGE - creates new connection per request
    }
}
```

**Correct:**
```python
DATABASES = {
    'default': {
        'CONN_MAX_AGE': 60,  # Reuse connections for 60 seconds
    }
}
```

### Rule 8: Never Use CONN_MAX_AGE=None in Serverless

**Wrong:**
```python
'CONN_MAX_AGE': None,  # Unlimited lifetime - will exhaust pool!
```

**Correct:**
```python
'CONN_MAX_AGE': 60,  # 30-120 seconds is typical
```

## Security Rules

### Rule 9: Add CSRF Trusted Origins

**Wrong (missing trusted origins):**
```python
# CSRF will fail on appspot.com
```

**Correct:**
```python
CSRF_TRUSTED_ORIGINS = [
    'https://*.appspot.com',
    'https://*.run.app',
]
```

### Rule 10: Use Environment Variables for SECRET_KEY

**Wrong:**
```python
SECRET_KEY = 'django-insecure-abc123...'  # Hardcoded!
```

**Correct:**
```python
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-only-fallback')
```

## Static Files Rules

### Rule 11: Always collectstatic Before Deploy

**Wrong workflow:**
```bash
gcloud app deploy  # Static files won't work!
```

**Correct workflow:**
```bash
python manage.py collectstatic --noinput
gcloud app deploy
```

### Rule 12: Include Static Handler in app.yaml

**Wrong (all requests go to Django):**
```yaml
handlers:
  - url: /.*
    script: auto
```

**Correct:**
```yaml
handlers:
  - url: /static
    static_dir: static/
    secure: always
  - url: /.*
    script: auto
    secure: always
```

## Gunicorn Rules

### Rule 13: Set Timeout Below 60 Seconds

**Wrong:**
```yaml
entrypoint: gunicorn -t 120 ...  # App Engine will kill at 60s
```

**Correct:**
```yaml
entrypoint: gunicorn -t 55 ...  # Leave buffer for App Engine
```

### Rule 14: Match Workers to Instance Class

**Wrong (too many workers for F1):**
```yaml
instance_class: F1
entrypoint: gunicorn -w 4 ...  # F1 can't handle 4 workers
```

**Correct:**
```yaml
instance_class: F2  # F2 supports 2 workers
entrypoint: gunicorn -w 2 -t 55 --threads 4 ...
```

## Environment Detection Rules

### Rule 15: Detect App Engine Environment

**Wrong (checking DEBUG or NODE_ENV):**
```python
if DEBUG:  # Wrong - might be True on App Engine for testing
if os.environ.get('NODE_ENV') == 'production':  # Wrong context
```

**Correct:**
```python
IS_APP_ENGINE = os.getenv('GAE_APPLICATION', None)

if IS_APP_ENGINE:
    # Production settings
else:
    # Local development settings
```

## Package Version Rules

### Rule 16: Use psycopg2-binary, Not psycopg2

**Wrong (requires libpq-dev on build):**
```
psycopg2>=2.9.9  # Needs compilation
```

**Correct:**
```
psycopg2-binary>=2.9.9  # Pre-compiled
```

---

**Last Updated**: 2026-01-24
**Applies To**: Django 5.x, App Engine Standard (Python 3.10+), Cloud SQL PostgreSQL
