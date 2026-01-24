# Google App Engine Common Errors

## Connection Errors

### `could not connect to server: Connection refused`

**Cause**: Missing Cloud SQL socket configuration

**Solution**: Add to app.yaml:
```yaml
beta_settings:
  cloud_sql_instances: "project:region:instance"
```

And use Unix socket in settings.py:
```python
'HOST': f"/cloudsql/{os.environ['CLOUD_SQL_CONNECTION_NAME']}"
```

---

### `OperationalError: FATAL: password authentication failed`

**Cause**: Wrong Cloud SQL credentials

**Solution**:
1. Verify user exists: `gcloud sql users list --instance=INSTANCE`
2. Reset password: `gcloud sql users set-password USER --instance=INSTANCE --password=NEW_PASSWORD`
3. Update Secret Manager or env_variables

---

## Memory Errors

### `Exceeded soft memory limit of X MB`

**Cause**: Instance class too small

**Solution**: Upgrade instance class in app.yaml:
```yaml
instance_class: F2   # 512MB (usually sufficient)
instance_class: F4   # 1GB (for heavy apps)
instance_class: F4_1G  # 2GB (maximum)
```

**Tips**:
- Profile memory with `tracemalloc`
- Use streaming for large responses
- Lazy load heavy modules

---

### `Process terminated because the request deadline was exceeded`

**Cause**: Request took longer than 60 seconds (Standard) or 60 minutes (Flexible)

**Solution**:
- Move long tasks to Cloud Tasks
- Optimize slow database queries
- Use Flexible environment for longer timeouts
- Add indexes to database

---

## Deployment Errors

### `ERROR: (gcloud.app.deploy) PERMISSION_DENIED`

**Cause**: Service account lacks permissions

**Solution**:
```bash
# Grant App Engine deployer role
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="user:YOUR_EMAIL" \
  --role="roles/appengine.appAdmin"

# For CI/CD service accounts
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SA_EMAIL" \
  --role="roles/appengine.deployer"
```

---

### `Unable to fetch P4SA`

**Cause**: App Engine not initialized in project

**Solution**:
```bash
gcloud app create --region=us-central1
```

---

## Static File Errors

### Static files return 404

**Cause**: Files not collected or wrong handler path

**Solution**:
1. Run collectstatic:
```bash
python manage.py collectstatic --noinput
```

2. Verify handler order (static before catch-all):
```yaml
handlers:
  - url: /static
    static_dir: staticfiles/
  - url: /.*
    script: auto
```

3. Check STATIC_ROOT matches static_dir:
```python
STATIC_ROOT = 'staticfiles'  # Matches static_dir: staticfiles/
```

---

### `The file size exceeds the maximum allowed size of 32MB`

**Cause**: Static file too large for App Engine bundling

**Solution**: Use Cloud Storage instead:
```python
STATICFILES_STORAGE = 'storages.backends.gcloud.GoogleCloudStorage'
```

---

## 502 Bad Gateway

### Intermittent 502 errors

**Causes**:
1. Cold start timeout
2. App crashes during request
3. Health check failing

**Solutions**:

1. **Reduce cold start time**:
   - Enable warmup requests
   - Use min_instances: 1 (costs more)
   - Optimize imports (lazy loading)

2. **Check logs**:
```bash
gcloud app logs tail -s default
```

3. **Fix health checks**:
```python
# urls.py
path('/_ah/health', lambda r: HttpResponse('ok'))
```

---

## Secret Manager Errors

### `PermissionDenied: Permission denied on resource`

**Cause**: Service account lacks Secret Manager access

**Solution**:
```bash
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

### `NotFound: Secret not found`

**Cause**: Secret doesn't exist or wrong project

**Solution**:
1. List secrets: `gcloud secrets list`
2. Create if missing: `gcloud secrets create SECRET_NAME --data-file=-`
3. Check project: `gcloud config get project`
