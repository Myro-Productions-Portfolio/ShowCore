---
inclusion: always
---

# Infrastructure as Code Standards - ShowCore

This document defines the coding standards, conventions, and best practices for Infrastructure as Code (IaC) in the ShowCore AWS Migration project. All infrastructure code must follow these standards to ensure consistency, maintainability, and quality.

## Overview

ShowCore uses **AWS CDK with Python** as the Infrastructure as Code tool for defining and deploying AWS infrastructure. All infrastructure must be defined as code - manual changes in the AWS Console are prohibited.

**Key Principles:**
- Infrastructure is code: version-controlled, tested, and reviewed
- Reproducible deployments across environments
- Automated testing before deployment
- Clear naming conventions and resource tagging
- Stack organization with explicit dependencies

## Tool Selection: AWS CDK with Python

**Decision**: AWS CDK with Python (see ADR-002)

**Rationale:**
- Better AWS integration and type safety
- Python familiarity for the team
- Construct library for reusable components
- CloudFormation under the hood for reliability
- Strong community support and documentation

## Naming Conventions

### Resource Naming Rules

All AWS resources must follow these naming conventions:


1. **Format**: `showcore-{component}-{environment}-{resource-type}`
2. **Case**: kebab-case (lowercase with hyphens)
3. **Prefix**: Always start with "showcore-"
4. **Components**: network, database, cache, storage, cdn, monitoring, backup
5. **Environments**: production, staging, development

**Examples:**
```
✅ Good:
- showcore-database-production-rds
- showcore-cache-production-redis
- showcore-network-production-vpc
- showcore-storage-production-assets
- showcore-cdn-production-distribution

❌ Bad:
- ShowCoreDB (wrong case, no prefix)
- rds-instance (no prefix, no component)
- showcore_database (underscores instead of hyphens)
- database-showcore (wrong order)
```

### Stack Naming

CDK stacks follow the same convention:

```python
# Stack names
ShowCoreNetworkStack
ShowCoreSecurityStack
ShowCoreDatabaseStack
ShowCoreCacheStack
ShowCoreStorageStack
ShowCoreCDNStack
ShowCoreMonitoringStack
ShowCoreBackupStack
```

### Variable and Function Naming

Python code follows PEP 8 conventions:

```python
# Variables and functions: snake_case
vpc_id = "vpc-12345"
subnet_ids = ["subnet-1", "subnet-2"]

def create_security_group(name: str, vpc_id: str) -> ec2.SecurityGroup:
    pass

# Classes: PascalCase
class ShowCoreNetworkStack(Stack):
    pass

# Constants: UPPER_SNAKE_CASE
DEFAULT_CIDR_BLOCK = "10.0.0.0/16"
MAX_AVAILABILITY_ZONES = 2
```

## Resource Tagging Requirements

### Standard Tags (Required for ALL Resources)

Every AWS resource MUST have these tags:


```python
standard_tags = {
    "Project": "ShowCore",           # Required: Project name
    "Phase": "Phase1",                # Required: Migration phase
    "Environment": "Production",      # Required: Production, Staging, Development
    "ManagedBy": "CDK",              # Required: CDK, Terraform, Manual
    "CostCenter": "Engineering"      # Required: Cost allocation
}
```

### Component-Specific Tags (Required)

Add component-specific tags based on resource type:

```python
# Network resources
network_tags = {
    **standard_tags,
    "Component": "Network",
    "Tier": "Public"  # Public, Private, Isolated
}

# Database resources
database_tags = {
    **standard_tags,
    "Component": "Database",
    "BackupRequired": "true",
    "Compliance": "Required"
}

# Cache resources
cache_tags = {
    **standard_tags,
    "Component": "Cache",
    "BackupRequired": "true"
}

# Storage resources
storage_tags = {
    **standard_tags,
    "Component": "Storage",
    "DataClassification": "Internal"  # Public, Internal, Confidential
}
```

### Applying Tags in CDK

Use CDK's `Tags.of()` API to apply tags:

```python
from aws_cdk import Stack, Tags
from constructs import Construct

class ShowCoreBaseStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        
        # Apply standard tags to all resources in this stack
        Tags.of(self).add("Project", "ShowCore")
        Tags.of(self).add("Phase", "Phase1")
        Tags.of(self).add("Environment", self.node.try_get_context("environment"))
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("CostCenter", "Engineering")
```

## Stack Organization and Dependencies

### Stack Hierarchy


ShowCore Phase 1 infrastructure is organized into the following stacks:

```
ShowCorePhase1App
├── ShowCoreNetworkStack (foundation)
│   ├── VPC
│   ├── Subnets
│   ├── Internet Gateway
│   ├── VPC Endpoints
│   └── Route Tables
│
├── ShowCoreSecurityStack (depends on Network)
│   ├── Security Groups
│   ├── CloudTrail
│   ├── AWS Config
│   └── KMS Keys (optional)
│
├── ShowCoreDatabaseStack (depends on Network, Security)
│   ├── RDS Subnet Group
│   ├── RDS Parameter Group
│   ├── RDS PostgreSQL Instance
│   └── RDS Security Group
│
├── ShowCoreCacheStack (depends on Network, Security)
│   ├── ElastiCache Subnet Group
│   ├── ElastiCache Parameter Group
│   ├── ElastiCache Redis Cluster
│   └── ElastiCache Security Group
│
├── ShowCoreStorageStack (depends on Network)
│   ├── S3 Static Assets Bucket
│   ├── S3 Backups Bucket
│   └── S3 CloudTrail Logs Bucket
│
├── ShowCoreCDNStack (depends on Storage)
│   ├── CloudFront Distribution
│   └── CloudFront Origin Access Control
│
├── ShowCoreMonitoringStack (depends on all above)
│   ├── CloudWatch Dashboard
│   ├── CloudWatch Alarms
│   └── SNS Topics
│
└── ShowCoreBackupStack (depends on Database, Cache)
    ├── AWS Backup Vault
    └── AWS Backup Plans
```

### Dependency Management

Explicitly declare stack dependencies using CDK:

```python
from aws_cdk import App

app = App()

# Foundation stack (no dependencies)
network_stack = ShowCoreNetworkStack(app, "ShowCoreNetworkStack")

# Security stack depends on network
security_stack = ShowCoreSecurityStack(
    app, "ShowCoreSecurityStack",
    vpc=network_stack.vpc
)
security_stack.add_dependency(network_stack)

# Database stack depends on network and security
database_stack = ShowCoreDatabaseStack(
    app, "ShowCoreDatabaseStack",
    vpc=network_stack.vpc,
    security_group=security_stack.rds_security_group
)
database_stack.add_dependency(network_stack)
database_stack.add_dependency(security_stack)
```

### Cross-Stack References


Use CDK outputs and properties for cross-stack references:

```python
# In NetworkStack
class ShowCoreNetworkStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        
        self.vpc = ec2.Vpc(self, "VPC", ...)
        
        # Export VPC ID for other stacks
        CfnOutput(self, "VpcId", value=self.vpc.vpc_id, export_name="ShowCoreVpcId")

# In DatabaseStack
class ShowCoreDatabaseStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.IVpc, **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        
        # Use VPC from NetworkStack
        db_instance = rds.DatabaseInstance(
            self, "Database",
            vpc=vpc,
            ...
        )
```

## Project Structure

Organize CDK project with clear directory structure:

```
infrastructure/
├── app.py                      # CDK app entry point
├── cdk.json                    # CDK configuration
├── requirements.txt            # Python dependencies
├── requirements-dev.txt        # Development dependencies
├── README.md                   # Deployment instructions
│
├── lib/                        # CDK constructs and stacks
│   ├── __init__.py
│   ├── stacks/                 # Stack definitions
│   │   ├── __init__.py
│   │   ├── network_stack.py
│   │   ├── security_stack.py
│   │   ├── database_stack.py
│   │   ├── cache_stack.py
│   │   ├── storage_stack.py
│   │   ├── cdn_stack.py
│   │   ├── monitoring_stack.py
│   │   └── backup_stack.py
│   │
│   └── constructs/             # Reusable constructs
│       ├── __init__.py
│       ├── vpc_endpoints.py
│       ├── tagged_resource.py
│       └── monitoring_alarms.py
│
└── tests/                      # Test files
    ├── __init__.py
    ├── unit/                   # Unit tests
    │   ├── test_network_stack.py
    │   ├── test_database_stack.py
    │   └── ...
    ├── property/               # Property-based tests
    │   ├── test_security_groups.py
    │   └── test_tagging.py
    └── integration/            # Integration tests
        └── test_connectivity.py
```

## Coding Standards

### Python Code Style

Follow PEP 8 and these additional guidelines:


```python
# 1. Type hints for all function parameters and return values
def create_vpc(cidr_block: str, max_azs: int) -> ec2.Vpc:
    """Create VPC with specified CIDR block."""
    return ec2.Vpc(...)

# 2. Docstrings for all classes and public methods
class ShowCoreNetworkStack(Stack):
    """
    Network infrastructure stack for ShowCore Phase 1.
    
    Creates VPC, subnets, VPC endpoints, and route tables.
    Uses VPC Endpoints instead of NAT Gateway for cost optimization.
    """
    
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        """Initialize network stack."""
        super().__init__(scope, construct_id, **kwargs)

# 3. Constants at module level
DEFAULT_CIDR_BLOCK = "10.0.0.0/16"
MAX_AVAILABILITY_ZONES = 2
RDS_INSTANCE_CLASS = "db.t3.micro"

# 4. Clear variable names (no abbreviations unless obvious)
✅ Good: vpc_endpoint_security_group
❌ Bad: vpce_sg

# 5. Comments for complex logic or cost optimization decisions
# Use VPC Endpoints instead of NAT Gateway to save ~$32/month
# Gateway Endpoints (S3, DynamoDB) are FREE
gateway_endpoints = [...]

# 6. Group related resources together
# VPC and Subnets
self.vpc = ec2.Vpc(...)
self.public_subnets = [...]
self.private_subnets = [...]

# VPC Endpoints
self.s3_gateway_endpoint = ec2.GatewayVpcEndpoint(...)
self.cloudwatch_interface_endpoint = ec2.InterfaceVpcEndpoint(...)
```

### CDK Best Practices

```python
# 1. Use L2 constructs when available (higher-level abstractions)
✅ Good: ec2.Vpc(self, "VPC", cidr="10.0.0.0/16")
❌ Bad: ec2.CfnVPC(self, "VPC", cidr_block="10.0.0.0/16")

# 2. Use construct IDs that match resource purpose
✅ Good: ec2.SecurityGroup(self, "RdsSecurityGroup", ...)
❌ Bad: ec2.SecurityGroup(self, "SG1", ...)

# 3. Use context values for environment-specific configuration
cidr_block = self.node.try_get_context("vpc_cidr") or "10.0.0.0/16"
environment = self.node.try_get_context("environment") or "production"

# 4. Use removal policies explicitly
bucket = s3.Bucket(
    self, "BackupsBucket",
    removal_policy=RemovalPolicy.RETAIN  # Explicit: keep on stack deletion
)

# 5. Export important values for cross-stack references
CfnOutput(
    self, "VpcId",
    value=self.vpc.vpc_id,
    export_name="ShowCoreVpcId",
    description="VPC ID for ShowCore Phase 1"
)
```

### Configuration Management

Use `cdk.json` for configuration:


```json
{
  "app": "python3 app.py",
  "context": {
    "account": "123456789012",  # Replace with your AWS account ID
    "region": "us-east-1",
    "environment": "production",
    "vpc_cidr": "10.0.0.0/16",
    "enable_nat_gateway": false,
    "enable_vpc_endpoints": true,
    "rds_instance_class": "db.t3.micro",
    "elasticache_node_type": "cache.t3.micro",
    "@aws-cdk/core:enableStackNameDuplicates": false,
    "@aws-cdk/core:stackRelativeExports": true
  }
}
```

## Testing Requirements

All infrastructure code MUST be tested before deployment. Three types of tests are required:

### 1. Unit Tests

Test individual stack configurations and resource properties.

**Requirements:**
- Test every stack has required resources
- Test resource configurations match requirements
- Test cost optimization measures (no NAT Gateway, Free Tier instances)
- Test security configurations (encryption, security groups)
- Use CDK assertions library

**Example:**
```python
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.stacks.network_stack import ShowCoreNetworkStack

def test_vpc_created_with_correct_cidr():
    """Test VPC is created with correct CIDR block."""
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestStack")
    template = Template.from_stack(stack)
    
    template.has_resource_properties("AWS::EC2::VPC", {
        "CidrBlock": "10.0.0.0/16"
    })

def test_no_nat_gateway_deployed():
    """Test NO NAT Gateway is deployed (cost optimization)."""
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestStack")
    template = Template.from_stack(stack)
    
    # Assert NAT Gateway does NOT exist
    template.resource_count_is("AWS::EC2::NatGateway", 0)

def test_rds_instance_is_free_tier_eligible():
    """Test RDS instance uses Free Tier eligible instance class."""
    app = cdk.App()
    stack = ShowCoreDatabaseStack(app, "TestStack", vpc=mock_vpc)
    template = Template.from_stack(stack)
    
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "DBInstanceClass": "db.t3.micro"
    })
```

### 2. Property-Based Tests

Test universal correctness properties that must hold for ALL resources.

**Requirements:**
- Test security group least privilege (no 0.0.0.0/0 on sensitive ports)
- Test resource tagging compliance (all required tags present)
- Test encryption at rest enabled for all data resources
- Test encryption in transit enforced
- Use property testing framework (Hypothesis)

**Example:**
```python
from hypothesis import given, strategies as st
import boto3

def test_security_group_least_privilege():
    """
    Property: No security group allows 0.0.0.0/0 access on sensitive ports.
    
    Validates: Requirements 6.2
    """
    ec2 = boto3.client('ec2', region_name='us-east-1')
    security_groups = ec2.describe_security_groups()
    
    sensitive_ports = [22, 5432, 6379]  # SSH, PostgreSQL, Redis
    
    for sg in security_groups['SecurityGroups']:
        for rule in sg.get('IpPermissions', []):
            from_port = rule.get('FromPort')
            to_port = rule.get('ToPort')
            
            if from_port in sensitive_ports or to_port in sensitive_ports:
                for ip_range in rule.get('IpRanges', []):
                    assert ip_range['CidrIp'] != '0.0.0.0/0', \
                        f"Security group {sg['GroupId']} allows 0.0.0.0/0 on port {from_port}"

def test_resource_tagging_compliance():
    """
    Property: All resources have required tags.
    
    Validates: Requirements 9.6
    """
    required_tags = ["Project", "Phase", "Environment", "ManagedBy", "CostCenter"]
    
    # Query all resources in Phase 1
    # Verify each resource has all required tags
    # (Implementation depends on AWS Resource Groups Tagging API)
```

### 3. Integration Tests

Test connectivity and functionality between components.

**Requirements:**
- Test RDS connectivity from private subnet
- Test ElastiCache connectivity from private subnet
- Test VPC Endpoints functionality (S3, CloudWatch, Systems Manager)
- Test S3 and CloudFront integration
- Test backup and restore procedures
- Run after deployment to validate infrastructure

**Example:**
```python
import boto3
import psycopg2
import redis

def test_rds_connectivity():
    """Test RDS PostgreSQL is accessible from private subnet."""
    # Deploy temporary EC2 instance in private subnet
    # Install PostgreSQL client
    # Test connection to RDS endpoint
    # Verify SSL/TLS connection is enforced
    # Terminate test instance
    pass

def test_vpc_endpoint_s3_access():
    """Test S3 access via Gateway Endpoint from private subnet."""
    # From private subnet instance
    # Attempt to access S3 bucket
    # Verify access succeeds via VPC Endpoint
    # Verify NO internet access (expected to fail)
    pass
```

### Test Execution

Run tests before every deployment:

```bash
# Run all unit tests
pytest tests/unit/ -v

# Run property tests
pytest tests/property/ -v

# Run integration tests (after deployment)
pytest tests/integration/ -v

# Run all tests
pytest tests/ -v

# Generate coverage report
pytest tests/ --cov=lib --cov-report=html
```

### Test Coverage Requirements

- **Unit tests**: 100% of stacks must have tests
- **Property tests**: All universal properties must be tested
- **Integration tests**: All connectivity paths must be tested
- **Minimum coverage**: 80% code coverage for stack definitions

## Deployment Workflow

### Pre-Deployment Checklist

Before deploying infrastructure:


```bash
# 1. Validate syntax
cdk synth

# 2. Run linter
pylint lib/ tests/

# 3. Run type checker
mypy lib/ tests/

# 4. Run unit tests
pytest tests/unit/ -v

# 5. Run property tests
pytest tests/property/ -v

# 6. Preview changes
cdk diff

# 7. Review CloudFormation template
cdk synth > template.yaml
cfn-lint template.yaml

# 8. Verify cost optimization
# - Check for NAT Gateways (should be 0)
# - Check instance types are Free Tier eligible
# - Check encryption uses AWS managed keys (not KMS)

# 9. Verify security
# - Check security groups for 0.0.0.0/0 on sensitive ports
# - Check encryption at rest is enabled
# - Check encryption in transit is enforced

# 10. Verify tagging
# - Check all resources have required tags
```

### Deployment Commands

```bash
# Bootstrap CDK (first time only)
cdk bootstrap aws://123456789012/us-east-1  # Replace with your AWS account ID

# Deploy all stacks
cdk deploy --all

# Deploy specific stack
cdk deploy ShowCoreNetworkStack

# Deploy with approval for security changes
cdk deploy --all --require-approval any-change

# Deploy with specific context
cdk deploy --context environment=staging
```

### Post-Deployment Validation

After deployment:

```bash
# 1. Run integration tests
pytest tests/integration/ -v

# 2. Verify resources in AWS Console
# - Check VPC and subnets created
# - Check NO NAT Gateway exists
# - Check VPC Endpoints created
# - Check RDS and ElastiCache instances running

# 3. Verify monitoring
# - Check CloudWatch dashboard displays metrics
# - Check CloudWatch alarms are active
# - Check SNS topics have subscriptions

# 4. Verify backups
# - Check AWS Backup plans are active
# - Check backup jobs scheduled

# 5. Verify cost
# - Check Cost Explorer for Phase 1 costs
# - Verify costs are within expected range
```

## Version Control

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/network-stack

# 2. Make changes and commit
git add lib/stacks/network_stack.py
git commit -m "feat: add VPC Endpoints for cost optimization"

# 3. Run tests before pushing
pytest tests/ -v

# 4. Push to remote
git push origin feature/network-stack

# 5. Create pull request for review
```

### Commit Message Format

Follow Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature or stack
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `chore`: Maintenance tasks

**Examples:**
```
feat(network): add VPC Endpoints for cost optimization

- Add S3 Gateway Endpoint (FREE)
- Add CloudWatch Interface Endpoints (~$7/month each)
- Remove NAT Gateway to save ~$32/month

Closes #123

---

fix(database): enable SSL/TLS enforcement for RDS

Set rds.force_ssl = 1 in parameter group to enforce SSL/TLS connections.

Validates: Requirements 3.6

---

test(security): add property test for security group least privilege

Test that no security group allows 0.0.0.0/0 on sensitive ports (22, 5432, 6379).

Validates: Requirements 6.2
```

## Security Best Practices

### Secrets Management

**NEVER** hardcode secrets in infrastructure code:


```python
# ❌ BAD: Hardcoded credentials
rds.DatabaseInstance(
    self, "Database",
    master_username="admin",
    master_user_password="MyPassword123"  # NEVER DO THIS
)

# ✅ GOOD: Use Secrets Manager
db_secret = secretsmanager.Secret(
    self, "DatabaseSecret",
    generate_secret_string=secretsmanager.SecretStringGenerator(
        secret_string_template='{"username":"admin"}',
        generate_string_key="password",
        exclude_punctuation=True
    )
)

rds.DatabaseInstance(
    self, "Database",
    credentials=rds.Credentials.from_secret(db_secret)
)
```

### IAM Policies

Use least privilege IAM policies:

```python
# ✅ GOOD: Specific permissions
policy = iam.PolicyStatement(
    actions=[
        "s3:GetObject",
        "s3:PutObject"
    ],
    resources=[
        f"{bucket.bucket_arn}/*"
    ]
)

# ❌ BAD: Overly permissive
policy = iam.PolicyStatement(
    actions=["s3:*"],
    resources=["*"]
)
```

### Security Group Rules

Always use least privilege for security groups:

```python
# ✅ GOOD: Specific source
rds_sg.add_ingress_rule(
    peer=ec2.Peer.security_group_id(app_sg.security_group_id),
    connection=ec2.Port.tcp(5432),
    description="PostgreSQL from application tier"
)

# ❌ BAD: Open to internet
rds_sg.add_ingress_rule(
    peer=ec2.Peer.any_ipv4(),
    connection=ec2.Port.tcp(5432),
    description="PostgreSQL from anywhere"  # NEVER DO THIS
)
```

## Cost Optimization Checklist

When writing infrastructure code, verify:

- [ ] NO NAT Gateway deployed (use VPC Endpoints instead)
- [ ] Free Tier eligible instance types used (db.t3.micro, cache.t3.micro)
- [ ] Single-AZ deployment for RDS and ElastiCache
- [ ] Gateway Endpoints used for S3 and DynamoDB (FREE)
- [ ] Minimal Interface Endpoints (only essential services)
- [ ] S3 SSE-S3 encryption (not KMS)
- [ ] CloudFront PriceClass_100 (lowest cost)
- [ ] Short backup retention (7 days)
- [ ] All resources tagged with cost allocation tags
- [ ] Lifecycle policies configured for S3 buckets
- [ ] CloudWatch log retention set to 7 days
- [ ] Minimal CloudWatch alarms (only critical ones)

## Documentation Requirements

Every stack must have:

1. **Docstring** explaining purpose and resources
2. **Comments** for cost optimization decisions
3. **Comments** for security decisions
4. **README** section with deployment instructions
5. **ADR** for significant architectural decisions

**Example:**
```python
class ShowCoreNetworkStack(Stack):
    """
    Network infrastructure stack for ShowCore Phase 1.
    
    Creates VPC, subnets, VPC endpoints, and route tables.
    
    Cost Optimization:
    - Uses VPC Endpoints instead of NAT Gateway (saves ~$32/month)
    - Gateway Endpoints (S3, DynamoDB) are FREE
    - Interface Endpoints (~$7/month each) for essential services only
    
    Security:
    - Private subnets have NO internet access
    - VPC Endpoints provide secure AWS service access
    - Security groups follow least privilege principle
    
    Resources:
    - VPC (10.0.0.0/16)
    - 2 Public Subnets (10.0.0.0/24, 10.0.1.0/24)
    - 2 Private Subnets (10.0.2.0/24, 10.0.3.0/24)
    - Internet Gateway
    - S3 Gateway Endpoint (FREE)
    - DynamoDB Gateway Endpoint (FREE)
    - CloudWatch Logs Interface Endpoint (~$7/month)
    - CloudWatch Monitoring Interface Endpoint (~$7/month)
    - Systems Manager Interface Endpoint (~$7/month)
    
    Dependencies: None (foundation stack)
    """
    pass
```

## Common Pitfalls to Avoid

### Infrastructure Code

1. **DO NOT** deploy NAT Gateways (use VPC Endpoints)
2. **DO NOT** use Multi-AZ for RDS/ElastiCache initially (cost optimization)
3. **DO NOT** use KMS for encryption (use AWS managed keys)
4. **DO NOT** hardcode secrets or credentials
5. **DO NOT** allow 0.0.0.0/0 on sensitive ports
6. **DO NOT** skip resource tagging
7. **DO NOT** skip testing before deployment
8. **DO NOT** make manual changes in AWS Console

### Testing

1. **DO NOT** skip unit tests
2. **DO NOT** skip property tests for universal properties
3. **DO NOT** skip integration tests after deployment
4. **DO NOT** use mocks for integration tests (test real connectivity)
5. **DO NOT** commit code with failing tests

### Deployment

1. **DO NOT** deploy without running `cdk diff` first
2. **DO NOT** deploy without reviewing CloudFormation template
3. **DO NOT** deploy without verifying cost optimization
4. **DO NOT** deploy without verifying security configurations
5. **DO NOT** deploy without verifying resource tagging

## Quick Reference

### Essential Commands

```bash
# Validate and test
cdk synth                          # Generate CloudFormation template
pylint lib/ tests/                 # Run linter
mypy lib/ tests/                   # Run type checker
pytest tests/ -v                   # Run all tests
cfn-lint template.yaml             # Validate CloudFormation

# Deploy
cdk bootstrap                      # Bootstrap CDK (first time)
cdk diff                           # Preview changes
cdk deploy --all                   # Deploy all stacks
cdk deploy ShowCoreNetworkStack    # Deploy specific stack

# Manage
cdk list                           # List all stacks
cdk destroy --all                  # Destroy all stacks
cdk doctor                         # Check CDK environment
```

### Resource Naming Template

```
showcore-{component}-{environment}-{resource-type}

Components: network, database, cache, storage, cdn, monitoring, backup
Environments: production, staging, development
```

### Required Tags

```python
{
    "Project": "ShowCore",
    "Phase": "Phase1",
    "Environment": "Production",
    "ManagedBy": "CDK",
    "CostCenter": "Engineering"
}
```

### Testing Requirements

- Unit tests: 100% of stacks
- Property tests: All universal properties
- Integration tests: All connectivity paths
- Minimum coverage: 80%

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [AWS CDK Python Reference](https://docs.aws.amazon.com/cdk/api/v2/python/)
- [AWS CDK Best Practices](https://docs.aws.amazon.com/cdk/latest/guide/best-practices.html)
- [PEP 8 Style Guide](https://pep8.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

---

**Last Updated**: Phase 1 Implementation
**Maintained By**: ShowCore Engineering Team
**Review Frequency**: After each phase completion
