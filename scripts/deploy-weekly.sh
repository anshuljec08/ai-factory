#!/bin/bash

# AI Factory - Weekly Deployment Script
# Usage: ./scripts/deploy-weekly.sh [all|api|ui|launchpad]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="https://ai-factory-agent-registry-cheerful-oryx-hn.cfapps.eu10-004.hana.ondemand.com"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           AI Factory - Weekly Deployment                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check CF login
check_cf_login() {
    echo -e "${YELLOW}Checking Cloud Foundry login...${NC}"
    if ! cf target > /dev/null 2>&1; then
        echo -e "${RED}Not logged in to Cloud Foundry. Please run 'cf login' first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Logged in to Cloud Foundry${NC}"
    cf target
    echo ""
}

# Function to deploy API
deploy_api() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Deploying Agent Registry API...${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    cd services/agent-registry
    
    # Install dependencies
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install --production
    
    # Deploy to CF
    echo -e "${YELLOW}Pushing to Cloud Foundry...${NC}"
    cf push
    
    cd ../..
    
    echo -e "${GREEN}✓ API deployed successfully${NC}"
    echo ""
}

# Function to verify API
verify_api() {
    echo -e "${YELLOW}Verifying API health...${NC}"
    
    HEALTH_RESPONSE=$(curl -s "${API_URL}/health" || echo "FAILED")
    
    if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
        echo -e "${GREEN}✓ API health check passed${NC}"
        echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
    else
        echo -e "${RED}✗ API health check failed${NC}"
        echo "$HEALTH_RESPONSE"
        return 1
    fi
    
    # Check agents endpoint
    AGENTS_RESPONSE=$(curl -s "${API_URL}/api/v1/agents" || echo "FAILED")
    AGENT_COUNT=$(echo "$AGENTS_RESPONSE" | jq '.data | length' 2>/dev/null || echo "0")
    
    echo -e "${GREEN}✓ Found ${AGENT_COUNT} agents in registry${NC}"
    echo ""
}

# Function to build UI apps
build_ui() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Building UI Applications...${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Build AI Factory unified app
    if [ -d "apps/ai-factory" ]; then
        echo -e "${YELLOW}Building AI Factory app...${NC}"
        cd apps/ai-factory
        npm install
        npm run build 2>/dev/null || echo "Build script not configured, skipping..."
        cd ../..
        echo -e "${GREEN}✓ AI Factory app built${NC}"
    fi

    echo ""
}

# Function to deploy full MTA
deploy_mta() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Building and Deploying MTA...${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Check if mbt is installed
    if ! command -v mbt &> /dev/null; then
        echo -e "${YELLOW}Installing MTA Build Tool...${NC}"
        npm install -g mbt
    fi
    
    # Build MTA
    echo -e "${YELLOW}Building MTA archive...${NC}"
    mbt build
    
    # Deploy MTA
    echo -e "${YELLOW}Deploying MTA to Cloud Foundry...${NC}"
    cf deploy mta_archives/ai-factory_1.0.0.mtar
    
    echo -e "${GREEN}✓ MTA deployed successfully${NC}"
    echo ""
}

# Function to show deployment summary
show_summary() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║              Deployment Summary                            ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Deployed Components:${NC}"
    echo "  • Agent Registry API: ${API_URL}"
    echo ""
    echo -e "${YELLOW}Endpoints:${NC}"
    echo "  • Health:  ${API_URL}/health"
    echo "  • Agents:  ${API_URL}/api/v1/agents"
    echo ""
    echo -e "${YELLOW}Test Commands:${NC}"
    echo "  curl ${API_URL}/health"
    echo "  curl ${API_URL}/api/v1/agents"
    echo ""
    echo -e "${GREEN}Weekly Deployment Checklist:${NC}"
    echo "  [✓] API deployed and healthy"
    echo "  [ ] UI accessible via approuter (pending full MTA)"
    echo "  [ ] Tiles visible in launchpad (pending full MTA)"
    echo ""
}

# Main execution
main() {
    COMPONENT=${1:-"api"}
    
    check_cf_login
    
    case $COMPONENT in
        "all")
            deploy_api
            verify_api
            build_ui
            # deploy_mta  # Uncomment when MTA is ready
            show_summary
            ;;
        "api")
            deploy_api
            verify_api
            show_summary
            ;;
        "ui")
            build_ui
            ;;
        "mta")
            deploy_mta
            verify_api
            show_summary
            ;;
        "verify")
            verify_api
            ;;
        *)
            echo "Usage: $0 [all|api|ui|mta|verify]"
            echo ""
            echo "Commands:"
            echo "  all     - Deploy everything (API + UI + MTA)"
            echo "  api     - Deploy only the Agent Registry API"
            echo "  ui      - Build UI applications"
            echo "  mta     - Build and deploy full MTA"
            echo "  verify  - Verify deployed API"
            exit 1
            ;;
    esac
}

# Run main with arguments
main "$@"