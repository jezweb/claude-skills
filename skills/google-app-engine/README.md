# Google App Engine Skill

Deploy Python applications to Google App Engine Standard and Flexible environments.

## Auto-Trigger Keywords

This skill activates when discussing:

### Platform & Services
- Google App Engine, GAE, App Engine Standard, App Engine Flexible
- app.yaml, dispatch.yaml, cron.yaml, queue.yaml
- gcloud app deploy, gcloud app logs
- appspot.com, App Engine service

### Configuration
- instance_class, F1, F2, F4, F4_1G
- automatic_scaling, basic_scaling, manual_scaling
- min_instances, max_instances
- beta_settings, cloud_sql_instances
- handlers, static_dir, script: auto

### Cloud SQL Integration
- Cloud SQL socket, /cloudsql/, Unix socket connection
- Cloud SQL Proxy, cloud-sql-proxy
- GAE_APPLICATION environment variable

### Static Files & Storage
- Cloud Storage static files, GS_BUCKET_NAME
- django-storages google, GoogleCloudStorage
- collectstatic App Engine

### Environment & Secrets
- Secret Manager App Engine, get_secret
- env_variables app.yaml
- GOOGLE_CLOUD_PROJECT

### Common Errors
- 502 Bad Gateway App Engine
- cold start timeout
- Exceeded soft memory limit
- DeadlineExceededError
- Connection refused Cloud SQL
- request timeout 60 seconds

### Deployment
- gcloud app deploy
- --no-promote, --version
- traffic splitting, versions migrate
- warmup requests, /_ah/warmup
- health check, /_ah/health

## Composable With

- **django**: Framework patterns, ORM, admin
- **flask**: Lightweight Python framework
- **fastapi**: Modern async API framework

## Use Cases

1. Deploy Django/Flask/FastAPI to App Engine
2. Configure Cloud SQL connections
3. Set up static file serving with Cloud Storage
4. Configure scaling for traffic patterns
5. Manage secrets securely
6. Set up multi-service architecture
