"""
Django settings for Cloud SQL PostgreSQL on App Engine.

Copy this database configuration to your settings.py.
Replace 'myproject' with your actual project name.
"""

import os
from pathlib import Path

# =============================================================================
# BASE CONFIGURATION
# =============================================================================

BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = [
    '.appspot.com',
    '.run.app',
    'localhost',
    '127.0.0.1',
]

# CSRF trusted origins for App Engine
CSRF_TRUSTED_ORIGINS = [
    'https://*.appspot.com',
    'https://*.run.app',
]


# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

def get_database_config():
    """
    Return database config based on environment.

    On App Engine: Uses Unix socket at /cloudsql/PROJECT:REGION:INSTANCE
    Locally: Uses Cloud SQL Proxy at 127.0.0.1:5432
    """
    is_app_engine = os.getenv('GAE_APPLICATION', None)

    if is_app_engine:
        # Production: Connect via Unix socket
        return {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ['DB_NAME'],
            'USER': os.environ['DB_USER'],
            'PASSWORD': os.environ['DB_PASSWORD'],
            'HOST': f"/cloudsql/{os.environ['CLOUD_SQL_CONNECTION_NAME']}",
            'PORT': '',  # Empty string for Unix socket
            'CONN_MAX_AGE': 60,  # Connection pooling
            'OPTIONS': {
                'connect_timeout': 10,
            },
        }
    else:
        # Local development: Connect via Cloud SQL Proxy
        return {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'mydb'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': os.environ.get('DB_HOST', '127.0.0.1'),
            'PORT': os.environ.get('DB_PORT', '5432'),
            'CONN_MAX_AGE': 60,
        }


DATABASES = {
    'default': get_database_config()
}


# =============================================================================
# STATIC FILES (with WhiteNoise)
# =============================================================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'static'

# WhiteNoise for static files (add to MIDDLEWARE after SecurityMiddleware)
# MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# =============================================================================
# LOGGING
# =============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',  # Set to DEBUG to see SQL queries
            'propagate': False,
        },
    },
}


# =============================================================================
# ENVIRONMENT VARIABLES REFERENCE
# =============================================================================
"""
Required environment variables:

Production (App Engine - set in app.yaml or via gcloud):
    - DB_NAME: Database name (e.g., 'mydb')
    - DB_USER: Database user (e.g., 'postgres')
    - DB_PASSWORD: Database password (use Secret Manager!)
    - CLOUD_SQL_CONNECTION_NAME: Format 'project:region:instance'
    - SECRET_KEY: Django secret key (use Secret Manager!)

Local development (set in .env or export):
    - DB_NAME: Database name (default: 'mydb')
    - DB_USER: Database user (default: 'postgres')
    - DB_PASSWORD: Database password
    - DB_HOST: Database host (default: '127.0.0.1')
    - DB_PORT: Database port (default: '5432')
    - DEBUG: Set to 'True' for debug mode
"""
