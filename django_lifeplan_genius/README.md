# Life Care Plan Genius - Django Backend

This is a Django REST API backend for the Life Care Plan Genius application. It provides a complete API for managing life care plans, including cost calculations, data export, and more.

## Features

- User authentication with JWT tokens
- Life care plan management
- Cost calculations with geographic adjustment
- CPT code lookup
- Age increment support
- Export to Word and Excel

## Prerequisites

- Python 3.8+
- PostgreSQL database
- Virtual environment (recommended)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd django_lifeplan_genius
```

2. Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Configure environment variables:

Create a `.env` file in the project root with the following variables:

```
# Django settings
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database settings
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# CORS settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

5. Run migrations:

```bash
python manage.py migrate
```

6. Create a superuser:

```bash
python manage.py createsuperuser
```

7. Run the development server:

```bash
python manage.py runserver
```

## API Endpoints

### Authentication

- `POST /api/token/`: Obtain JWT token
- `POST /api/token/refresh/`: Refresh JWT token

### Users

- `GET /api/users/`: List users
- `GET /api/users/{id}/`: Get user details
- `GET /api/users/me/`: Get current user details

### Life Care Plans

- `GET /api/plans/`: List life care plans
- `POST /api/plans/`: Create a new life care plan
- `GET /api/plans/{id}/`: Get life care plan details
- `PUT /api/plans/{id}/`: Update a life care plan
- `DELETE /api/plans/{id}/`: Delete a life care plan
- `GET /api/plans/{id}/export_word/`: Export plan to Word
- `GET /api/plans/{id}/export_excel/`: Export plan to Excel

### Care Plan Entries

- `GET /api/entries/`: List care plan entries
- `POST /api/entries/`: Create a new care plan entry
- `GET /api/entries/{id}/`: Get care plan entry details
- `PUT /api/entries/{id}/`: Update a care plan entry
- `DELETE /api/entries/{id}/`: Delete a care plan entry
- `POST /api/entries/calculate_costs/`: Calculate costs for an entry

### Geographic Factors

- `GET /api/geographic-factors/`: List geographic factors
- `GET /api/geographic-factors/{id}/`: Get geographic factor details
- `GET /api/geographic-factors/search/?zip={zip_code}`: Search geographic factors by ZIP code

### CPT Codes

- `GET /api/cpt-codes/`: List CPT codes
- `GET /api/cpt-codes/{code}/`: Get CPT code details
- `GET /api/cpt-codes/validate/?code={cpt_code}`: Validate a CPT code

## Development

### Running Tests

```bash
python manage.py test
```

### Code Style

This project follows PEP 8 style guidelines. You can check your code with:

```bash
flake8
```

## Frontend Integration

This Django backend is designed to work with the React frontend. The frontend should be configured to use the API endpoints provided by this backend.

## License

[MIT License](LICENSE)
