# Design Document: ShowCore AWS Migration Phase 1

## Overview

Phase 1 of the ShowCore AWS Migration establishes the foundational AWS infrastructure required to support the migration of ShowCore from on-premises to AWS. This phase focuses on creating a secure, highly available, and cost-optimized cloud environment following AWS Well-Architected Framework principles.

The design implements a multi-tier network architecture with public, private, and isolated subnets across multiple availability zones. Core data services (PostgreSQL and Redis) are migrated to managed AWS services (RDS and ElastiCache), while static assets are moved to S3 with CloudFront CDN for global content delivery. The infrastructure is defined as code using AWS CDK with Python, enabling reproducible deployments and version control.

Key design principles:
- **High Availability**: Multi-AZ deployments for all critical components
- **Security**: Least privilege access, encryption at rest and in transit, network isolation
- **Cost Optimization**: Right-sized resources with lifecycle policies and monitoring
- **Observability**: Comprehensive monitoring, logging, and alerting from day one
- **Automation**: Infrastructure as Code with AWS CDK for consistent deployments

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Account                              │
│                      (123456789012)                              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    VPC (us-east-1)                          │ │
│  │                  CIDR: 10.0.0.0/16                          │ │
│  │                                                              │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │              Availability Zone 1                     │   │ │
│  │  │                                                       │   │ │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │   │ │
│  │  │  │   Public     │  │   Private    │  │ Isolated  │ │   │ │
│  │  │  │   Subnet     │  │   Subnet     │  │  Subnet   │ │   │ │
│  │  │  │ 10.0.0.0/24  │  │ 10.0.2.0/24  │  │10.0.4.0/24│ │   │ │
│  │  │  │              │  │              │  │           │ │   │ │
│  │  │  │ (Future ALB) │  │ RDS Primary  │  │  (Future  │ │   │ │
│  │  │  │              │  │ ElastiCache  │  │   App)    │ │   │ │
│  │  │  └──────────────┘  └──────────────┘  └───────────┘ │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  │                                                              │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │              Availability Zone 2                     │   │ │
│  │  │                                                       │   │ │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │   │ │
│  │  │  │   Public     │  │   Private    │  │ Isolated  │ │   │ │
│  │  │  │   Subnet     │  │   Subnet     │  │  Subnet   │ │   │ │
│  │  │  │ 10.0.1.0/24  │  │ 10.0.3.0/24  │  │10.0.5.0/24│ │   │ │
│  │  │  │              │  │              │  │           │ │   │ │
│  │  │  │ (Future ALB) │  │ (Future      │  │  (Future  │ │   │ │
│  │  │  │              │  │  Expansion)  │  │   App)    │ │   │ │
│  │  │  └──────────────┘  └──────────────┘  └───────────┘ │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  │                                                              │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │              VPC Endpoints                           │   │ │
│  │  │                                                       │   │ │
│  │  │  Gateway Endpoints (FREE):                           │   │ │
│  │  │  • S3                                                │   │ │
│  │  │  • DynamoDB                                          │   │ │
│  │  │                                                       │   │ │
│  │  │  Interface Endpoints (~$7/month each):               │   │ │
│  │  │  • CloudWatch Logs                                   │   │ │
│  │  │  • CloudWatch Monitoring                             │   │ │
│  │  │  • Systems Manager (Session Manager)                 │   │ │
│  │  │  • Secrets Manager (optional)                        │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    S3 Buckets                               │ │
│  │  ┌──────────────────┐  ┌──────────────────┐               │ │
│  │  │  Static Assets   │  │     Backups      │               │ │
│  │  │   (Versioned)    │  │   (Versioned)    │               │ │
│  │  └──────────────────┘  └──────────────────┘               │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      CloudFront CDN                              │
│                   (Global Edge Locations)                        │
│                                                                   │
│              Origin: S3 Static Assets Bucket                     │
└─────────────────────────────────────────────────────────────────┘
```

### Network Architecture

The VPC design follows a cost-optimized architecture using VPC Endpoints instead of NAT Gateways:

1. **Public Subnets** (10.0.0.0/24, 10.0.1.0/24)
   - Internet Gateway attached
   - NO NAT Gateway (cost savings: ~$32/month)
   - Future: Application Load Balancers
   - Route: 0.0.0.0/0 → Internet Gateway

2. **Private Subnets** (10.0.2.0/24, 10.0.3.0/24)
   - RDS PostgreSQL instance (single AZ)
   - ElastiCache Redis node (single AZ)
   - NO direct internet access (no NAT Gateway route)
   - AWS service access via VPC Endpoints only
   - Route: AWS services → VPC Endpoints

3. **VPC Endpoints** (Cost-Optimized AWS Service Access)
   - **Gateway Endpoints (FREE)**:
     - S3: For backups, logs, and static assets
     - DynamoDB: For future use
   - **Interface Endpoints (~$7/month each)**:
     - CloudWatch Logs: For application and infrastructure logging
     - CloudWatch Monitoring: For metrics and alarms
     - Systems Manager: For Session Manager access (no SSH keys needed)
     - Secrets Manager: Optional, if storing database credentials

**Management Philosophy**:
- Hands-on management and control (learning-focused)
- Manual system updates and patching for RDS/ElastiCache
- Direct infrastructure management vs fully managed services
- Cost optimization prioritized over convenience
- No outbound internet access from private subnets

**Trade-offs**:
- ✅ Lower cost (~$32/month savings by eliminating NAT Gateway)
- ✅ More hands-on management experience
- ✅ Better security (no internet access from private subnets)
- ✅ Gateway Endpoints are FREE (S3, DynamoDB)
- ⚠️ Manual patching required for RDS/ElastiCache
- ⚠️ Interface Endpoint costs (~$7/month per endpoint)
- ⚠️ More complex networking setup
- ⚠️ Limited to AWS services accessible via VPC Endpoints

Note: Isolated subnets removed for cost optimization. Application tier will use private subnets.

Each tier spans two availability zones for future scalability, but resources initially deployed in single AZ.

### Security Architecture

**Defense in Depth Strategy:**

1. **Network Layer**
   - VPC isolation with private subnets for data tier
   - Security Groups as stateful firewalls
   - Network ACLs for subnet-level filtering
   - VPC Flow Logs for traffic analysis

2. **Data Layer**
   - Encryption at rest using AWS KMS with automatic key rotation
   - Encryption in transit using TLS 1.2+
   - Database authentication using IAM where possible
   - Secrets stored in AWS Secrets Manager

3. **Access Control**
   - IAM roles with least privilege policies
   - MFA required for sensitive operations
   - CloudTrail logging all API calls
   - AWS Config for compliance monitoring

4. **Monitoring**
   - GuardDuty for threat detection
   - CloudWatch alarms for anomalous behavior
   - AWS Security Hub for centralized security findings

### VPC Endpoint Architecture

**Cost-Optimized AWS Service Access**

Instead of using NAT Gateways (~$32/month), the architecture uses VPC Endpoints to provide secure, private connectivity to AWS services. This approach offers:

- **Cost Savings**: Eliminates NAT Gateway costs (~$32/month)
- **Better Security**: No internet access from private subnets
- **Simplified Management**: Direct AWS service access without routing through NAT

**Gateway Endpoints (FREE)**

Gateway Endpoints use route table entries to route traffic to AWS services. They are free and highly available.

1. **S3 Gateway Endpoint**
   - Purpose: Access S3 for backups, logs, and static assets
   - Cost: FREE
   - Configuration: Added to private subnet route tables
   - Use cases: RDS backups to S3, application logs to S3

2. **DynamoDB Gateway Endpoint**
   - Purpose: Future use for application data
   - Cost: FREE
   - Configuration: Added to private subnet route tables
   - Use cases: Reserved for future application needs

**Interface Endpoints (~$7/month each)**

Interface Endpoints use Elastic Network Interfaces (ENIs) with private IP addresses in your VPC. Each endpoint costs ~$7/month plus data processing charges.

1. **CloudWatch Logs Interface Endpoint**
   - Purpose: Send logs from RDS, ElastiCache, and future applications
   - Cost: ~$7/month
   - Configuration: ENI in each private subnet AZ
   - Security: VPC Endpoint security group allows HTTPS from VPC

2. **CloudWatch Monitoring Interface Endpoint**
   - Purpose: Send metrics and alarms from infrastructure
   - Cost: ~$7/month
   - Configuration: ENI in each private subnet AZ
   - Security: VPC Endpoint security group allows HTTPS from VPC

3. **Systems Manager Interface Endpoint**
   - Purpose: Session Manager access to instances without SSH keys
   - Cost: ~$7/month
   - Configuration: ENI in each private subnet AZ
   - Security: VPC Endpoint security group allows HTTPS from VPC
   - Benefits: Secure shell access, no bastion hosts needed

4. **Secrets Manager Interface Endpoint (Optional)**
   - Purpose: Retrieve database credentials securely
   - Cost: ~$7/month
   - Configuration: ENI in each private subnet AZ
   - Security: VPC Endpoint security group allows HTTPS from VPC
   - Note: Can be added later if needed

**VPC Endpoint Security**

All Interface Endpoints use a dedicated security group:

```python
vpc_endpoint_sg = {
    "name": "vpc-endpoint-sg",
    "ingress": [
        {
            "protocol": "tcp",
            "port": 443,
            "source": "10.0.0.0/16",  # All VPC traffic
            "description": "HTTPS from VPC for AWS service access"
        }
    ],
    "egress": []  # No outbound rules needed
}
```

**Private Subnet Routing**

Private subnets have NO internet access. All AWS service traffic routes through VPC Endpoints:

```python
private_route_table = {
    "routes": [
        # NO default route to NAT Gateway or Internet Gateway
        # Gateway Endpoints automatically add routes for S3 and DynamoDB
        {
            "destination": "pl-63a5400a",  # S3 prefix list
            "target": "vpce-s3-gateway-id"
        },
        {
            "destination": "pl-02cd2c6b",  # DynamoDB prefix list
            "target": "vpce-dynamodb-gateway-id"
        }
    ]
}
```

**Management Implications**

This architecture requires hands-on management:

1. **Manual Patching**: RDS and ElastiCache cannot download patches from the internet
   - RDS: AWS manages patching during maintenance windows
   - ElastiCache: AWS manages patching during maintenance windows
   - No action required - AWS handles this automatically

2. **Application Updates**: Future application instances cannot download packages from the internet
   - Solution: Use S3 to host packages, access via S3 Gateway Endpoint
   - Solution: Use Systems Manager to manage instances
   - Solution: Pre-bake AMIs with required packages

3. **Third-Party APIs**: Applications cannot call external APIs
   - Solution: Use API Gateway or Lambda in public subnets as proxy
   - Solution: Add NAT Gateway if external API access becomes critical
   - Trade-off: This is acceptable for Phase 1 (data layer only)

**Cost-Benefit Analysis**

| Item | NAT Gateway Architecture | VPC Endpoint Architecture | Savings |
|------|-------------------------|---------------------------|---------|
| NAT Gateway | ~$32/month | $0 | +$32 |
| Gateway Endpoints | $0 | $0 | $0 |
| Interface Endpoints (3-4) | $0 | ~$21-28/month | -$21-28 |
| **Net Monthly Cost** | **~$32/month** | **~$21-28/month** | **~$4-11/month** |
| **Security** | Internet access | No internet access | Better |
| **Management** | Automatic updates | Manual management | More hands-on |

## Components and Interfaces

### 1. VPC and Networking Components

**VPC Stack**
- **VPC**: 10.0.0.0/16 CIDR block (65,536 IPs)
- **Internet Gateway**: Enables internet access for public subnets
- **NO NAT Gateway**: Eliminated to save ~$32/month
- **VPC Endpoints**: Cost-optimized AWS service access
- **Route Tables**: Separate route tables for public and private subnets
- **VPC Flow Logs**: Optional (can add later if needed, incurs CloudWatch Logs costs)

**VPC Endpoint Configuration**
```python
# Gateway Endpoints (FREE)
gateway_endpoints = {
    "s3": {
        "service": "com.amazonaws.us-east-1.s3",
        "type": "Gateway",
        "route_table_ids": ["private_route_table_1", "private_route_table_2"],
        "cost": "$0/month"
    },
    "dynamodb": {
        "service": "com.amazonaws.us-east-1.dynamodb",
        "type": "Gateway",
        "route_table_ids": ["private_route_table_1", "private_route_table_2"],
        "cost": "$0/month"
    }
}

# Interface Endpoints (~$7/month each)
interface_endpoints = {
    "cloudwatch_logs": {
        "service": "com.amazonaws.us-east-1.logs",
        "type": "Interface",
        "subnet_ids": ["private_subnet_1a", "private_subnet_1b"],
        "security_group": "vpc_endpoint_sg",
        "cost": "~$7/month"
    },
    "cloudwatch_monitoring": {
        "service": "com.amazonaws.us-east-1.monitoring",
        "type": "Interface",
        "subnet_ids": ["private_subnet_1a", "private_subnet_1b"],
        "security_group": "vpc_endpoint_sg",
        "cost": "~$7/month"
    },
    "ssm": {
        "service": "com.amazonaws.us-east-1.ssm",
        "type": "Interface",
        "subnet_ids": ["private_subnet_1a", "private_subnet_1b"],
        "security_group": "vpc_endpoint_sg",
        "cost": "~$7/month"
    },
    "secrets_manager": {  # Optional
        "service": "com.amazonaws.us-east-1.secretsmanager",
        "type": "Interface",
        "subnet_ids": ["private_subnet_1a", "private_subnet_1b"],
        "security_group": "vpc_endpoint_sg",
        "cost": "~$7/month",
        "optional": True
    }
}
```

**Subnet Configuration**
```python
# Public Subnets (256 IPs each)
public_subnet_1a: 10.0.0.0/24  # AZ us-east-1a
public_subnet_1b: 10.0.1.0/24  # AZ us-east-1b

# Private Subnets (256 IPs each) - NO internet access
private_subnet_1a: 10.0.2.0/24  # AZ us-east-1a (RDS, ElastiCache, future app tier)
private_subnet_1b: 10.0.3.0/24  # AZ us-east-1b (future expansion)
```

**Security Groups**
```python
# VPC Endpoint Security Group
vpc_endpoint_sg = {
    "ingress": [
        {
            "protocol": "tcp",
            "port": 443,
            "source": "10.0.0.0/16",  # All VPC traffic
            "description": "HTTPS from VPC for AWS service access"
        }
    ],
    "egress": []  # No outbound rules needed
}

# RDS Security Group
rds_sg = {
    "ingress": [
        {
            "protocol": "tcp",
            "port": 5432,
            "source": "app_sg",  # Future application security group
            "description": "PostgreSQL from application tier"
        }
    ],
    "egress": []  # No outbound rules needed
}

# ElastiCache Security Group
elasticache_sg = {
    "ingress": [
        {
            "protocol": "tcp",
            "port": 6379,
            "source": "app_sg",  # Future application security group
            "description": "Redis from application tier"
        }
    ],
    "egress": []  # No outbound rules needed
}
```

### 2. RDS PostgreSQL Component

**Instance Configuration**
- **Engine**: PostgreSQL 16.x
- **Instance Class**: db.t3.micro (2 vCPU, 1 GB RAM) - Free Tier eligible for 750 hours/month
- **Storage**: 20 GB gp3 SSD (Free Tier includes 20 GB)
- **Multi-AZ**: Disabled (not Free Tier eligible, can enable later if needed)
- **Backup Window**: 03:00-04:00 UTC (off-peak hours)
- **Maintenance Window**: Sunday 04:00-05:00 UTC

**High Availability Configuration**
- Single instance in us-east-1a (cost optimization for low-traffic project)
- Automated backups provide recovery capability
- Can enable Multi-AZ later if traffic increases
- Manual snapshots before major changes

**Backup Strategy**
- Automated daily backups with 7-day retention
- Manual snapshots before major changes
- Point-in-time recovery enabled (5-minute granularity)
- Cross-region backup replication to us-west-2

**Performance Monitoring**
- Performance Insights enabled (7-day retention)
- Enhanced Monitoring (60-second granularity)
- CloudWatch metrics: CPU, memory, connections, IOPS, latency

**Connection Interface**
```python
rds_connection = {
    "endpoint": "showcore-db.cluster-xxxxx.us-east-1.rds.amazonaws.com",
    "port": 5432,
    "database": "showcore",
    "ssl_mode": "require",
    "connection_timeout": 30,
    "max_connections": 100
}
```

### 3. ElastiCache Redis Component

**Cluster Configuration**
- **Engine**: Redis 7.x
- **Node Type**: cache.t3.micro (2 vCPU, 0.5 GB RAM) - Free Tier eligible for 750 hours/month
- **Cluster Mode**: Disabled (single node for cost optimization)
- **Nodes**: 1 node (no replicas for low-traffic project)
- **Automatic Failover**: Not applicable (single node)
- **Backup Window**: 03:00-04:00 UTC

**High Availability Configuration**
- Single node in us-east-1a (cost optimization)
- Automated snapshots provide recovery capability
- Can add replicas later if traffic increases
- Acceptable downtime for low-traffic project website

**Backup Strategy**
- Daily automated snapshots with 7-day retention
- Manual snapshots before major changes
- Snapshots stored in S3

**Performance Monitoring**
- CloudWatch metrics: CPU, memory, evictions, connections, cache hits/misses
- Alarms for high memory utilization (>80%)
- Alarms for high CPU utilization (>75%)

**Connection Interface**
```python
redis_connection = {
    "configuration_endpoint": "showcore-redis.xxxxx.clustercfg.use1.cache.amazonaws.com",
    "port": 6379,
    "tls_enabled": True,
    "connection_timeout": 5,
    "max_connections": 50
}
```

### 4. S3 and CloudFront Components

**S3 Bucket: Static Assets**
- **Bucket Name**: showcore-static-assets-{account-id}
- **Versioning**: Enabled
- **Encryption**: AES-256 (SSE-S3) - Free
- **Lifecycle Policy**: 
  - Delete old versions after 90 days
- **Access**: Private (CloudFront only)
- **Replication**: Disabled (cost optimization, can enable if needed)

**S3 Bucket: Backups**
- **Bucket Name**: showcore-backups-{account-id}
- **Versioning**: Enabled
- **Encryption**: AES-256 (SSE-S3) - Free (KMS adds cost)
- **Lifecycle Policy**:
  - Transition to Glacier Flexible Retrieval after 30 days
  - Delete after 90 days (short retention for low-traffic project)
- **Access**: Private (IAM only)
- **Replication**: Disabled (cost optimization)

**CloudFront Distribution**
- **Origin**: S3 static assets bucket
- **Price Class**: Use only North America and Europe (PriceClass_100) - lowest cost
- **SSL/TLS**: TLS 1.2 minimum (Free with AWS Certificate Manager)
- **Caching**: 
  - Default TTL: 86400 seconds (24 hours)
  - Max TTL: 31536000 seconds (1 year)
  - Cache based on query strings and headers as needed
- **Compression**: Automatic compression enabled (Free)
- **Access Logs**: Disabled initially (incurs S3 storage costs, can enable if needed)
- **Origin Access Control**: CloudFront OAC for secure S3 access (Free)

**Interface**
```python
cloudfront_config = {
    "distribution_id": "E1234EXAMPLE",
    "domain_name": "d1234example.cloudfront.net",
    "custom_domain": "cdn.showcore.com",  # Future: custom domain
    "cache_behaviors": {
        "default": {
            "ttl": 86400,
            "compress": True,
            "viewer_protocol_policy": "redirect-to-https"
        }
    }
}
```

### 5. Monitoring and Alerting Components

**CloudWatch Dashboard**
- **RDS Metrics**: CPU, connections, read/write latency, storage, replication lag
- **ElastiCache Metrics**: CPU, memory, evictions, cache hit rate, connections
- **S3 Metrics**: Bucket size, request count, 4xx/5xx errors
- **CloudFront Metrics**: Requests, data transfer, cache hit rate, error rate
- **VPC Metrics**: NAT Gateway bandwidth, VPC Flow Logs insights

**SNS Topics**
```python
sns_topics = {
    "critical_alerts": {
        "name": "showcore-critical-alerts",
        "subscribers": ["admin@showcore.com", "oncall@showcore.com"]
    },
    "warning_alerts": {
        "name": "showcore-warning-alerts",
        "subscribers": ["devops@showcore.com"]
    },
    "billing_alerts": {
        "name": "showcore-billing-alerts",
        "subscribers": ["finance@showcore.com", "admin@showcore.com"]
    }
}
```

**CloudWatch Alarms**
```python
alarms = {
    "rds_cpu_high": {
        "metric": "CPUUtilization",
        "threshold": 80,
        "evaluation_periods": 2,
        "period": 300,
        "statistic": "Average",
        "action": "critical_alerts"
    },
    "rds_storage_high": {
        "metric": "FreeStorageSpace",
        "threshold": 15,  # 15% free space remaining
        "evaluation_periods": 1,
        "period": 300,
        "statistic": "Average",
        "action": "warning_alerts"
    },
    "elasticache_memory_high": {
        "metric": "DatabaseMemoryUsagePercentage",
        "threshold": 80,
        "evaluation_periods": 2,
        "period": 300,
        "statistic": "Average",
        "action": "critical_alerts"
    },
    "billing_threshold_500": {
        "metric": "EstimatedCharges",
        "threshold": 500,
        "evaluation_periods": 1,
        "period": 21600,  # 6 hours
        "statistic": "Maximum",
        "action": "billing_alerts"
    },
    "billing_threshold_1000": {
        "metric": "EstimatedCharges",
        "threshold": 1000,
        "evaluation_periods": 1,
        "period": 21600,
        "statistic": "Maximum",
        "action": "billing_alerts"
    }
}
```

### 6. Backup and Disaster Recovery Components

**AWS Backup Configuration**
```python
backup_plan = {
    "name": "showcore-phase1-backup-plan",
    "rules": [
        {
            "name": "daily-backups",
            "schedule": "cron(0 3 * * ? *)",  # 3 AM UTC daily
            "lifecycle": {
                "delete_after_days": 30
            },
            "copy_actions": [
                {
                    "destination_region": "us-west-2",
                    "lifecycle": {
                        "delete_after_days": 30
                    }
                }
            ]
        }
    ],
    "selections": [
        {
            "name": "rds-instances",
            "resources": ["arn:aws:rds:us-east-1:*:db:showcore-*"]
        },
        {
            "name": "elasticache-clusters",
            "resources": ["arn:aws:elasticache:us-east-1:*:cluster:showcore-*"]
        }
    ]
}
```

**Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)**
- **RDS**: RTO < 30 minutes, RPO < 5 minutes (point-in-time recovery)
- **ElastiCache**: RTO < 15 minutes, RPO < 24 hours (daily snapshots)
- **S3**: RTO < 5 minutes (versioning), RPO = 0 (immediate replication)

### 7. Infrastructure as Code Components

**AWS CDK Stack Structure**
```python
# Stack hierarchy
ShowCorePhase1Stack
├── NetworkStack (VPC, subnets, NAT gateways)
├── SecurityStack (Security groups, KMS keys)
├── DatabaseStack (RDS PostgreSQL)
├── CacheStack (ElastiCache Redis)
├── StorageStack (S3 buckets)
├── CDNStack (CloudFront distribution)
├── MonitoringStack (CloudWatch dashboards, alarms, SNS topics)
└── BackupStack (AWS Backup plans and vaults)
```

**CDK Configuration**
```python
cdk_config = {
    "app_name": "showcore",
    "environment": "production",
    "region": "us-east-1",
    "account": "123456789012",  # Use environment variable in actual deployment
    "tags": {
        "Project": "ShowCore",
        "Phase": "Phase1",
        "Environment": "Production",
        "ManagedBy": "CDK",
        "CostCenter": "Engineering"
    }
}
```

## Data Models

### Cost Optimization Summary

**Estimated Monthly Costs (Low Traffic)**:
- **RDS db.t3.micro**: $0 (Free Tier: 750 hours/month for 12 months)
- **ElastiCache cache.t3.micro**: $0 (Free Tier: 750 hours/month for 12 months)
- **VPC Endpoints**:
  - Gateway Endpoints (S3, DynamoDB): $0 (FREE)
  - Interface Endpoints (3-4 endpoints): ~$21-28/month ($7/month each)
    - CloudWatch Logs: ~$7/month
    - CloudWatch Monitoring: ~$7/month
    - Systems Manager: ~$7/month
    - Secrets Manager (optional): ~$7/month
- **S3 Storage**: ~$1-5/month (depends on usage, first 5 GB free)
- **CloudFront**: ~$1-5/month (first 1 TB free, then $0.085/GB)
- **Data Transfer**: ~$0-5/month (first 100 GB free)
- **CloudWatch**: ~$0-5/month (basic metrics free, alarms $0.10 each)
- **VPC**: $0 (VPC itself is free)
- **Total Estimated**: ~$3-10/month during Free Tier, ~$49-60/month after

**Cost Savings vs NAT Gateway Architecture**:
- NAT Gateway eliminated: **-$32/month savings**
- VPC Endpoints added: **+$21-28/month cost**
- **Net savings: ~$4-11/month**
- **Additional benefits**: Better security, no internet access from private subnets

**Free Tier Benefits (First 12 Months)**:
- RDS: 750 hours/month of db.t3.micro
- ElastiCache: 750 hours/month of cache.t3.micro
- S3: 5 GB standard storage, 20,000 GET requests, 2,000 PUT requests
- CloudFront: 1 TB data transfer out, 10,000,000 HTTP/HTTPS requests
- Data Transfer: 100 GB/month out to internet
- CloudWatch: 10 custom metrics, 10 alarms

**Cost Optimization Strategies**:
1. Single AZ deployment (no Multi-AZ costs)
2. Free Tier eligible instance types (t3.micro)
3. NO NAT Gateway (~$32/month savings)
4. Gateway Endpoints for S3 and DynamoDB (FREE)
5. Minimal Interface Endpoints (only essential services)
6. No cross-region replication
7. Shorter backup retention (7 days vs 30 days)
8. CloudFront PriceClass_100 (cheapest regions only)
9. Minimal CloudWatch alarms (only critical ones)
10. No VPC Flow Logs initially (can add later)
11. S3 SSE-S3 encryption (free) instead of KMS ($1/key/month)
12. No GuardDuty initially ($4.62/month minimum)

**After Free Tier Expires (Month 13+)**:
- RDS db.t3.micro: ~$15/month
- ElastiCache cache.t3.micro: ~$12/month
- VPC Endpoints: ~$21-28/month
- Other costs remain the same
- **Total Estimated**: ~$49-60/month

**Management Trade-offs**:
- ✅ Lower cost (~$32/month NAT Gateway savings)
- ✅ More hands-on management experience
- ✅ Better security (no internet access from private subnets)
- ✅ Gateway Endpoints are FREE
- ⚠️ Manual patching required for RDS/ElastiCache
- ⚠️ Interface Endpoint costs (~$7/month per endpoint)
- ⚠️ More complex networking setup
- ⚠️ Limited to AWS services accessible via VPC Endpoints

### Infrastructure State Model

The infrastructure state is managed by AWS CDK and stored in CloudFormation stacks. Key state includes:

```python
class InfrastructureState:
    """Represents the state of Phase 1 infrastructure"""
    
    vpc_id: str
    vpc_cidr: str
    
    # Subnets
    public_subnet_ids: List[str]
    private_subnet_ids: List[str]
    isolated_subnet_ids: List[str]
    
    # Security Groups
    rds_security_group_id: str
    elasticache_security_group_id: str
    
    # RDS
    rds_cluster_endpoint: str
    rds_cluster_reader_endpoint: str
    rds_cluster_arn: str
    rds_secret_arn: str  # Credentials in Secrets Manager
    
    # ElastiCache
    elasticache_configuration_endpoint: str
    elasticache_cluster_arn: str
    
    # S3
    static_assets_bucket_name: str
    static_assets_bucket_arn: str
    backups_bucket_name: str
    backups_bucket_arn: str
    
    # CloudFront
    cloudfront_distribution_id: str
    cloudfront_domain_name: str
    
    # Monitoring
    dashboard_url: str
    critical_alerts_topic_arn: str
    warning_alerts_topic_arn: str
    billing_alerts_topic_arn: str
    
    # Backup
    backup_vault_arn: str
    backup_plan_id: str
```

### Resource Tagging Model

All resources follow a consistent tagging strategy for cost allocation and management:

```python
class ResourceTags:
    """Standard tags applied to all resources"""
    
    Project: str = "ShowCore"
    Phase: str = "Phase1"
    Environment: str  # "Production", "Staging", "Development"
    ManagedBy: str = "CDK"
    CostCenter: str = "Engineering"
    Component: str  # "Network", "Database", "Cache", "Storage", "CDN"
    BackupRequired: bool
    Compliance: str  # "Required", "Optional"
```

### Configuration Model

Infrastructure configuration is parameterized for different environments:

```python
class EnvironmentConfig:
    """Environment-specific configuration"""
    
    # Network
    vpc_cidr: str = "10.0.0.0/16"
    availability_zones: List[str] = ["us-east-1a", "us-east-1b"]
    enable_nat_gateway: bool = False  # Cost optimization - use VPC Endpoints instead
    enable_vpc_endpoints: bool = True  # Use VPC Endpoints for AWS service access
    vpc_endpoint_services: List[str] = [
        "s3",  # Gateway Endpoint (FREE)
        "dynamodb",  # Gateway Endpoint (FREE)
        "logs",  # Interface Endpoint (~$7/month)
        "monitoring",  # Interface Endpoint (~$7/month)
        "ssm",  # Interface Endpoint (~$7/month)
        # "secretsmanager",  # Optional Interface Endpoint (~$7/month)
    ]
    
    # RDS
    rds_instance_class: str = "db.t3.micro"  # Free Tier eligible
    rds_allocated_storage: int = 20  # Free Tier includes 20 GB
    rds_max_allocated_storage: int = 100
    rds_backup_retention_days: int = 7
    rds_multi_az: bool = False  # Cost optimization
    
    # ElastiCache
    elasticache_node_type: str = "cache.t3.micro"  # Free Tier eligible
    elasticache_num_cache_nodes: int = 1  # Single node for cost optimization
    
    # S3
    s3_versioning_enabled: bool = True
    s3_replication_enabled: bool = False  # Cost optimization
    s3_lifecycle_enabled: bool = True
    
    # CloudFront
    cloudfront_price_class: str = "PriceClass_100"  # North America and Europe only
    cloudfront_default_ttl: int = 86400
    cloudfront_logging_enabled: bool = False  # Cost optimization
    
    # Monitoring
    alarm_email_addresses: List[str]
    billing_alert_thresholds: List[int] = [50, 100]  # Lower thresholds for project
    enable_detailed_monitoring: bool = False  # Cost optimization
    
    # Backup
    backup_retention_days: int = 7  # Shorter retention for project
    backup_cross_region: bool = False  # Cost optimization
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

For infrastructure as code, properties validate that deployed resources match specifications and maintain security, availability, and cost optimization requirements. Most infrastructure properties are examples (specific configurations) rather than universal properties, as infrastructure is largely declarative.

### Property 1: Security Group Least Privilege

*For any* security group created by the ShowCore infrastructure, the security group should not have overly permissive ingress rules (0.0.0.0/0 access on database ports 5432, 6379, or SSH port 22).

**Validates: Requirements 6.2**

### Property 2: Resource Tagging Compliance

*For any* AWS resource created by the ShowCore Phase 1 infrastructure, the resource should have all required cost allocation tags: Project, Phase, Environment, ManagedBy, and CostCenter.

**Validates: Requirements 9.4**

### Infrastructure Configuration Examples

The following are specific configuration validations that should be verified after deployment:

**Network Configuration (Requirement 2)**
- VPC exists in us-east-1 with CIDR >= /22 (1024+ IPs)
- Public subnets exist in 2+ AZs with Internet Gateway routes
- Private subnets exist in 2+ AZs with NAT Gateway routes
- Isolated subnets exist in 2+ AZs with no internet routes
- VPC Flow Logs enabled and publishing

**Database Configuration (Requirement 3)**
- RDS PostgreSQL 16 instance exists with Multi-AZ enabled
- RDS deployed in private subnets across multiple AZs
- RDS security group allows only authorized sources on port 5432
- RDS automated backups enabled with >= 7 day retention
- RDS encryption at rest enabled with KMS
- RDS SSL/TLS required for connections
- CloudWatch alarms exist for CPU (>80%) and storage (>85%)
- Performance Insights enabled

**Cache Configuration (Requirement 4)**
- ElastiCache Redis 7 cluster exists with cluster mode enabled
- ElastiCache deployed in private subnets across multiple AZs
- ElastiCache security group allows only authorized sources on port 6379
- ElastiCache encryption at rest and in transit enabled
- ElastiCache automatic failover enabled
- CloudWatch alarms exist for CPU (>75%) and memory (>80%)
- Daily automated backups enabled with >= 7 day retention

**Storage and CDN Configuration (Requirement 5)**
- S3 static assets bucket exists with versioning enabled
- S3 backups bucket exists with versioning enabled
- S3 buckets have KMS encryption enabled
- S3 bucket policies prevent public access (except via CloudFront)
- CloudFront distribution exists with S3 static assets as origin
- CloudFront configured for HTTPS-only
- CloudFront access logging enabled
- S3 lifecycle policies configured for backups bucket
- S3 cross-region replication enabled

**Security Configuration (Requirement 6)**
- IAM user showcore-app exists with ShowCoreDeploymentPolicy
- AWS Config enabled and recording
- KMS keys exist with automatic rotation enabled
- CloudTrail enabled for all regions
- GuardDuty enabled
- Systems Manager Session Manager configured

**Monitoring Configuration (Requirement 7)**
- CloudWatch dashboards exist for Phase 1 components
- SNS topics exist for critical, warning, and billing alerts
- CloudWatch alarms configured with <= 5 minute evaluation periods
- CloudWatch log groups have >= 30 day retention

**Backup Configuration (Requirement 8)**
- AWS Backup vault exists
- Backup plan includes RDS with daily schedule
- Backup plan includes ElastiCache with daily schedule
- RDS backup retention >= 30 days
- ElastiCache backup retention >= 7 days
- Cross-region backup replication configured
- Backup failure alarms configured

**Billing Configuration (Requirement 1)**
- AWS Organizations structure established
- Billing alarms exist for $500 and $1000 thresholds
- Cost allocation tags activated
- CloudTrail enabled

**Infrastructure as Code Configuration (Requirement 10)**
- CDK infrastructure code exists in Python
- CloudFormation stacks exist for all components
- Infrastructure code supports multiple environments
- Validation scripts exist for syntax checking

## Error Handling

### Deployment Failures

**CDK Deployment Errors**
- **Cause**: Invalid configuration, insufficient permissions, resource limits
- **Handling**: 
  - CDK will automatically rollback failed stacks
  - CloudFormation events provide detailed error messages
  - Use `cdk diff` before deployment to preview changes
  - Validate IAM permissions before deployment

**Resource Creation Failures**
- **Cause**: Service limits, availability zone capacity, naming conflicts
- **Handling**:
  - Request service limit increases proactively
  - Use multiple AZs for redundancy
  - Generate unique resource names with account ID suffix
  - Implement retry logic with exponential backoff

### Operational Failures

**RDS Failover**
- **Cause**: Primary instance failure, AZ outage, maintenance
- **Handling**:
  - Multi-AZ automatically fails over to standby (<2 minutes)
  - Application should implement connection retry logic
  - CloudWatch alarms notify administrators
  - DNS endpoint remains the same (no application changes needed)

**ElastiCache Failover**
- **Cause**: Node failure, AZ outage
- **Handling**:
  - Cluster mode with replicas automatically promotes replica (<1 minute)
  - Application should implement Redis client retry logic
  - CloudWatch alarms notify administrators
  - Configuration endpoint remains the same

**VPC Endpoint Failure**
- **Cause**: VPC Endpoint outage, service disruption
- **Handling**:
  - Interface Endpoints deployed in multiple AZs for redundancy
  - Gateway Endpoints are highly available by design
  - CloudWatch alarms monitor VPC Endpoint health
  - If endpoint fails, AWS services become temporarily unavailable
  - No impact on application functionality (only logging/monitoring affected)

**S3 and CloudFront Failures**
- **Cause**: Regional outage (extremely rare)
- **Handling**:
  - S3 has 99.999999999% durability (11 nines)
  - CloudFront automatically routes to healthy edge locations
  - Cross-region replication provides disaster recovery
  - Versioning protects against accidental deletions

### Security Incidents

**Unauthorized Access Attempts**
- **Detection**: GuardDuty alerts, CloudTrail logs, VPC Flow Logs
- **Response**:
  - Automated alerts to security team via SNS
  - Review CloudTrail logs for API calls
  - Rotate compromised credentials immediately
  - Update security group rules if needed
  - Enable MFA delete on S3 buckets

**Data Breach**
- **Prevention**: Encryption at rest and in transit, private subnets, security groups
- **Detection**: GuardDuty, AWS Config compliance checks
- **Response**:
  - Isolate affected resources
  - Review access logs and CloudTrail
  - Notify stakeholders per incident response plan
  - Restore from backups if data corrupted

### Cost Overruns

**Unexpected Cost Increases**
- **Detection**: CloudWatch billing alarms, Cost Anomaly Detection
- **Response**:
  - Review Cost Explorer for cost breakdown
  - Check for misconfigured resources (oversized instances, unnecessary data transfer)
  - Implement additional cost controls (budgets, service quotas)
  - Scale down non-production resources

**Resource Sprawl**
- **Prevention**: Consistent tagging, regular audits
- **Detection**: AWS Config rules, tag compliance checks
- **Response**:
  - Identify untagged or orphaned resources
  - Terminate unused resources
  - Implement automated cleanup policies

### Backup and Recovery Failures

**Backup Job Failures**
- **Cause**: Insufficient permissions, storage limits, resource unavailability
- **Detection**: AWS Backup job status, CloudWatch alarms
- **Response**:
  - Review backup job logs for error details
  - Verify IAM permissions for backup service
  - Check storage quotas and limits
  - Manually trigger backup if needed

**Recovery Failures**
- **Cause**: Corrupted backups, insufficient resources, configuration errors
- **Handling**:
  - Test recovery procedures regularly (quarterly)
  - Maintain multiple backup copies (daily, weekly, monthly)
  - Document recovery procedures in runbooks
  - Use point-in-time recovery for RDS when possible

## Testing Strategy

### Infrastructure Testing Approach

Infrastructure as Code requires a different testing approach than application code. The testing strategy combines:

1. **Static Analysis**: Validate infrastructure code syntax and best practices
2. **Configuration Validation**: Verify deployed resources match specifications
3. **Integration Testing**: Validate connectivity and functionality between components
4. **Compliance Testing**: Ensure security and cost optimization requirements are met

### Unit Tests (Configuration Validation)

Unit tests for infrastructure validate that specific resources are configured correctly after deployment. These tests query AWS APIs to verify resource properties.

**Test Framework**: Python with boto3 and pytest

**Test Categories**:

1. **Network Tests**
   - Verify VPC exists with correct CIDR
   - Verify subnets exist in correct AZs with correct CIDR blocks
   - Verify route tables have correct routes
   - Verify NO NAT Gateways exist (cost optimization)
   - Verify VPC Endpoints exist for required services (S3, DynamoDB, CloudWatch, SSM)
   - Verify Gateway Endpoints (S3, DynamoDB) are configured in route tables
   - Verify Interface Endpoints have correct security groups
   - Verify VPC Flow Logs are enabled (optional)

2. **Database Tests**
   - Verify RDS instance exists with PostgreSQL 16
   - Verify Multi-AZ is enabled
   - Verify encryption at rest is enabled
   - Verify backup retention is >= 7 days
   - Verify Performance Insights is enabled
   - Verify security group rules are correct

3. **Cache Tests**
   - Verify ElastiCache cluster exists with Redis 7
   - Verify cluster mode is enabled
   - Verify encryption at rest and in transit
   - Verify automatic failover is enabled
   - Verify backup retention is >= 7 days

4. **Storage Tests**
   - Verify S3 buckets exist with versioning
   - Verify S3 encryption is enabled
   - Verify bucket policies prevent public access
   - Verify lifecycle policies are configured
   - Verify cross-region replication is enabled

5. **CDN Tests**
   - Verify CloudFront distribution exists
   - Verify origin is correct S3 bucket
   - Verify HTTPS-only policy
   - Verify access logging is enabled

6. **Security Tests**
   - Verify CloudTrail is enabled
   - Verify AWS Config is recording
   - Verify GuardDuty is enabled
   - Verify KMS keys have rotation enabled
   - Verify no security groups have 0.0.0.0/0 on sensitive ports

7. **Monitoring Tests**
   - Verify CloudWatch dashboards exist
   - Verify SNS topics exist with subscriptions
   - Verify CloudWatch alarms exist for critical metrics
   - Verify log retention is >= 30 days

8. **Backup Tests**
   - Verify AWS Backup vault exists
   - Verify backup plans include RDS and ElastiCache
   - Verify backup retention meets requirements
   - Verify cross-region replication is configured

**Example Unit Test**:
```python
def test_rds_multi_az_enabled():
    """Verify RDS instance has Multi-AZ enabled"""
    rds = boto3.client('rds', region_name='us-east-1')
    response = rds.describe_db_instances(
        DBInstanceIdentifier='showcore-db'
    )
    instance = response['DBInstances'][0]
    assert instance['MultiAZ'] == True, "RDS Multi-AZ should be enabled"
```

### Property-Based Tests

Property-based tests validate universal properties that should hold across all resources.

**Property Test 1: Security Group Least Privilege**
- **Property**: No security group should have 0.0.0.0/0 access on database ports (5432, 6379) or SSH (22)
- **Test**: Query all security groups, verify no overly permissive rules
- **Iterations**: Single pass (query all security groups)
- **Tag**: Feature: showcore-aws-migration-phase1, Property 1: Security Group Least Privilege

**Property Test 2: Resource Tagging Compliance**
- **Property**: All resources should have required tags (Project, Phase, Environment, ManagedBy, CostCenter)
- **Test**: Query all resources in Phase 1, verify all have required tags
- **Iterations**: Single pass (query all resources)
- **Tag**: Feature: showcore-aws-migration-phase1, Property 2: Resource Tagging Compliance

**Example Property Test**:
```python
def test_security_group_least_privilege():
    """
    Feature: showcore-aws-migration-phase1
    Property 1: Security Group Least Privilege
    
    For any security group, it should not have 0.0.0.0/0 access on sensitive ports
    """
    ec2 = boto3.client('ec2', region_name='us-east-1')
    response = ec2.describe_security_groups()
    
    sensitive_ports = [22, 5432, 6379]
    
    for sg in response['SecurityGroups']:
        for rule in sg.get('IpPermissions', []):
            from_port = rule.get('FromPort')
            to_port = rule.get('ToPort')
            
            for ip_range in rule.get('IpRanges', []):
                if ip_range.get('CidrIp') == '0.0.0.0/0':
                    # Check if any sensitive port is in range
                    for port in sensitive_ports:
                        if from_port and to_port:
                            assert not (from_port <= port <= to_port), \
                                f"Security group {sg['GroupId']} has 0.0.0.0/0 access on port {port}"
```

### Integration Tests

Integration tests validate that components can communicate and function together.

**Test Scenarios**:

1. **Database Connectivity**
   - Deploy a test EC2 instance in isolated subnet
   - Verify it can connect to RDS using security group rules
   - Verify SSL/TLS connection is enforced
   - Terminate test instance

2. **Cache Connectivity**
   - Deploy a test EC2 instance in isolated subnet
   - Verify it can connect to ElastiCache using security group rules
   - Verify TLS connection is enforced
   - Terminate test instance

3. **S3 and CloudFront Integration**
   - Upload a test file to S3 static assets bucket
   - Verify file is accessible via CloudFront URL
   - Verify HTTPS redirect works
   - Verify file is not accessible via direct S3 URL
   - Delete test file

4. **Backup and Restore**
   - Trigger manual RDS snapshot
   - Restore snapshot to new instance
   - Verify data integrity
   - Terminate restored instance

### Compliance Tests

Compliance tests validate security and cost optimization requirements.

**AWS Config Rules**:
- rds-multi-az-support
- rds-storage-encrypted
- rds-snapshots-public-prohibited
- s3-bucket-public-read-prohibited
- s3-bucket-public-write-prohibited
- s3-bucket-ssl-requests-only
- cloudtrail-enabled
- vpc-flow-logs-enabled

**Custom Compliance Checks**:
- All resources have required tags
- No security groups with overly permissive rules
- All KMS keys have rotation enabled
- All S3 buckets have versioning enabled
- All RDS instances have backups enabled

### Test Execution

**Pre-Deployment Testing**:
1. Run `cdk synth` to generate CloudFormation templates
2. Validate templates with `cfn-lint`
3. Run `cdk diff` to preview changes
4. Review security implications of changes

**Post-Deployment Testing**:
1. Run unit tests to verify resource configuration
2. Run property tests to verify universal properties
3. Run integration tests to verify connectivity
4. Run compliance tests to verify security requirements
5. Review CloudWatch dashboards for metrics

**Continuous Testing**:
- Run compliance tests daily via AWS Config
- Run property tests weekly via scheduled Lambda
- Alert on any test failures
- Maintain test results in S3 for audit trail

**Test Coverage Goals**:
- 100% of acceptance criteria covered by unit tests or property tests
- All critical security requirements validated
- All high availability configurations verified
- All backup and recovery procedures tested

### Testing Tools

- **AWS CDK**: Infrastructure as Code framework
- **boto3**: AWS SDK for Python (API queries)
- **pytest**: Test framework for Python
- **cfn-lint**: CloudFormation template linter
- **AWS Config**: Continuous compliance monitoring
- **AWS Security Hub**: Centralized security findings
- **Checkov**: Static analysis for infrastructure code

---

**Note**: This design document was last reviewed on 2026-02-03. All architectural decisions should be documented in ADRs located in this spec directory.
