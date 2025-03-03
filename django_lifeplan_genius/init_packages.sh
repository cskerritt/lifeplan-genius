#!/bin/bash

# Create __init__.py files in all necessary directories to make them proper Python packages

# Create app directories
mkdir -p accounts
mkdir -p lifecare
mkdir -p api

# Create migrations directories
mkdir -p accounts/migrations
mkdir -p lifecare/migrations
mkdir -p api/migrations

# Create management/commands directories
mkdir -p accounts/management/commands
mkdir -p lifecare/management/commands
mkdir -p api/management/commands

# Create __init__.py files in the app directories
touch accounts/__init__.py
touch lifecare/__init__.py
touch api/__init__.py

# Create __init__.py files in the migrations directories
touch accounts/migrations/__init__.py
touch lifecare/migrations/__init__.py
touch api/migrations/__init__.py

# Create __init__.py files in the management directories
touch accounts/management/__init__.py
touch lifecare/management/__init__.py
touch api/management/__init__.py

# Create __init__.py files in the commands directories
touch accounts/management/commands/__init__.py
touch lifecare/management/commands/__init__.py
touch api/management/commands/__init__.py

echo "Created __init__.py files in all necessary directories."
