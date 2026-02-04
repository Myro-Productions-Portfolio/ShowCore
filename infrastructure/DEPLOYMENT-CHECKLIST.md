# ShowCore Phase 1 - Deployment Checklist

## Quick Reference for Task 13.1

Use this checklist to track your deployment progress.

---

## Pre-Deployment Checks

- [ ] **AWS Credentials Configured**
  ```bash
  aws sts get-caller-identity
  # Should show: showcore-app user
  ```

- [ ] **Virtual Environment Activated**
  ```bash
  cd infrastructure
  source .venv/bin/activate
  ```

- [ ] **CDK Context Updated**
  - [ ] Account ID set in `cdk.json`
  - [ ] Email addresses set in `cdk.json`

- [ ] **CDK Bootstrapped** (first time only)
  ```bash
  cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
  ```

- [ ] **Unit Tests Pass**
  ```bash
  pytest tests/unit/ -v
  # All tests should PASS
  ```

- [ ] **CDK Synthesis Works**
  ```bash
  cdk synth
  # Should complete without errors
  ```

- [ ] **Preview Changes**
  ```bash
  cdk diff --all
  # Review what will be deployed
  ```

---

## Deployment

- [ ] **Deploy All Stacks**
  ```bash
  cdk deploy --all --require-approval never
  ```

- [ ] **Monitor Progress** (15-30 minutes)
  - [ ] Watch terminal output
  - [ ] Check CloudFormation console
  - [ ] Wait for all stacks to reach CREATE_COMPLETE

- [ ] **All 8 Stacks Deployed Successfully**
  - [ ] ShowCoreNetworkStack
  - [ ] ShowCoreSecurityStack
  - [ ] ShowCoreMonitoringStack
  - [ ] ShowCoreDatabaseStack
  - [ ] ShowCoreCacheStack
  - [ ] ShowCoreStorageStack
  - [ ] ShowCoreCDNStack
  - [ ] ShowCoreBackupStack

---

## Post-Deployment Verification

### AWS Console Checks

- [ ] **VPC Console**
  - [ ] VPC exists (10.0.0.0/16)
  - [ ] 4 subnets exist (2 public, 2 private)
  - [ ] Internet Gateway exists
  - [ ] **NO NAT Gateway exists** ✅
  - [ ] VPC Endpoints exist (5 total: 2 Gateway, 3 Interface)

- [ ] **EC2 Console → Security Groups**
  - [ ] RDS security group exists
  - [ ] ElastiCache security group exists
  - [ ] VPC Endpoint security group exists
  - [ ] NO 0.0.0.0/0 rules on ports 22, 5432, 6379

- [ ] **RDS Console**
  - [ ] RDS instance exists (showcore-database-production-rds)
  - [ ] Instance class is db.t3.micro (Free Tier)
  - [ ] Single-AZ deployment
  - [ ] Encryption at rest enabled
  - [ ] Automated backups enabled (7-day retention)

- [ ] **ElastiCache Console**
  - [ ] Redis cluster exists (showcore-redis)
  - [ ] Node type is cache.t3.micro (Free Tier)
  - [ ] Single-node deployment
  - [ ] Encryption at rest and in transit enabled
  - [ ] Automated snapshots enabled (7-day retention)

- [ ] **S3 Console**
  - [ ] Static assets bucket exists
  - [ ] Backups bucket exists
  - [ ] CloudTrail logs bucket exists
  - [ ] Versioning enabled on all buckets
  - [ ] Encryption enabled (SSE-S3)
  - [ ] Lifecycle policies configured

- [ ] **CloudFront Console**
  - [ ] Distribution exists
  - [ ] Origin is S3 static assets bucket
  - [ ] HTTPS-only configured
  - [ ] PriceClass_100 (North America and Europe)

- [ ] **CloudWatch Console**
  - [ ] Dashboard exists (ShowCore-Phase1-Dashboard)
  - [ ] Metrics are displayed
  - [ ] Alarms exist for RDS, ElastiCache, billing

- [ ] **AWS Backup Console**
  - [ ] Backup vault exists
  - [ ] Backup plans exist for RDS and ElastiCache
  - [ ] Backup jobs are scheduled

### CLI Verification

- [ ] **VPC Endpoints Are Healthy**
  ```bash
  aws ec2 describe-vpc-endpoints \
    --filters "Name=tag:Project,Values=ShowCore" \
    --query 'VpcEndpoints[*].[VpcEndpointId,ServiceName,State]' \
    --output table
  # All should show "available"
  ```

- [ ] **Private Subnets Have NO Internet Access**
  ```bash
  aws ec2 describe-route-tables \
    --filters "Name=tag:Name,Values=*Private*" \
    --query 'RouteTables[*].Routes' \
    --output table
  # Should show NO default route (0.0.0.0/0)
  ```

- [ ] **No Infrastructure Drift**
  ```bash
  cdk diff --all
  # Should show "There were no differences"
  ```

### Email Confirmations

- [ ] **SNS Email Subscriptions Confirmed**
  - [ ] Critical alerts topic confirmed
  - [ ] Warning alerts topic confirmed
  - [ ] Billing alerts topic confirmed

### Cost Monitoring Setup

- [ ] **Cost Allocation Tags Activated**
  - Go to AWS Billing Console → Cost Allocation Tags
  - Activate: Project, Phase, Environment, ManagedBy, CostCenter, Component

- [ ] **Cost Explorer Enabled**
  - Go to AWS Billing Console → Cost Explorer
  - Click "Enable Cost Explorer"

---

## Get Resource Endpoints

- [ ] **RDS Endpoint**
  ```bash
  aws rds describe-db-instances \
    --db-instance-identifier showcore-database-production-rds \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text
  ```
  Endpoint: _______________________________________________

- [ ] **ElastiCache Endpoint**
  ```bash
  aws elasticache describe-cache-clusters \
    --cache-cluster-id showcore-redis \
    --show-cache-node-info \
    --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
    --output text
  ```
  Endpoint: _______________________________________________

- [ ] **CloudFront Domain**
  ```bash
  aws cloudfront list-distributions \
    --query 'DistributionList.Items[?Comment==`ShowCore Static Assets CDN`].DomainName' \
    --output text
  ```
  Domain: _______________________________________________

---

## Final Checks

- [ ] **Review CloudWatch Dashboard**
  - Metrics are populating (may take 5-10 minutes)

- [ ] **Verify Billing Alerts**
  - Alarms exist for $50 and $100 thresholds

- [ ] **Document Deployment**
  - Save resource endpoints
  - Note any issues encountered
  - Record deployment time

---

## Task Completion

- [ ] **Mark Task 13.1 as Completed**
- [ ] **Proceed to Task 14: Integration Testing**

---

## Deployment Summary

**Date**: _______________
**Time Started**: _______________
**Time Completed**: _______________
**Total Duration**: _______________

**Stacks Deployed**: 8/8
**Issues Encountered**: _______________________________________________
**Resolution**: _______________________________________________

**Estimated Monthly Cost**:
- During Free Tier: ~$3-10/month
- After Free Tier: ~$49-60/month

**Cost Optimization Achieved**:
- ✅ NO NAT Gateway: ~$32/month savings
- ✅ Free Tier instances: $0 for 12 months
- ✅ Gateway Endpoints: FREE
- ✅ Single-AZ deployment: 50% cost reduction
- ✅ Net savings: ~$4-11/month vs NAT Gateway architecture

---

🎉 **Infrastructure is now live in AWS!** 🎉

**Next Steps**:
1. Run integration tests (Task 14)
2. Test RDS connectivity
3. Test ElastiCache connectivity
4. Test VPC Endpoints
5. Test CloudFront and S3 integration
6. Run property-based tests

---

**Last Updated**: February 4, 2026
**Task**: 13.1 Deploy complete infrastructure to AWS
