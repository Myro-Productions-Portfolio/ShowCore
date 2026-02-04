#!/bin/bash

# ShowCore AWS Port Forwarding Script
# Uses AWS Systems Manager Session Manager to forward ports to RDS and Redis

set -e

echo "🔐 ShowCore AWS Port Forwarding"
echo "================================"
echo ""

# Check if Session Manager plugin is installed
if ! command -v session-manager-plugin &> /dev/null; then
    echo "❌ AWS Session Manager plugin is not installed"
    echo ""
    echo "Install it from:"
    echo "https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html"
    echo ""
    echo "macOS: brew install --cask session-manager-plugin"
    echo "Or download from: https://s3.amazonaws.com/session-manager-downloads/plugin/latest/mac_arm64/sessionmanager-bundle.zip"
    exit 1
fi

echo "✅ Session Manager plugin is installed"
echo ""

# Get instance ID
INSTANCE_ID="i-038dbeed07a324118"
RDS_ENDPOINT="showcore-database-production-rds.c0n8gos42qfi.us-east-1.rds.amazonaws.com"
REDIS_ENDPOINT="showcore-redis.npl1ux.0001.use1.cache.amazonaws.com"

echo "Instance ID: $INSTANCE_ID"
echo "RDS Endpoint: $RDS_ENDPOINT"
echo "Redis Endpoint: $REDIS_ENDPOINT"
echo ""

# Check which service to forward
echo "Which service do you want to forward?"
echo "1) PostgreSQL (port 5432)"
echo "2) Redis (port 6379)"
echo "3) Both (requires two terminals)"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Starting port forwarding for PostgreSQL..."
        echo "Local port 5432 -> RDS PostgreSQL"
        echo ""
        echo "Press Ctrl+C to stop"
        echo ""
        aws ssm start-session \
            --target $INSTANCE_ID \
            --document-name AWS-StartPortForwardingSessionToRemoteHost \
            --parameters "{\"host\":[\"$RDS_ENDPOINT\"],\"portNumber\":[\"5432\"],\"localPortNumber\":[\"5432\"]}"
        ;;
    2)
        echo ""
        echo "Starting port forwarding for Redis..."
        echo "Local port 6379 -> ElastiCache Redis"
        echo ""
        echo "Press Ctrl+C to stop"
        echo ""
        aws ssm start-session \
            --target $INSTANCE_ID \
            --document-name AWS-StartPortForwardingSessionToRemoteHost \
            --parameters "{\"host\":[\"$REDIS_ENDPOINT\"],\"portNumber\":[\"6379\"],\"localPortNumber\":[\"6379\"]}"
        ;;
    3)
        echo ""
        echo "To forward both services, run these commands in separate terminals:"
        echo ""
        echo "Terminal 1 (PostgreSQL):"
        echo "aws ssm start-session \\"
        echo "  --target $INSTANCE_ID \\"
        echo "  --document-name AWS-StartPortForwardingSessionToRemoteHost \\"
        echo "  --parameters '{\"host\":[\"$RDS_ENDPOINT\"],\"portNumber\":[\"5432\"],\"localPortNumber\":[\"5432\"]}'"
        echo ""
        echo "Terminal 2 (Redis):"
        echo "aws ssm start-session \\"
        echo "  --target $INSTANCE_ID \\"
        echo "  --document-name AWS-StartPortForwardingSessionToRemoteHost \\"
        echo "  --parameters '{\"host\":[\"$REDIS_ENDPOINT\"],\"portNumber\":[\"6379\"],\"localPortNumber\":[\"6379\"]}'"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
