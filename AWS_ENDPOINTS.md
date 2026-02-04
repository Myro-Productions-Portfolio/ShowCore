# ShowCore AWS Endpoints - Quick Reference

## Infrastructure Endpoints

### RDS PostgreSQL Database
```
Endpoint:  showcore-database-production-rds.c0n8gos42qfi.us-east-1.rds.amazonaws.com
Port:      5432
Database:  showcore
Username:  postgres
Password:  [Retrieve from AWS Secrets Manager]
```

**Connection String:**
```
postgresql://postgres:PASSWORD@showcore-database-production-rds.c0n8gos42qfi.us-east-1.rds.amazonaws.com:5432/showcore
```

### ElastiCache Redis
```
Endpoint:  showcore-redis.npl1ux.0001.use1.cache.amazonaws.com
Port:      6379
Auth:      None (within VPC)
```

**Connection String:**
```
redis://showcore-redis.npl1ux.0001.use1.cache.amazonaws.com:6379
```

### S3 Static Assets Bucket
```
Bucket:    showcore-static-assets-498618930321
Region:    us-east-1
URL:       https://showcore-static-assets-498618930321.s3.amazonaws.com
```

**AWS CLI Access:**
```bash
aws s3 ls s3://showcore-static-assets-498618930321/ --profile showcore
```

## AWS Account Details

```
Account ID:  498618930321
Region:      us-east-1 (US East - N. Virginia)
Profile:     showcore
IAM User:    showcore-app
```

## Quick Commands

### Check Infrastructure Status
```bash
# RDS status
aws rds describe-db-instances \
  --profile showcore \
  --db-instance-identifier showcore-database-production-rds \
  --query 'DBInstances[0].[DBInstanceStatus,Endpoint.Address]'

# ElastiCache status
aws elasticache describe-cache-clusters \
  --profile showcore \
  --cache-cluster-id showcore-redis \
  --query 'CacheClusters[0].[CacheClusterStatus,CacheNodes[0].Endpoint.Address]'

# S3 bucket contents
aws s3 ls s3://showcore-static-assets-498618930321/ --profile showcore --recursive
```

### Test Connections
```bash
# Test PostgreSQL (requires psql)
psql "postgresql://postgres:PASSWORD@showcore-database-production-rds.c0n8gos42qfi.us-east-1.rds.amazonaws.com:5432/showcore"

# Test Redis (requires redis-cli)
redis-cli -h showcore-redis.npl1ux.0001.use1.cache.amazonaws.com -p 6379 ping

# Test with Prisma
cd backend && npx prisma db pull
```

## Network Access

⚠️ **Important**: RDS and ElastiCache are in **private subnets** with **NO internet access**.

You cannot connect directly from your local machine. Options:

1. **Temporary Testing**: Add your IP to security groups (see AWS_CONNECTION_GUIDE.md)
2. **VPN**: Set up AWS Client VPN (Phase 2)
3. **Bastion Host**: Deploy EC2 jump box in public subnet (Phase 2)
4. **Systems Manager**: Use Session Manager for secure access (Phase 2)

## Security Groups

### RDS Security Group
- **Name**: Contains "rds" in tag
- **Inbound**: Port 5432 from application security group
- **Outbound**: All traffic

### ElastiCache Security Group
- **Name**: Contains "redis" in tag
- **Inbound**: Port 6379 from application security group
- **Outbound**: All traffic

## CloudWatch Dashboards

View infrastructure metrics:
```bash
# Open CloudWatch dashboard
aws cloudwatch list-dashboards --profile showcore

# View RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=showcore-database-production-rds \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --profile showcore
```

## Cost Monitoring

```bash
# Current month costs
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=TAG,Key=Project

# Daily costs
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-05 \
  --granularity DAILY \
  --metrics BlendedCost
```

## Backup Information

### RDS Automated Backups
- **Retention**: 7 days
- **Backup Window**: 03:00-04:00 UTC
- **Maintenance Window**: Sun 04:00-05:00 UTC

### ElastiCache Snapshots
- **Retention**: 7 days
- **Snapshot Window**: 03:00-04:00 UTC
- **Maintenance Window**: Sun 04:00-05:00 UTC

## Support Resources

- **AWS Console**: https://console.aws.amazon.com/
- **Connection Guide**: See `AWS_CONNECTION_GUIDE.md`
- **Infrastructure Code**: See `infrastructure/` directory
- **Project Specs**: See `.kiro/specs/showcore-aws-migration-phase1/`

---

**Last Updated**: February 4, 2026  
**Phase**: Phase 1 - Infrastructure Deployment Complete
