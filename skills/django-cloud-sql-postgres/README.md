# Django on Google Cloud SQL PostgreSQL

Deploy Django applications on Google App Engine Standard with Cloud SQL PostgreSQL using Unix socket connections.

## When to Use This Skill

This skill should be activated when:

- Deploying Django to Google App Engine Standard
- Connecting Django to Cloud SQL PostgreSQL
- Setting up Unix socket connections for App Engine
- Configuring Cloud SQL Auth Proxy for local development
- Setting up Gunicorn for App Engine
- Troubleshooting database connection issues on GCP

## Keywords

### Technologies
django, google cloud sql, cloud sql postgres, cloud sql postgresql, app engine, google app engine, gae, gcp django, google cloud platform django, python app engine, gunicorn app engine

### Configuration
unix socket, cloudsql socket, /cloudsql/, cloud sql proxy, cloud sql auth proxy, beta_settings, cloud_sql_instances, CONN_MAX_AGE, django databases, psycopg2, pg8000

### Tasks
deploy django gcp, django app engine deploy, django cloud sql setup, django postgres gcp, connect django cloud sql, django unix socket, app.yaml django, gunicorn config django

### Errors
no such file or directory cloudsql, connection refused cloud sql, fatal password authentication failed, too many connections postgres, could not connect to server, django db operationalerror, deadline exceeded error, csrf verification failed appspot

### Related
whitenoise django, secret manager django, iam database authentication, cloud build migrations, django static files app engine

## What This Skill Provides

1. **Production-ready Django settings** - Environment-aware database configuration
2. **App Engine configuration** - Complete app.yaml with Cloud SQL integration
3. **Local development setup** - Cloud SQL Auth Proxy configuration
4. **Connection pooling** - Proper CONN_MAX_AGE settings
5. **12 documented issues** - Common errors and their solutions
6. **Templates** - settings.py, app.yaml, requirements.txt snippets
7. **Security patterns** - Secret Manager integration, IAM authentication

## Quick Reference

### Unix Socket Path Format
```
/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

### Required app.yaml Setting
```yaml
beta_settings:
  cloud_sql_instances: "project-id:region:instance-name"
```

### Django Database Configuration
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ['DB_NAME'],
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': f"/cloudsql/{os.environ['CLOUD_SQL_CONNECTION_NAME']}",
        'PORT': '',  # Empty for Unix socket
        'CONN_MAX_AGE': 60,
    }
}
```

## Resources

- `templates/` - Ready-to-use configuration files
- `references/` - Detailed setup guides
- `rules/` - Correction rules for common mistakes

## Version

- **Skill Version**: 1.0.0
- **Last Updated**: 2026-01-24
- **Django**: 5.1+
- **Cloud SQL Auth Proxy**: 2.14.1
