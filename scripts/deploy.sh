#!/bin/bash

# AI Factory Deployment Script
# Usage: ./scripts/deploy.sh [api|ui|all]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if cf CLI is installed
check_cf_cli() {
    if ! command -v cf &> /dev/null; then
        log_error "Cloud Foundry CLI is not installed. Please install it first."
        exit 1
    fi
}

# Check if logged in to CF
check_cf_login() {
    if ! cf target &> /dev/null; then
        log_error "Not logged in to Cloud Foundry. Please run 'cf login' first."
        exit 1
    fi
}

# Deploy Agent Registry API
deploy_api() {
    log_info "Deploying Agent Registry API..."
    cd "$PROJECT_ROOT/services/agent-registry"
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm install --production
    
    # Push to Cloud Foundry
    log_info "Pushing to Cloud Foundry..."
    cf push
    
    # Get the app URL
    APP_URL=$(cf app ai-factory-agent-registry | grep routes | awk '{print $2}')
    log_info "Agent Registry API deployed at: https://$APP_URL"
    
    cd "$PROJECT_ROOT"
}

# Build and deploy UI
deploy_ui() {
    log_info "Building AI Factory UI..."
    cd "$PROJECT_ROOT/apps/ai-factory"

    # Install dependencies
    log_info "Installing dependencies..."
    npm install

    # Build the UI
    log_info "Building UI5 application..."
    npm run build

    log_info "UI built successfully. Deploy using MTA or manually."
    cd "$PROJECT_ROOT"
}

# Deploy using MTA
deploy_mta() {
    log_info "Building MTA archive..."
    cd "$PROJECT_ROOT"
    
    # Check if mbt is installed
    if ! command -v mbt &> /dev/null; then
        log_error "MTA Build Tool (mbt) is not installed. Install with: npm install -g mbt"
        exit 1
    fi
    
    # Build MTA
    mbt build
    
    # Deploy
    log_info "Deploying MTA archive..."
    cf deploy mta_archives/ai-factory_1.0.0.mtar
    
    log_info "MTA deployment complete!"
}

# Main
main() {
    check_cf_cli
    check_cf_login
    
    case "${1:-all}" in
        api)
            deploy_api
            ;;
        ui)
            deploy_ui
            ;;
        mta)
            deploy_mta
            ;;
        all)
            deploy_api
            deploy_ui
            ;;
        *)
            echo "Usage: $0 [api|ui|mta|all]"
            echo "  api  - Deploy Agent Registry API only"
            echo "  ui   - Build Agent Designer UI only"
            echo "  mta  - Build and deploy using MTA"
            echo "  all  - Deploy API and build UI (default)"
            exit 1
            ;;
    esac
    
    log_info "Deployment complete!"
}

main "$@"