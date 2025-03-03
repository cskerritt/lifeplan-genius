# Migration Guide

This document provides instructions for migrating from the existing React/Supabase application to the new Django-based backend.

## Overview

The migration process involves:

1. Setting up the Django backend
2. Configuring the database connection
3. Migrating data from the existing database
4. Updating the frontend to use the new API endpoints

## Prerequisites

- Access to the existing Supabase database
- Python 3.8+ installed
- PostgreSQL database server
- Node.js and npm (for the frontend)

## Step 1: Set Up the Django Backend

1. Clone this repository:

```bash
git clone <repository-url>
cd django_lifeplan_genius
```

2. Run the setup script:

```bash
./setup.sh
```

This script will:
- Create a virtual environment
- Install dependencies
- Run migrations
- Create a superuser
- Collect static files

## Step 2: Configure Database Connection

1. Update the `.env` file with your database credentials:

```
# Database settings
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# Source database (existing Supabase database)
SOURCE_DB_NAME=supabase_local_db
SOURCE_DB_USER=postgres
SOURCE_DB_PASSWORD=postgres
SOURCE_DB_HOST=localhost
SOURCE_DB_PORT=5432
```

## Step 3: Migrate Data

1. Run the data migration script:

```bash
source venv/bin/activate  # Activate the virtual environment
./migrate_data.py
```

This script will:
- Connect to both the source and destination databases
- Migrate users, geographic factors, CPT codes, life care plans, and care plan entries
- Maintain relationships between entities
- Handle data type conversions

## Step 4: Update Frontend

1. Update API endpoints in the frontend code:

The frontend code needs to be updated to use the new Django API endpoints. Here's a mapping of the old endpoints to the new ones:

| Old Endpoint (Supabase) | New Endpoint (Django) |
|-------------------------|------------------------|
| `/auth/v1/token` | `/api/token/` |
| `/rest/v1/life_care_plans` | `/api/plans/` |
| `/rest/v1/care_plan_entries` | `/api/entries/` |
| `/rest/v1/geographic_factors` | `/api/geographic-factors/` |
| `/rest/v1/cpt_codes` | `/api/cpt-codes/` |

2. Update authentication:

Replace Supabase authentication with JWT authentication:

```javascript
// Old Supabase authentication
const { user, session } = await supabase.auth.signIn({
  email,
  password,
});

// New JWT authentication
const response = await fetch('/api/token/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username,
    password,
  }),
});
const { access, refresh } = await response.json();

// Store tokens
localStorage.setItem('access_token', access);
localStorage.setItem('refresh_token', refresh);
```

3. Update API requests:

```javascript
// Old Supabase request
const { data, error } = await supabase
  .from('life_care_plans')
  .select('*')
  .eq('user_id', userId);

// New Django request
const response = await fetch('/api/plans/', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  },
});
const data = await response.json();
```

## Step 5: Test the Migration

1. Run the Django server:

```bash
./run_server.sh
```

2. Test the API endpoints using a tool like Postman or curl:

```bash
# Get JWT token
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'

# Get life care plans
curl -X GET http://localhost:8000/api/plans/ \
  -H "Authorization: Bearer your_access_token"
```

3. Run the frontend with the updated API endpoints and test the application.

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Verify that the PostgreSQL server is running
2. Check the database credentials in the `.env` file
3. Ensure the database exists and is accessible

### Data Migration Issues

If you encounter issues during data migration:

1. Check the source database connection
2. Verify that the tables exist in the source database
3. Run the migration script with verbose logging:

```bash
./migrate_data.py --verbose
```

### API Endpoint Issues

If you encounter issues with the API endpoints:

1. Check the Django server logs
2. Verify that the JWT token is valid
3. Check the request headers and body

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework Documentation](https://www.django-rest-framework.org/)
- [JWT Authentication Documentation](https://django-rest-framework-simplejwt.readthedocs.io/)
