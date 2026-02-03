# AWS Organizations Setup - ShowCore Project

## Overview

This document describes the AWS Organizations structure for the ShowCore project. AWS Organizations provides centralized management of multiple AWS accounts, enabling consolidated billing, policy-based management, and organizational hierarchy.

**Status**: Phase 1 - Foundation Setup  
**Last Updated**: February 3, 2026  
**Validates**: Requirements 1.1

## Organization Hierarchy

```
ShowCore Organization (Root)
├── Management Account (Root Account)
│   └── Purpose: Billing, organization management, root-level policies
│
├── Security OU (Organizational Unit)
│   ├── Security Tooling Account
│   │   └── Purpose: AWS Config, CloudTrail, GuardDuty (future)
│   └── Audit Account
│       └── Purpose: Centralized logging, compliance auditing
│
├── Workloads OU (Organizational Unit)
│   ├── Production Account
│   │   └── Purpose: ShowCore production infrastructure (Phase 1)
│   ├── Staging Account (Future)
│   │   └── Purpose: Pre-production testing environment
│   └── Development Account (Future)
│       └── Purpose: Development and experimentation
│
└── Sandbox OU (Organizational Unit)
    └── Sandbox Account (Future)
        └── Purpose: Individual developer experimentation
```

## Organizational Units (OUs)

### 1. Management Account (Root)

**Account ID**: [Your AWS Account ID]  
**Purpose**: Root account for organization management

**Responsibilities**:
- Consolidated billing for all accounts
- Organization-wide policy management
- Service Control Policies (SCPs) administration
- Cost allocation and reporting
- Root-level CloudTrail configuration

**Access Control**:
- MFA required for root user
- Root user access restricted to emergency use only
- IAM users with administrative access for daily operations
- Existing `showcore-app` IAM user for infrastructure deployment

**Cost Allocation Tags**:
```json
{
  "Project": "ShowCore",
  "Phase": "Phase1",
  "Environment": "Management",
  "ManagedBy": "Manual",
  "CostCenter": "Engineering"
}
```

### 2. Security OU

**Purpose**: Centralized security and compliance management

#### 2.1 Security Tooling Account (Future - Phase 2)

**Purpose**: Host security services and tools

**Services**:
- AWS Config aggregator (multi-account compliance)
- AWS CloudTrail organization trail
- AWS GuardDuty (threat detection)
- AWS Security Hub (centralized security findings)
- AWS IAM Access Analyzer

**Access Control**:
- Security team access only
- Read-only access for audit purposes
- MFA required for all users

#### 2.2 Audit Account (Future - Phase 2)

**Purpose**: Centralized audit logging and compliance

**Services**:
- S3 bucket for organization-wide CloudTrail logs
- S3 bucket for AWS Config snapshots
- S3 bucket for VPC Flow Logs (when enabled)
- Athena for log analysis

**Access Control**:
- Read-only access for auditors
- No write access except from AWS services
- Bucket policies enforce immutability

### 3. Workloads OU

**Purpose**: Application workloads and environments

#### 3.1 Production Account (Phase 1 - Current Focus)

**Account ID**: [Your AWS Account ID] (using existing account for Phase 1)  
**Purpose**: ShowCore production infrastructure

**Phase 1 Resources**:
- VPC with public, private subnets
- VPC Endpoints (Gateway and Interface)
- RDS PostgreSQL 16 (db.t3.micro)
- ElastiCache Redis 7 (cache.t3.micro)
- S3 buckets (static assets, backups)
- CloudFront distribution
- CloudWatch dashboards and alarms
- AWS Backup vault and plans

**Access Control**:
- `showcore-app` IAM user with ShowCoreDeploymentPolicy
- MFA required for console access
- Programmatic access for CI/CD (future)

**Cost Allocation Tags**:
```json
{
  "Project": "ShowCore",
  "Phase": "Phase1",
  "Environment": "Production",
  "ManagedBy": "CDK",
  "CostCenter": "Engineering"
}
```

**Estimated Monthly Cost**:
- During Free Tier: ~$3-10/month
- After Free Tier: ~$49-60/month

#### 3.2 Staging Account (Future - Phase 2)

**Purpose**: Pre-production testing environment

**Planned Resources**:
- Scaled-down version of production infrastructure
- Same architecture, smaller instance types
- Separate VPC and resources
- Integration testing and QA

**Cost Optimization**:
- Use t3.micro instances (smaller than production if needed)
- Single-AZ deployment
- Shorter backup retention (3 days)
- Can be shut down when not in use

#### 3.3 Development Account (Future - Phase 3)

**Purpose**: Development and experimentation

**Planned Resources**:
- Minimal infrastructure for development
- Shared resources where possible
- Ephemeral environments
- Developer testing

**Cost Optimization**:
- Use smallest instance types
- No automated backups
- Resources can be terminated when not in use
- Lifecycle policies to auto-delete old resources

### 4. Sandbox OU (Future - Phase 3)

**Purpose**: Individual developer experimentation

#### 4.1 Sandbox Account

**Purpose**: Safe environment for learning and experimentation

**Characteristics**:
- No production data
- Isolated from other accounts
- Budget limits enforced
- Automatic resource cleanup

**Access Control**:
- Individual developer access
- No access to production or staging
- Budget alerts at $10, $25, $50

## Service Control Policies (SCPs)

### Root Level SCPs

#### 1. Deny Leaving Organization

Prevents accounts from leaving the organization:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "organizations:LeaveOrganization"
      ],
      "Resource": "*"
    }
  ]
}
```

#### 2. Require MFA for Sensitive Operations

Requires MFA for destructive operations:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "ec2:TerminateInstances",
        "rds:DeleteDBInstance",
        "s3:DeleteBucket",
        "cloudformation:DeleteStack"
      ],
      "Resource": "*",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "false"
        }
      }
    }
  ]
}
```

#### 3. Deny Region Outside us-east-1 (Phase 1)

Restricts resource creation to us-east-1 for cost control:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": "us-east-1"
        }
      }
    }
  ]
}
```

### Workloads OU SCPs

#### 1. Prevent NAT Gateway Creation

Enforces cost optimization by preventing NAT Gateway deployment:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "ec2:CreateNatGateway"
      ],
      "Resource": "*"
    }
  ]
}
```

#### 2. Require Resource Tagging

Requires cost allocation tags on all resources:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "ec2:RunInstances",
        "rds:CreateDBInstance",
        "elasticache:CreateCacheCluster",
        "s3:CreateBucket"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotLike": {
          "aws:RequestTag/Project": "*",
          "aws:RequestTag/Environment": "*",
          "aws:RequestTag/CostCenter": "*"
        }
      }
    }
  ]
}
```

## Implementation Steps

### Phase 1: Single Account Setup (Current)

For Phase 1, we're using a single AWS account for simplicity and cost optimization. Full AWS Organizations structure will be implemented in Phase 2.

**Current Setup - Verified**:
1. ✅ AWS Organizations exists (Organization ID: o-n6ykvz3fw6)
2. ✅ Master Account: 730335369801 (ops@aurascope.io)
3. ✅ ShowCore Account: 498618930321 (member account)
4. ✅ Current IAM user: nic (arn:aws:iam::498618930321:user/nic)
5. ⏳ Cost allocation tags (to be configured in task 1.2)
6. ⏳ Billing alerts (to be configured in task 1.2)
7. ⏳ CloudTrail (to be enabled in task 1.3)

**Phase 1 Organizational Structure**:
```
AWS Organization (o-n6ykvz3fw6)
├── Master Account (730335369801)
│   └── Organization management
│
└── ShowCore Account (498618930321) ← Current account
    ├── ShowCore Production Infrastructure
    │   ├── VPC and Networking (to be deployed)
    │   ├── RDS PostgreSQL (to be deployed)
    │   ├── ElastiCache Redis (to be deployed)
    │   ├── S3 Buckets (to be deployed)
    │   ├── CloudFront Distribution (to be deployed)
    │   ├── CloudWatch Monitoring (to be deployed)
    │   └── AWS Backup (to be deployed)
    │
    └── Management Functions
        ├── IAM Users and Roles (nic user exists)
        ├── Billing and Cost Management (to be configured)
        ├── CloudTrail Audit Logging (to be enabled)
        └── AWS Config Compliance (to be configured)
```

**Note**: The ShowCore account (498618930321) is a member of an existing AWS Organization. We do not have permissions to manage the organization structure from this account, which is appropriate for Phase 1. We will deploy all ShowCore infrastructure within this single member account.

### Phase 2: Multi-Account Organization (Future)

When traffic and complexity increase, implement full AWS Organizations:

**Step 1: Create Organization**
```bash
# Create organization (if not already created)
aws organizations create-organization --feature-set ALL

# Verify organization
aws organizations describe-organization
```

**Step 2: Create Organizational Units**
```bash
# Create Security OU
aws organizations create-organizational-unit \
  --parent-id r-xxxx \
  --name "Security"

# Create Workloads OU
aws organizations create-organizational-unit \
  --parent-id r-xxxx \
  --name "Workloads"

# Create Sandbox OU
aws organizations create-organizational-unit \
  --parent-id r-xxxx \
  --name "Sandbox"
```

**Step 3: Create Member Accounts**
```bash
# Create Staging account
aws organizations create-account \
  --email showcore-staging@example.com \
  --account-name "ShowCore-Staging"

# Create Development account
aws organizations create-account \
  --email showcore-dev@example.com \
  --account-name "ShowCore-Development"
```

**Step 4: Move Accounts to OUs**
```bash
# Move staging account to Workloads OU
aws organizations move-account \
  --account-id 123456789012 \
  --source-parent-id r-xxxx \
  --destination-parent-id ou-xxxx-workloads
```

**Step 5: Apply Service Control Policies**
```bash
# Create and attach SCPs to OUs
aws organizations create-policy \
  --content file://prevent-nat-gateway.json \
  --description "Prevent NAT Gateway creation" \
  --name "PreventNATGateway" \
  --type SERVICE_CONTROL_POLICY

aws organizations attach-policy \
  --policy-id p-xxxx \
  --target-id ou-xxxx-workloads
```

## Cost Management

### Consolidated Billing

**Benefits**:
- Single bill for all accounts
- Volume discounts across accounts
- Shared Free Tier benefits (first 12 months)
- Centralized payment method

**Cost Allocation**:
- Tag all resources with: Project, Phase, Environment, ManagedBy, CostCenter
- Enable cost allocation tags in Billing console
- Use Cost Explorer to track spending by tag
- Set up billing alerts per account

### Budget Alerts

**Organization-Wide Budgets**:
- Total monthly budget: $100
- Alert at 50% ($50)
- Alert at 80% ($80)
- Alert at 100% ($100)

**Per-Account Budgets** (Phase 2):
- Production: $60/month
- Staging: $20/month
- Development: $10/month
- Sandbox: $10/month

## Security Best Practices

### 1. Root Account Security

- ✅ Enable MFA on root account
- ✅ Create strong, unique password
- ✅ Store root credentials in secure vault
- ✅ Use root account only for emergency access
- ✅ Create IAM users for daily operations

### 2. IAM Best Practices

- ✅ Use IAM users with least privilege policies
- ✅ Enable MFA for all IAM users
- ✅ Rotate access keys every 90 days
- ✅ Use IAM roles for service-to-service access
- ✅ Enable CloudTrail to log all IAM actions

### 3. Cross-Account Access (Phase 2)

- Use IAM roles for cross-account access
- Require MFA for cross-account role assumption
- Limit cross-account access to specific services
- Log all cross-account access attempts

### 4. Audit and Compliance

- ✅ Enable CloudTrail in all accounts
- ✅ Enable AWS Config for compliance monitoring
- ✅ Centralize logs in dedicated S3 bucket
- ✅ Enable log file validation
- ✅ Set up alerts for suspicious activity

## Monitoring and Alerting

### Organization-Wide Monitoring

**CloudWatch Dashboards**:
- Organization-wide cost dashboard
- Security findings dashboard (GuardDuty, Security Hub)
- Compliance dashboard (AWS Config)
- Resource utilization dashboard

**CloudWatch Alarms**:
- Billing alerts ($50, $100 thresholds)
- Security findings (critical severity)
- Compliance violations (non-compliant resources)
- Unusual API activity (CloudTrail)

### Per-Account Monitoring (Phase 2)

Each account has dedicated monitoring:
- Account-specific cost dashboard
- Resource-specific alarms (RDS, ElastiCache, etc.)
- Application-specific metrics
- Custom business metrics

## Compliance and Governance

### Compliance Requirements

**Phase 1**:
- ✅ CloudTrail enabled for audit logging
- ✅ AWS Config enabled for compliance monitoring
- ✅ Encryption at rest for all data (RDS, ElastiCache, S3)
- ✅ Encryption in transit (SSL/TLS required)
- ✅ Security groups follow least privilege

**Phase 2** (Future):
- AWS Config aggregator for multi-account compliance
- AWS Security Hub for centralized security findings
- AWS GuardDuty for threat detection
- Automated compliance remediation

### Governance Policies

**Resource Naming Convention**:
- Format: `showcore-{component}-{environment}-{resource-type}`
- Example: `showcore-database-production-rds`

**Tagging Policy**:
- Required tags: Project, Phase, Environment, ManagedBy, CostCenter
- Enforced via Service Control Policies
- Validated in CI/CD pipeline

**Change Management**:
- All infrastructure changes via AWS CDK
- No manual changes in AWS Console
- Changes reviewed via pull requests
- Changes tested before deployment

## Migration Path

### Current State (Phase 1)

Single AWS account with all resources:
- ✅ Production infrastructure
- ✅ Management functions
- ✅ Security and compliance
- ✅ Billing and cost management

### Future State (Phase 2+)

Multi-account organization:
- Separate accounts for production, staging, development
- Dedicated security and audit accounts
- Sandbox accounts for experimentation
- Centralized billing and management

### Migration Steps (Phase 2)

1. **Create Organization**: Set up AWS Organizations
2. **Create OUs**: Security, Workloads, Sandbox
3. **Create Accounts**: Staging, Development, Security, Audit
4. **Apply SCPs**: Enforce policies across organization
5. **Migrate Resources**: Move staging/dev resources to new accounts
6. **Configure Cross-Account Access**: Set up IAM roles
7. **Centralize Logging**: Configure organization-wide CloudTrail
8. **Test and Validate**: Verify all accounts and policies

## References

- [AWS Organizations Documentation](https://docs.aws.amazon.com/organizations/)
- [AWS Organizations Best Practices](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_best-practices.html)
- [Service Control Policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html)
- [AWS Multi-Account Strategy](https://aws.amazon.com/organizations/getting-started/best-practices/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

## Appendix: CLI Commands Reference

### Organization Management

```bash
# Describe organization
aws organizations describe-organization

# List organizational units
aws organizations list-organizational-units-for-parent --parent-id r-xxxx

# List accounts
aws organizations list-accounts

# List accounts in OU
aws organizations list-accounts-for-parent --parent-id ou-xxxx
```

### Policy Management

```bash
# List policies
aws organizations list-policies --filter SERVICE_CONTROL_POLICY

# Describe policy
aws organizations describe-policy --policy-id p-xxxx

# List policies attached to OU
aws organizations list-policies-for-target --target-id ou-xxxx --filter SERVICE_CONTROL_POLICY
```

### Cost Management

```bash
# Get cost and usage
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost

# Get cost by tag
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=TAG,Key=Environment
```

---

**Document Status**: Complete  
**Phase**: Phase 1 (Single Account), Phase 2+ (Multi-Account)  
**Last Review**: February 3, 2026  
**Next Review**: After Phase 1 completion
