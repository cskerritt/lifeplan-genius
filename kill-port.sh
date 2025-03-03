#!/bin/bash

# Kill process using a specific port
# This script finds and terminates processes using a specified port

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
echo -e "${BLUE}${BOLD}   Port Process Killer          ${NC}"
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
  echo -e "  ./kill-port.sh [port]"
  echo -e ""
  echo -e "${YELLOW}${BOLD}Options:${NC}"
  echo -e "  ${GREEN}port${NC}         The port number to kill processes for (e.g., 3002)"
  echo -e "  ${GREEN}--help${NC}       Show this help message"
  echo -e ""
  echo -e "${YELLOW}${BOLD}Examples:${NC}"
  echo -e "  ./kill-port.sh 3002"
  echo -e "  ./kill-port.sh 5173"
  echo -e ""
}

# Make the script executable
chmod +x "$0"

# Check if no arguments provided or help requested
if [ $# -eq 0 ] || [ "$1" == "--help" ]; then
  show_usage
  exit 0
fi

# Get the port number
PORT=$1

# Validate port number
if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
  log "ERROR" "Invalid port number: $PORT"
  show_usage
  exit 1
fi

log "INFO" "Looking for processes using port $PORT..."

# Find process IDs using the port
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  PIDS=$(lsof -i :$PORT -t)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  PIDS=$(fuser $PORT/tcp 2>/dev/null)
else
  # Other OS
  log "ERROR" "Unsupported operating system: $OSTYPE"
  exit 1
fi

# Check if any processes found
if [ -z "$PIDS" ]; then
  log "INFO" "No processes found using port $PORT"
  exit 0
fi

# Display processes
log "INFO" "Found the following processes using port $PORT:"
for PID in $PIDS; do
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    PROCESS_INFO=$(ps -p $PID -o user,pid,command | tail -n 1)
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    PROCESS_INFO=$(ps -p $PID -o user,pid,cmd | tail -n 1)
  fi
  echo -e "${YELLOW}$PROCESS_INFO${NC}"
done

# Confirm before killing
echo -e ""
read -p "Do you want to kill these processes? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  log "INFO" "Operation cancelled"
  exit 0
fi

# Kill processes
for PID in $PIDS; do
  log "INFO" "Killing process $PID..."
  kill -9 $PID
  if [ $? -eq 0 ]; then
    log "INFO" "Successfully killed process $PID"
  else
    log "ERROR" "Failed to kill process $PID"
  fi
done

log "INFO" "All processes using port $PORT have been terminated"
