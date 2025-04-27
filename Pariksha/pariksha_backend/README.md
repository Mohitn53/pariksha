# Pariksha Backend

A Django REST Framework backend for the Pariksha online testing platform.

## Features

- User authentication and authorization with JWT
- Test creation and management
- Question management with multiple choice options
- Test taking and result tracking
- Detailed analytics and performance tracking

## Prerequisites

- Python 3.8+
- PostgreSQL
- Supabase account (for database hosting)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd pariksha_backend
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the project root with the following variables:
```
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=your_supabase_host
DB_PORT=5432
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

5. Run migrations:
```bash
python manage.py makemigrations
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
- POST `/api/users/register/` - Register a new user
- POST `/api/users/login/` - Login and get JWT tokens
- POST `/api/users/token/refresh/` - Refresh JWT token
- POST `/api/users/logout/` - Logout and blacklist token
- GET/PUT `/api/users/profile/` - Get or update user profile

### Tests
- GET `/api/tests/` - List all tests
- POST `/api/tests/` - Create a new test
- GET `/api/tests/{id}/` - Get test details
- PUT `/api/tests/{id}/` - Update test
- DELETE `/api/tests/{id}/` - Delete test
- POST `/api/tests/{id}/access_test/` - Access a private test with code
- GET/POST `/api/tests/{id}/questions/` - List/Create questions for a test

### Results
- GET `/api/results/` - List user's test results
- POST `/api/results/` - Submit test results
- GET `/api/results/{id}/` - Get detailed test result
- GET `/api/results/{id}/responses/` - Get question responses for a test result

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 