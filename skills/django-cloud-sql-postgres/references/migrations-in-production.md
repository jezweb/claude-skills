# Running Django Migrations in Production

Running migrations on Cloud SQL requires careful planning. Unlike local development, you can't simply run `python manage.py migrate` during App Engine deployment.

## The Problem

App Engine deployments don't provide a hook for running migrations:
- `entrypoint` runs for every request (not suitable for one-time migrations)
- No pre-deploy or post-deploy hooks
- Database might not be accessible from Cloud Build by default

## Solution Options

### Option 1: Local with Cloud SQL Proxy (Simplest)

**Best for:** Small projects, infrequent deployments

```bash
# 1. Start Cloud SQL Proxy
cloud-sql-proxy PROJECT:REGION:INSTANCE &

# 2. Set environment variables
export DB_NAME=mydb
export DB_USER=postgres
export DB_PASSWORD=xxx

# 3. Run migrations
python manage.py migrate

# 4. Deploy (without migrations)
gcloud app deploy
```

**Pros:**
- Simple, no additional setup
- Full visibility into migration output
- Can test migration locally first

**Cons:**
- Manual process
- Requires network access to Cloud SQL

### Option 2: Cloud Build (Recommended for Teams)

**Best for:** CI/CD pipelines, team deployments

**cloudbuild.yaml:**
```yaml
steps:
  # Step 1: Install dependencies
  - name: 'python:3.10'
    entrypoint: 'pip'
    args: ['install', '-r', 'requirements.txt', '--user']

  # Step 2: Run migrations
  - name: 'python:3.10'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        pip install -r requirements.txt
        python manage.py migrate --noinput
    env:
      - 'DB_NAME=mydb'
      - 'DB_USER=postgres'
      - 'DB_HOST=/cloudsql/${_CLOUD_SQL_CONNECTION_NAME}'
      - 'DJANGO_SETTINGS_MODULE=myproject.settings'
    secretEnv: ['DB_PASSWORD', 'SECRET_KEY']

  # Step 3: Collect static files
  - name: 'python:3.10'
    entrypoint: 'python'
    args: ['manage.py', 'collectstatic', '--noinput']

  # Step 4: Deploy to App Engine
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args: ['app', 'deploy', 'app.yaml', '--quiet']

# Enable Cloud SQL connection for Cloud Build
options:
  pool:
    name: 'projects/${PROJECT_ID}/locations/us-central1/workerPools/my-pool'

# Use Secret Manager for sensitive values
availableSecrets:
  secretManager:
    - versionName: 'projects/${PROJECT_ID}/secrets/db-password/versions/latest'
      env: 'DB_PASSWORD'
    - versionName: 'projects/${PROJECT_ID}/secrets/django-secret-key/versions/latest'
      env: 'SECRET_KEY'

substitutions:
  _CLOUD_SQL_CONNECTION_NAME: 'project:region:instance'
```

**Enable Cloud Build to access Cloud SQL:**
```bash
# Get Cloud Build service account
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Grant Cloud SQL Client role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/cloudsql.client"

# Grant Secret Manager access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/secretmanager.secretAccessor"
```

**Create secrets:**
```bash
# Create secrets in Secret Manager
echo -n "your-db-password" | gcloud secrets create db-password --data-file=-
echo -n "your-django-secret-key" | gcloud secrets create django-secret-key --data-file=-
```

**Trigger build:**
```bash
gcloud builds submit --config cloudbuild.yaml
```

### Option 3: Cloud Run Job (For Large Migrations)

**Best for:** Long-running migrations, complex data migrations

```yaml
# cloudrun-migrate.yaml
apiVersion: run.googleapis.com/v1
kind: Job
metadata:
  name: django-migrate
spec:
  template:
    spec:
      containers:
        - image: gcr.io/PROJECT_ID/myapp:latest
          command: ['python', 'manage.py', 'migrate', '--noinput']
          env:
            - name: DB_NAME
              value: mydb
            - name: DB_USER
              value: postgres
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-password
                  key: latest
            - name: CLOUD_SQL_CONNECTION_NAME
              value: project:region:instance
          resources:
            limits:
              memory: 512Mi
              cpu: '1'
      serviceAccountName: my-service-account@project.iam.gserviceaccount.com
```

**Run the job:**
```bash
gcloud run jobs execute django-migrate --region us-central1
```

### Option 4: One-Time Instance (For Emergency Fixes)

**Best for:** Emergency hotfixes, debugging

```bash
# SSH into an App Engine flexible instance (not standard)
# Or use Cloud Shell:

# In Cloud Shell, authenticate and connect
gcloud sql connect INSTANCE_NAME --user=postgres --database=mydb

# Run SQL directly
\i /path/to/migration.sql
```

## Migration Best Practices

### 1. Test Migrations Locally First

```bash
# Create a backup
pg_dump -h 127.0.0.1 -U postgres mydb > backup.sql

# Run migration
python manage.py migrate

# If problems, restore
psql -h 127.0.0.1 -U postgres mydb < backup.sql
```

### 2. Use Reversible Migrations

```python
# migrations/0005_add_field.py
from django.db import migrations

def forward(apps, schema_editor):
    Model = apps.get_model('myapp', 'MyModel')
    Model.objects.filter(status=None).update(status='active')

def reverse(apps, schema_editor):
    pass  # Don't reverse data changes

class Migration(migrations.Migration):
    operations = [
        migrations.AddField(
            model_name='mymodel',
            name='status',
            field=models.CharField(max_length=20, default='active'),
        ),
        migrations.RunPython(forward, reverse),
    ]
```

### 3. Avoid Long-Locked Tables

For large tables, avoid operations that lock the entire table:

```python
# Bad: Adds NOT NULL with default (locks table while backfilling)
migrations.AddField('mymodel', 'field', CharField(null=False, default='x'))

# Good: Three-step process
# 1. Add nullable field
migrations.AddField('mymodel', 'field', CharField(null=True))
# 2. Backfill in batches (RunPython)
# 3. Make non-null
migrations.AlterField('mymodel', 'field', CharField(null=False, default='x'))
```

### 4. Check Migration Status

```bash
# See pending migrations
python manage.py showmigrations

# See migration SQL without running
python manage.py sqlmigrate myapp 0005
```

## Handling Failed Migrations

### Partial Migration Failure

If a migration fails midway:

```bash
# Check which migrations applied
python manage.py showmigrations

# Fake the failed migration if you fixed it manually
python manage.py migrate myapp 0005 --fake

# Or roll back
python manage.py migrate myapp 0004
```

### Database State Mismatch

If Django and database are out of sync:

```bash
# Reset migration history (dangerous!)
python manage.py migrate myapp zero --fake

# Re-create migrations from current model state
python manage.py makemigrations myapp

# Mark as applied without running
python manage.py migrate myapp --fake-initial
```

## Official Documentation

- https://docs.djangoproject.com/en/5.0/topics/migrations/
- https://cloud.google.com/sql/docs/postgres/connect-build
- https://cloud.google.com/build/docs/configuring-builds/create-basic-configuration
