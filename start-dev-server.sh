#!/bin/bash

# Start development server script
# This script starts the development server for the application

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Display header
echo -e "${BLUE}${BOLD}=================================${NC}"
echo -e "${BLUE}${BOLD}   Development Server Starter    ${NC}"
echo -e "${BLUE}${BOLD}=================================${NC}"

# Function to log messages
function log {
  local level=$1
  local message=$2
  local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  
  case "$level" in
    "INFO")
      echo -e "${timestamp} ${GREEN}[INFO]${NC} $message"
      ;;
    "DEBUG")
      echo -e "${timestamp} ${CYAN}[DEBUG]${NC} $message"
      ;;
    "WARN")
      echo -e "${timestamp} ${YELLOW}[WARN]${NC} $message"
      ;;
    "ERROR")
      echo -e "${timestamp} ${RED}[ERROR]${NC} $message"
      ;;
    *)
      echo -e "${timestamp} [$level] $message"
      ;;
  esac
}

# Function to display usage
function show_usage {
  echo -e "${YELLOW}${BOLD}Usage:${NC}"
  echo -e "  ./start-dev-server.sh [option]"
  echo -e ""
  echo -e "${YELLOW}${BOLD}Options:${NC}"
  echo -e "  ${GREEN}frontend${NC}     Start only the frontend server (Vite)"
  echo -e "  ${GREEN}api${NC}          Start only the API server"
  echo -e "  ${GREEN}all${NC}          Start both frontend and API servers (default)"
  echo -e "  ${GREEN}help${NC}         Show this help message"
  echo -e ""
  echo -e "${YELLOW}${BOLD}Examples:${NC}"
  echo -e "  ./start-dev-server.sh all"
  echo -e "  ./start-dev-server.sh frontend"
  echo -e "  ./start-dev-server.sh api"
  echo -e ""
}

# Parse arguments
SERVER_TYPE="all"
if [ $# -gt 0 ]; then
  case "$1" in
    frontend|api|all|help)
      SERVER_TYPE="$1"
      ;;
    *)
      log "ERROR" "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
fi

# Show help if requested
if [ "$SERVER_TYPE" = "help" ]; then
  show_usage
  exit 0
fi

# Make the script executable
chmod +x "$0"

# Start the server(s)
case "$SERVER_TYPE" in
  frontend)
    log "INFO" "Starting frontend server (Vite)..."
    log "INFO" "Command: npm run dev"
    npm run dev
    ;;
  api)
    log "INFO" "Starting API server..."
    log "INFO" "Command: npm run api"
    npm run api
    ;;
  all)
    log "INFO" "Starting both frontend and API servers..."
    log "INFO" "Command: npm run dev:all"
    npm run dev:all
    ;;
esac

# This point is reached if the server is stopped
log "INFO" "Server stopped"
