# ShowCore Phase 1 - Quick Reference Guide

## Architecture at a Glance

### Network Configuration
```
VPC: 10.0.0.0/16 (us-east-1)
├── Public Subnets (Internet Access)
│   ├── us-east-1a: 10.0.0.0/24
│   └── us-east-1b: 10.0.1.0/24
└── Private Subnets (NO Internet Access)
    ├── us-east-1a: 10.0.2.0/24 (RDS, ElastiCache)
    └── us-east-1b: 10.0.3.0/24 (Future Expansion)
```

### Key Design Decision: NO NAT Gateway
- **Cost Savings**: ~$32/month eliminated
- **Alternative**: VPC Endpoints for AWS service access
- **Trade-off**: Private subnets have NO internet access
- **Net Savings**: ~$11/month vs NAT Gateway architecture

## VPC Endpoints

### Gateway Endpoints (FREE)
| Endpoint | Service | Cost | Use Case |
|----------|---------|------|----------|
| S3 | com.amazonaws.us-east-1.s3 | $0 | Backups, logs, static assets |
| DynamoDB | com.amazonaws.us-east-1.dynamodb | $0 | Future application data |

### Interface Endpoints (~$7/month each)
| Endpoint | Service | Cost | Use Case |
|----------|---------|------|----------|
| CloudWatch Logs | com.amazonaws.us-east-1.logs | ~$7/month | RDS, ElastiCache, app logs |
| CloudWatch Monitoring | com.amazonaws.us-east-1.monitoring | ~$7/month | Metrics and alarms |
| Systems Manager | com.amazonaws.us-east-1.ssm | ~$7/month | Session Manager access |

## Data Layer

### RDS PostgreSQL
```
Engine: PostgreSQL 16.x
Instance: db.t3.micro (2 vCPU, 1 GB RAM)
Storage: 20 GB gp3 SSD
Multi-AZ: Disabled (cost optimization)
Backup: Daily, 7-day retention
Encryption: AWS managed keys
Cost: $0 (Free Tier), then ~$15/month
```

### ElastiCache Redis
```
Engine: Redis 7.x
Node: cache.t3.micro (2 vCPU, 0.5 GB RAM)
Cluster: Single node (no replicas)
Backup: Daily snapshots, 7-day retention
Encryption: AWS managed encryption
Cost: $0 (Free Tier), then ~$12/month
```

## Storage & CDN

### S3 Buckets
| Bucket | Purpose | Versioning | Lifecycle |
|--------|---------|------------|-----------|
| showcore-static-assets-{account} | Static assets | Enabled | Delete old versions after 90 days |
| showcore-backups-{account} | Backups | Enabled | Glacier after 30 days, delete after 90 days |
| showcore-cloudtrail-logs-{account} | Audit logs | Enabled | Glacier after 90 days, delete after 1 year |

### CloudFront
```
Origin: S3 static assets bucket
Price Class: PriceClass_100 (North America, Europe)
SSL/TLS: TLS 1.2 minimum
Caching: Default 24h, Max 1 year
Compression: Enabled
Cost: $0 (first 1 TB free), then ~$0.085/GB
```

## Security Groups

### VPC Endpoint Security Group
```
Ingress:
  - Port 443 (HTTPS) from 10.0.0.0/16
Egress: None (stateful)
```

### RDS Security Group
```
Ingress:
  - Port 5432 (PostgreSQL) from app_sg
Egress: None (stateful)
```

### ElastiCache Security Group
```
Ingress:
  - Port 6379 (Redis) from app_sg
Egress: None (stateful)
```

## Monitoring & Alerting

### CloudWatch Alarms
| Alarm | Threshold | Action |
|-------|-----------|--------|
| RDS CPU High | > 80% for 10 min | Critical Alert |
| RDS Storage Low | < 15% free | Warning Alert |
| ElastiCache Memory High | > 80% for 10 min | Critical Alert |
| ElastiCache CPU High | > 75% for 10 min | Critical Alert |
| Billing $50 | > $50 | Billing Alert |
| Billing $100 | > $100 | Billing Alert |

### SNS Topics
- **Critical Alerts**: admin@showcore.com, oncall@showcore.com
- **Warning Alerts**: devops@showcore.com
- **Billing Alerts**: finance@showcore.com, admin@showcore.com

## Cost Breakdown

### During Free Tier (Months 1-12)
| Service | Cost |
|---------|------|
| RDS db.t3.micro | $0 (750 hours/month free) |
| ElastiCache cache.t3.micro | $0 (750 hours/month free) |
| VPC Endpoints (Gateway) | $0 (FREE) |
| VPC Endpoints (Interface, 3x) | ~$21/month |
| S3 Storage | ~$1-5/month |
| CloudFront | ~$1-5/month |
| Data Transfer | ~$0-5/month |
| CloudWatch | ~$0-5/month |
| **Total** | **~$3-10/month** |

### After Free Tier (Month 13+)
| Service | Cost |
|---------|------|
| RDS db.t3.micro | ~$15/month |
| ElastiCache cache.t3.micro | ~$12/month |
| VPC Endpoints | ~$21/month |
| Other | ~$1-12/month |
| **Total** | **~$49-60/month** |

## Connection Strings

### RDS PostgreSQL
```bash
Host: showcore-db.cluster-xxxxx.us-east-1.rds.amazonaws.com
Port: 5432
Database: showcore
SSL Mode: require
Connection Timeout: 30s
Max Connections: 100
```

### ElastiCache Redis
```bash
Endpoint: showcore-redis.xxxxx.clustercfg.use1.cache.amazonaws.com
Port: 6379
TLS: Enabled
Connection Timeout: 5s
Max Connections: 50
```

### S3 Static Assets
```bash
Bucket: showcore-static-assets-{account-id}
Region: us-east-1
Access: Private (CloudFront OAC only)
```

### CloudFront
```bash
Distribution: d1234example.cloudfront.net
Custom Domain: cdn.showcore.com (future)
Protocol: HTTPS only
```

## CDK Deployment

### Stack Deployment Order
1. ShowCoreSecurityStack (CloudTrail, AWS Config)
2. ShowCoreMonitoringStack (SNS, billing alarms)
3. ShowCoreNetworkStack (VPC, subnets, VPC endpoints)
4. ShowCoreDatabaseStack (RDS PostgreSQL)
5. ShowCoreCacheStack (ElastiCache Redis)
6. ShowCoreStorageStack (S3 buckets)
7. ShowCoreCDNStack (CloudFront distribution)
8. ShowCoreBackupStack (AWS Backup plans)

### Essential Commands
```bash
# Bootstrap (first time only)
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1

# Validate
cdk synth

# Preview changes
cdk diff

# Deploy all
cdk deploy --all

# Deploy specific stack
cdk deploy ShowCoreNetworkStack

# Destroy all
cdk destroy --all
```

## Troubleshooting

### RDS Connection Issues
```bash
# Check security group
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Check RDS status
aws rds describe-db-instances --db-instance-identifier showcore-db

# Test connectivity (from private subnet)
telnet showcore-db.cluster-xxxxx.us-east-1.rds.amazonaws.com 5432
```

### ElastiCache Connection Issues
```bash
# Check security group
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Check ElastiCache status
aws elasticache describe-cache-clusters --cache-cluster-id showcore-redis

# Test connectivity (from private subnet)
telnet showcore-redis.xxxxx.use1.cache.amazonaws.com 6379
```

### VPC Endpoint Issues
```bash
# Check VPC Endpoint status
aws ec2 describe-vpc-endpoints --vpc-endpoint-ids vpce-xxxxx

# Check route tables
aws ec2 describe-route-tables --route-table-ids rtb-xxxxx

# Test S3 access (from private subnet)
aws s3 ls s3://showcore-backups-{account-id}

# Test DNS resolution
nslookup s3.amazonaws.com
```

### CloudWatch Logs Issues
```bash
# Check log groups
aws logs describe-log-groups --log-group-name-prefix /aws/rds

# Check log streams
aws logs describe-log-streams --log-group-name /aws/rds/instance/showcore-db

# Tail logs
aws logs tail /aws/rds/instance/showcore-db --follow
```

## Resource Naming Convention

```
Format: showcore-{component}-{environment}-{resource-type}

Examples:
- showcore-network-production-vpc
- showcore-database-production-rds
- showcore-cache-production-redis
- showcore-storage-production-assets
- showcore-cdn-production-distribution
```

## Resource Tags

All resources are tagged with:
```
Project: ShowCore
Phase: Phase1
Environment: Production
ManagedBy: CDK
CostCenter: Engineering
Component: Network, Database, Cache, Storage, CDN, etc.
```

## Backup & Recovery

### RDS Backup
```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier showcore-db \
  --db-snapshot-identifier showcore-db-manual-$(date +%Y%m%d)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier showcore-db-restored \
  --db-snapshot-identifier showcore-db-manual-20260204
```

### ElastiCache Backup
```bash
# Create manual snapshot
aws elasticache create-snapshot \
  --cache-cluster-id showcore-redis \
  --snapshot-name showcore-redis-manual-$(date +%Y%m%d)

# Restore from snapshot
aws elasticache create-cache-cluster \
  --cache-cluster-id showcore-redis-restored \
  --snapshot-name showcore-redis-manual-20260204
```

### S3 Versioning
```bash
# List object versions
aws s3api list-object-versions \
  --bucket showcore-static-assets-{account-id} \
  --prefix path/to/file

# Restore previous version
aws s3api copy-object \
  --bucket showcore-static-assets-{account-id} \
  --copy-source showcore-static-assets-{account-id}/path/to/file?versionId=xxx \
  --key path/to/file
```

## Monitoring

### CloudWatch Dashboard URL
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=ShowCorePhase1Dashboard
```

### Cost Explorer URL
```
https://console.aws.amazon.com/cost-management/home?region=us-east-1#/cost-explorer
```

### CloudTrail Console URL
```
https://console.aws.amazon.com/cloudtrail/home?region=us-east-1#/events
```

## Support Contacts

- **Critical Issues**: admin@showcore.com, oncall@showcore.com
- **Warnings**: devops@showcore.com
- **Billing**: finance@showcore.com

## Additional Documentation

- [Complete Architecture Documentation](ARCHITECTURE.md)
- [Infrastructure README](README.md)
- [Diagram Documentation](DIAGRAMS.md)
- [AWS Well-Architected Guidelines](../.kiro/steering/aws-well-architected.md)
- [IaC Standards](../.kiro/steering/iac-standards.md)
