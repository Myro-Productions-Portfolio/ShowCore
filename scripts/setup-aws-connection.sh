#!/bin/bash

# ShowCore AWS Connection Setup Script
# This script helps you set up the connection to AWS infrastructure

set -e

echo "🚀 ShowCore AWS Connection Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI is installed${NC}"

# Check AWS profile
echo ""
echo "Checking AWS profile..."
if aws sts get-caller-identity --profile showcore &> /dev/null; then
    IDENTITY=$(aws sts get-caller-identity --profile showcore --output json)
    USER_ARN=$(echo $IDENTITY | grep -o '"Arn": "[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ AWS profile 'showcore' is configured${NC}"
    echo -e "   User: ${BLUE}$USER_ARN${NC}"
else
    echo -e "${RED}❌ AWS profile 'showcore' is not configured${NC}"
    echo "Run: aws configure --profile showcore"
    exit 1
fi

# Check RDS instance
echo ""
echo "Checking RDS instance..."
RDS_STATUS=$(aws rds describe-db-instances \
    --profile showcore \
    --db-instance-identifier showcore-database-production-rds \
    --query 'DBInstances[0].DBInstanceStatus' \
    --output text 2>/dev/null || echo "not-found")

if [ "$RDS_STATUS" = "available" ]; then
    echo -e "${GREEN}✅ RDS instance is available${NC}"
    RDS_ENDPOINT=$(aws rds describe-db-instances \
        --profile showcore \
        --db-instance-identifier showcore-database-production-rds \
        --query 'DBInstances[0].Endpoint.Address' \
        --output text)
    echo -e "   Endpoint: ${BLUE}$RDS_ENDPOINT${NC}"
elif [ "$RDS_STATUS" = "not-found" ]; then
    echo -e "${RED}❌ RDS instance not found${NC}"
    exit 1
else
    echo -e "${YELLOW}⚠️  RDS instance status: $RDS_STATUS${NC}"
    echo "   Wait for it to become 'available'"
fi

# Check ElastiCache cluster
echo ""
echo "Checking ElastiCache cluster..."
REDIS_STATUS=$(aws elasticache describe-cache-clusters \
    --profile showcore \
    --cache-cluster-id showcore-redis \
    --query 'CacheClusters[0].CacheClusterStatus' \
    --output text 2>/dev/null || echo "not-found")

if [ "$REDIS_STATUS" = "available" ]; then
    echo -e "${GREEN}✅ ElastiCache cluster is available${NC}"
    REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
        --profile showcore \
        --cache-cluster-id showcore-redis \
        --show-cache-node-info \
        --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
        --output text)
    echo -e "   Endpoint: ${BLUE}$REDIS_ENDPOINT${NC}"
elif [ "$REDIS_STATUS" = "not-found" ]; then
    echo -e "${RED}❌ ElastiCache cluster not found${NC}"
    exit 1
else
    echo -e "${YELLOW}⚠️  ElastiCache cluster status: $REDIS_STATUS${NC}"
    echo "   Wait for it to become 'available'"
fi

# Check S3 bucket
echo ""
echo "Checking S3 bucket..."
S3_BUCKET="showcore-static-assets-498618930321"
if aws s3api head-bucket --bucket $S3_BUCKET --profile showcore 2>/dev/null; then
    echo -e "${GREEN}✅ S3 bucket exists and is accessible${NC}"
    echo -e "   Bucket: ${BLUE}$S3_BUCKET${NC}"
else
    echo -e "${YELLOW}⚠️  Cannot access S3 bucket (may need different permissions)${NC}"
fi

# Check network access
echo ""
echo "Checking network access..."
echo -e "${YELLOW}⚠️  RDS and ElastiCache are in PRIVATE subnets${NC}"
echo "   You cannot connect directly from your local machine"
echo ""
echo "   To enable access for testing:"
echo "   1. Get your public IP: curl https://checkip.amazonaws.com"
echo "   2. Add temporary security group rules (see AWS_CONNECTION_GUIDE.md)"
echo "   3. Or set up VPN/bastion host for secure access"

# Offer to create .env file
echo ""
echo "=================================="
echo ""
read -p "Do you want to create backend/.env from template? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "backend/.env" ]; then
        echo -e "${YELLOW}⚠️  backend/.env already exists${NC}"
        read -p "Overwrite it? (y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Skipping .env creation"
            exit 0
        fi
    fi
    
    cp backend/.env.aws.template backend/.env
    echo -e "${GREEN}✅ Created backend/.env${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit backend/.env and replace YOUR_PASSWORD_HERE${NC}"
    echo ""
    echo "To get the RDS password:"
    echo "1. Check AWS Secrets Manager for auto-generated password"
    echo "2. Or reset it: aws rds modify-db-instance --db-instance-identifier showcore-database-production-rds --master-user-password 'YourPassword123!' --apply-immediately"
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ Setup check complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with the RDS password"
echo "2. Configure network access (see AWS_CONNECTION_GUIDE.md)"
echo "3. Initialize database: cd backend && npm run db:push"
echo "4. Start backend: npm run dev"
echo ""
echo "For detailed instructions, see: AWS_CONNECTION_GUIDE.md"
