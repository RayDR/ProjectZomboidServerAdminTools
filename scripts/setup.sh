#!/bin/bash
# PZWebAdmin - Quick Setup Script
# This script helps set up the entire application

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║        PZWebAdmin - Setup Script                         ║"
echo "║        Project Zomboid Web Administration Panel          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "ℹ $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root"
    exit 1
fi

# Check Node.js installation
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
else
    NODE_VERSION=$(node -v)
    print_success "Node.js $NODE_VERSION installed"
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
else
    NPM_VERSION=$(npm -v)
    print_success "npm $NPM_VERSION installed"
fi

# Check if we're in the correct directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "This script must be run from the /opt/pzwebadmin directory"
    exit 1
fi

print_success "Running from correct directory: $(pwd)"
echo ""

# Step 1: Backend Setup
echo "════════════════════════════════════════════════════════════"
echo "Step 1: Backend Setup"
echo "════════════════════════════════════════════════════════════"

cd backend

if [ ! -f ".env" ]; then
    print_warning ".env file not found in backend/"
    print_info "Please create backend/.env with the following variables:"
    echo ""
    cat << 'EOF'
PORT=3000
PZ_NAME=pzdesveladitas
PZ_SERVICE=projectzomboid
PZ_ADMIN_USER=pzadmin
PZ_ENV_SCRIPT=/opt/pzserver/pzenv.sh

PZ_DIR=/opt/pzserver
PZ_LOG_PATH=/opt/pzserver/logs
PZ_MAINTENANCE_LOG_PATH=/opt/pzserver/logs/maintenance.log
PZ_INI_PATH=/home/pzadmin/Zomboid/Server
PZ_SAVE_PATH=/home/pzadmin/Zomboid/Saves/Multiplayer
PZ_STEAMCMD_PATH=/usr/games/steamcmd

PZ_RCON_HOST=127.0.0.1
PZ_RCON_PORT=27015
PZ_RCON_PASSWORD=your_rcon_password
EOF
    echo ""
    read -p "Do you want to create a template .env file now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cat > .env << 'EOF'
PORT=3000
PZ_NAME=pzdesveladitas
PZ_SERVICE=projectzomboid
PZ_ADMIN_USER=pzadmin
PZ_ENV_SCRIPT=/opt/pzserver/pzenv.sh

PZ_DIR=/opt/pzserver
PZ_LOG_PATH=/opt/pzserver/logs
PZ_MAINTENANCE_LOG_PATH=/opt/pzserver/logs/maintenance.log
PZ_INI_PATH=/home/pzadmin/Zomboid/Server
PZ_SAVE_PATH=/home/pzadmin/Zomboid/Saves/Multiplayer
PZ_STEAMCMD_PATH=/usr/games/steamcmd

PZ_RCON_HOST=127.0.0.1
PZ_RCON_PORT=27015
PZ_RCON_PASSWORD=changeme
EOF
        print_success "Created backend/.env template"
        print_warning "Please edit backend/.env and update the values"
        read -p "Press Enter when ready to continue..."
    else
        print_error "Backend .env file is required. Exiting."
        exit 1
    fi
else
    print_success "Backend .env file found"
fi

# Install backend dependencies
echo ""
print_info "Installing backend dependencies..."
if npm install; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Create database directory
if [ ! -d "db" ]; then
    mkdir -p db
    print_success "Created db directory"
fi

cd ..

# Step 2: Frontend Setup
echo ""
echo "════════════════════════════════════════════════════════════"
echo "Step 2: Frontend Setup"
echo "════════════════════════════════════════════════════════════"

cd frontend

if [ ! -f ".env.local" ]; then
    print_warning ".env.local file not found in frontend/"
    read -p "Enter your backend API URL (default: http://localhost:3000/api): " API_URL
    API_URL=${API_URL:-http://localhost:3000/api}
    echo "VITE_API_URL=$API_URL" > .env.local
    print_success "Created frontend/.env.local"
else
    print_success "Frontend .env.local file found"
fi

# Install frontend dependencies
echo ""
print_info "Installing frontend dependencies..."
if npm install; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

cd ..

# Step 3: Permissions Setup
echo ""
echo "════════════════════════════════════════════════════════════"
echo "Step 3: Sudo Permissions Setup"
echo "════════════════════════════════════════════════════════════"

print_info "Setting up sudo permissions for server management..."
echo ""
print_warning "This requires sudo access. You will be prompted for your password."
read -p "Do you want to configure sudo permissions now? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "scripts/setup-sudoers.sh" ]; then
        chmod +x scripts/setup-sudoers.sh
        if sudo bash scripts/setup-sudoers.sh; then
            print_success "Sudo permissions configured"
        else
            print_error "Failed to configure sudo permissions"
            print_warning "You can run 'sudo bash scripts/setup-sudoers.sh' later"
        fi
    else
        print_error "scripts/setup-sudoers.sh not found"
    fi
else
    print_warning "Skipping sudo permissions setup"
    print_info "Run 'sudo bash scripts/setup-sudoers.sh' later to configure permissions"
fi

# Step 4: Build (optional)
echo ""
echo "════════════════════════════════════════════════════════════"
echo "Step 4: Build (Optional)"
echo "════════════════════════════════════════════════════════════"

read -p "Do you want to build the backend now? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd backend
    if npm run build; then
        print_success "Backend built successfully"
    else
        print_error "Backend build failed"
    fi
    cd ..
fi

# Summary
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete!                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
print_success "PZWebAdmin setup completed successfully!"
echo ""
echo "Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Verify backend configuration:"
echo "   nano backend/.env"
echo ""
echo "2. Start the backend (Terminal 1):"
echo "   cd backend && npm run dev"
echo ""
echo "3. Start the frontend (Terminal 2):"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Access the web interface:"
echo "   http://localhost:5173"
echo ""
echo "For production deployment, see DEPLOYMENT.md"
echo ""
print_info "Default login: admin / (your configured password)"
echo ""

