# IAM Database Authentication for Cloud SQL

IAM authentication allows you to connect to Cloud SQL PostgreSQL using Google Cloud IAM credentials instead of database passwords. This is more secure for service-to-service communication.

## Overview

**Benefits:**
- No password management or rotation
- Automatic credential rotation by Google
- Audit trail through Cloud Logging
- Centralized access control via IAM

**Limitations:**
- Only works within Google Cloud (App Engine, Cloud Run, GKE, etc.)
- Cannot be used for local development (use Cloud SQL Proxy with password auth)
- Slightly higher latency due to token exchange

## Setup

### Step 1: Enable IAM Authentication on Cloud SQL Instance

```bash
# Enable IAM authentication flag
gcloud sql instances patch INSTANCE_NAME \
  --database-flags=cloudsql.iam_authentication=on

# Note: This requires a database restart
```

### Step 2: Create IAM Database User

For App Engine default service account:
```bash
gcloud sql users create SERVICE_ACCOUNT@PROJECT_ID.iam \
  --instance=INSTANCE_NAME \
  --type=CLOUD_IAM_SERVICE_ACCOUNT
```

Replace:
- `SERVICE_ACCOUNT` with `PROJECT_ID` (for default App Engine service account)
- `PROJECT_ID` with your GCP project ID

Example:
```bash
# For project "my-project", App Engine service account is:
# my-project@appspot.gserviceaccount.com
gcloud sql users create my-project@appspot.gserviceaccount.com \
  --instance=myinstance \
  --type=CLOUD_IAM_SERVICE_ACCOUNT
```

### Step 3: Grant IAM Permissions

```bash
# Grant Cloud SQL Instance User role (required for IAM auth)
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/cloudsql.instanceUser"

# Grant Cloud SQL Client role (required for connection)
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

### Step 4: Grant Database Permissions

Connect to the database and grant permissions:

```bash
# Connect via Cloud SQL Proxy
cloud-sql-proxy PROJECT:REGION:INSTANCE

# Connect with psql
PGPASSWORD=xxx psql -h 127.0.0.1 -U postgres -d mydb
```

```sql
-- Grant necessary permissions to IAM user
GRANT ALL PRIVILEGES ON DATABASE mydb TO "PROJECT_ID@appspot.gserviceaccount.com";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "PROJECT_ID@appspot.gserviceaccount.com";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "PROJECT_ID@appspot.gserviceaccount.com";

-- For Django migrations
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "PROJECT_ID@appspot.gserviceaccount.com";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "PROJECT_ID@appspot.gserviceaccount.com";
```

### Step 5: Configure Django Settings

```python
import os

# Detect App Engine environment
IS_APP_ENGINE = os.getenv('GAE_APPLICATION', None)

if IS_APP_ENGINE:
    # Production with IAM authentication
    PROJECT_ID = os.environ['GOOGLE_CLOUD_PROJECT']

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ['DB_NAME'],
            'USER': f"{PROJECT_ID}@appspot.gserviceaccount.com",
            'HOST': f"/cloudsql/{os.environ['CLOUD_SQL_CONNECTION_NAME']}",
            'PORT': '',
            # No PASSWORD needed - IAM handles authentication
            'CONN_MAX_AGE': 60,
        }
    }
else:
    # Local development still uses password auth
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'mydb'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': '127.0.0.1',
            'PORT': '5432',
        }
    }
```

### Step 6: Update app.yaml

```yaml
runtime: python310
entrypoint: gunicorn -b :$PORT myproject.wsgi:application

env_variables:
  DB_NAME: "mydb"
  CLOUD_SQL_CONNECTION_NAME: "project-id:region:instance"
  # No DB_USER or DB_PASSWORD needed

beta_settings:
  cloud_sql_instances: "project-id:region:instance"
```

## Troubleshooting

### Error: "FATAL: Cloud SQL IAM user authentication failed"

**Causes:**
1. IAM authentication not enabled on instance
2. Service account not created as IAM database user
3. Missing IAM roles

**Solution:**
```bash
# Verify IAM auth is enabled
gcloud sql instances describe INSTANCE | grep cloudsql.iam_authentication

# Verify IAM user exists
gcloud sql users list --instance=INSTANCE | grep iam

# Check service account roles
gcloud projects get-iam-policy PROJECT --filter="bindings.members:appspot.gserviceaccount.com"
```

### Error: "permission denied for table"

**Cause:** IAM user doesn't have PostgreSQL grants.

**Solution:**
Connect as postgres user and run GRANT commands (see Step 4).

### IAM Auth Works Locally but Fails on App Engine

**Cause:** Different service accounts for local vs App Engine.

**Solution:**
Local development uses your user credentials; App Engine uses the App Engine service account. Ensure the App Engine service account has all required permissions.

## Security Best Practices

1. **Use IAM for production, passwords for dev**
   - IAM removes password management overhead
   - Passwords are simpler for local development

2. **Limit IAM permissions**
   - Only grant necessary roles
   - Use separate service accounts for different services

3. **Audit access**
   - Enable Cloud SQL logging
   - Review IAM audit logs

4. **Rotate service account keys**
   - Avoid key files when possible
   - Use workload identity for GKE

## Official Documentation

- https://cloud.google.com/sql/docs/postgres/iam-logins
- https://cloud.google.com/sql/docs/postgres/iam-authentication
