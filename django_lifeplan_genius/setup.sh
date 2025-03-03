#!/bin/bash

# Initialize package structure
echo "Initializing package structure..."
./init_packages.sh

# Create and activate virtual environment
echo "Creating virtual environment..."
python -m venv venv
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run migrations
echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate

# Create superuser
echo "Creating superuser..."
python manage.py createsuperuser

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Setup complete! You can now run the server with ./run_server.sh"
