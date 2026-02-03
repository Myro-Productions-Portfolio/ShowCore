# ShowCore Infrastructure Tests

This directory contains all tests for the ShowCore AWS infrastructure defined using AWS CDK.

## Test Structure

```
tests/
├── __init__.py
├── utils.py                    # Test utilities for AWS resource validation
├── README.md                   # This file
├── unit/                       # Unit tests for CDK stacks
│   ├── __init__.py
│   ├── test_base_stack.py
│   ├── test_monitoring_stack.py
│   ├── test_security_stack.py
│   └── ...
├── property/                   # Property-based tests
│   ├── __init__.py
│   └── ...
└── integration/                # Integration tests (require deployed resources)
    ├── __init__.py
    └── ...
```

## Test Types

### 1. Unit Tests (`tests/unit/`)

Unit tests validate CDK stack configurations and resource properties using `aws-cdk.assertions`.

**Purpose:**
- Test individual stack configurations
- Verify resource properties match requirements
- Test cost optimization measures
- Test security configurations
- Test resource naming conventions

**Requirements:**
- Test every stack has required resources
- Test resource configurations match requirements
- Use CDK assertions library (`Template.from_stack()`)
- No AWS credentials required (tests CloudFormation templates)

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
```

**Running Unit Tests:**
```bash
# Run all unit tests
pytest tests/unit/ -v

# Run specific test file
pytest tests/unit/test_network_stack.py -v

# Run specific test
pytest tests/unit/test_network_stack.py::test_vpc_created_with_correct_cidr -v
```

### 2. Property-Based Tests (`tests/property/`)

Property-based tests verify universal correctness properties that must hold for ALL resources using Hypothesis.

**Purpose:**
- Test security group least privilege (no 0.0.0.0/0 on sensitive ports)
- Test resource tagging compliance (all required tags present)
- Test encryption at rest enabled for all data resources
- Test encryption in transit enforced

**Requirements:**
- Test universal properties across all resources
- Use Hypothesis for property testing
- Requires AWS credentials (queries actual resources)
- Run after deployment to validate infrastructure

**Example:**
```python
from hypothesis import given, strategies as st
import boto3
from tests.utils import AWSResourceValidator

def test_security_group_least_privilege():
    """
    Property: No security group allows 0.0.0.0/0 access on sensitive ports.
    
    Validates: Requirements 6.2
    """
    validator = AWSResourceValidator(region='us-east-1')
    
    # Get all security groups in ShowCore VPC
    vpc = validator.get_vpc_by_tag('Project', 'ShowCore')
    if not vpc:
        pytest.skip("ShowCore VPC not found")
    
    security_groups = validator.get_security_groups_by_vpc(vpc['VpcId'])
    
    sensitive_ports = [22, 5432, 6379]  # SSH, PostgreSQL, Redis
    
    for sg in security_groups:
        for port in sensitive_ports:
            has_open_rule = validator.check_security_group_rule(
                sg['GroupId'],
                port,
                cidr='0.0.0.0/0'
            )
            assert not has_open_rule, \
                f"Security group {sg['GroupId']} allows 0.0.0.0/0 on port {port}"

def test_resource_tagging_compliance():
    """
    Property: All resources have required tags.
    
    Validates: Requirements 9.6
    """
    validator = AWSResourceValidator(region='us-east-1')
    
    required_tags = ["Project", "Phase", "Environment", "ManagedBy", "CostCenter"]
    
    # Get all ShowCore resources
    resources = validator.get_resources_by_tag('Project', 'ShowCore')
    
    for resource in resources:
        tag_status = validator.check_resource_tags(
            resource['ResourceARN'],
            required_tags
        )
        
        for tag, present in tag_status.items():
            assert present, \
                f"Resource {resource['ResourceARN']} missing required tag: {tag}"
```

**Running Property Tests:**
```bash
# Run all property tests
pytest tests/property/ -v -m property

# Run with specific Hypothesis profile
pytest tests/property/ -v --hypothesis-profile=ci
```

### 3. Integration Tests (`tests/integration/`)

Integration tests validate connectivity and functionality between deployed components.

**Purpose:**
- Test RDS connectivity from private subnet
- Test ElastiCache connectivity from private subnet
- Test VPC Endpoints functionality
- Test S3 and CloudFront integration
- Test backup and restore procedures

**Requirements:**
- Test connectivity between components
- Test functionality of deployed resources
- Requires AWS credentials and deployed infrastructure
- May create temporary resources (cleaned up after test)

**Example:**
```python
import boto3
import psycopg2
from tests.utils import AWSResourceValidator, get_account_id

def test_rds_connectivity():
    """Test RDS PostgreSQL is accessible from private subnet."""
    validator = AWSResourceValidator(region='us-east-1')
    
    # Get RDS instance endpoint
    db_instance = validator.get_rds_instance('showcore-database-production-rds')
    if not db_instance:
        pytest.skip("RDS instance not found")
    
    endpoint = db_instance['Endpoint']['Address']
    port = db_instance['Endpoint']['Port']
    
    # Note: This test requires a temporary EC2 instance in private subnet
    # with PostgreSQL client installed. See implementation plan for details.
    
    # Test connection with SSL required
    try:
        conn = psycopg2.connect(
            host=endpoint,
            port=port,
            database='showcore',
            user='admin',
            password='<from-secrets-manager>',
            sslmode='require'
        )
        conn.close()
        assert True
    except Exception as e:
        pytest.fail(f"Failed to connect to RDS: {e}")

def test_vpc_endpoint_s3_access():
    """Test S3 access via Gateway Endpoint from private subnet."""
    validator = AWSResourceValidator(region='us-east-1')
    account_id = get_account_id()
    
    # Get S3 bucket
    bucket_name = f"showcore-backups-{account_id}"
    
    # Note: This test requires execution from private subnet instance
    # to verify S3 access via VPC Endpoint (not internet)
    
    # Test S3 access
    try:
        validator.s3.head_bucket(Bucket=bucket_name)
        assert True
    except Exception as e:
        pytest.fail(f"Failed to access S3 bucket: {e}")
```

**Running Integration Tests:**
```bash
# Run all integration tests
pytest tests/integration/ -v -m integration

# Run specific integration test
pytest tests/integration/test_connectivity.py -v
```

## Test Utilities

The `tests/utils.py` module provides helper functions for integration and property-based tests:

### AWSResourceValidator

Main utility class for validating AWS resources:

```python
from tests.utils import AWSResourceValidator

# Initialize validator
validator = AWSResourceValidator(region='us-east-1')

# VPC and Network
vpc = validator.get_vpc_by_tag('Project', 'ShowCore')
security_groups = validator.get_security_groups_by_vpc(vpc['VpcId'])
vpc_endpoints = validator.get_vpc_endpoints(vpc['VpcId'])

# RDS
rds_instance = validator.get_rds_instance('showcore-database-production-rds')
is_encrypted = validator.check_rds_encryption('showcore-database-production-rds')

# ElastiCache
cache_cluster = validator.get_elasticache_cluster('showcore-redis')
encryption = validator.check_elasticache_encryption('showcore-redis')

# S3
encryption_algo = validator.get_bucket_encryption('showcore-backups-123456789012')
has_versioning = validator.check_bucket_versioning('showcore-backups-123456789012')

# CloudWatch
alarms = validator.get_alarms_by_prefix('showcore-')

# Resource Tagging
resources = validator.get_resources_by_tag('Project', 'ShowCore')
tag_status = validator.check_resource_tags(resource_arn, ['Project', 'Phase'])

# CloudTrail
trails = validator.get_trails()
is_logging = validator.check_trail_logging('showcore-trail')
```

### Helper Functions

```python
from tests.utils import get_account_id, wait_for_stack_complete

# Get AWS account ID
account_id = get_account_id()

# Wait for CloudFormation stack to complete
success = wait_for_stack_complete('ShowCoreNetworkStack', timeout=600)
```

## Running Tests

### Prerequisites

1. **Install dependencies:**
   ```bash
   cd infrastructure
   pip install -r requirements-dev.txt
   ```

2. **AWS credentials (for property and integration tests):**
   ```bash
   export AWS_PROFILE=showcore-app
   export AWS_REGION=us-east-1
   ```

### Run All Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov=lib --cov-report=html

# Run with coverage and show missing lines
pytest tests/ -v --cov=lib --cov-report=term-missing
```

### Run Specific Test Types

```bash
# Unit tests only (no AWS credentials required)
pytest tests/unit/ -v

# Property tests only (requires AWS credentials)
pytest tests/property/ -v -m property

# Integration tests only (requires deployed infrastructure)
pytest tests/integration/ -v -m integration
```

### Run Specific Tests

```bash
# Run specific test file
pytest tests/unit/test_network_stack.py -v

# Run specific test function
pytest tests/unit/test_network_stack.py::test_vpc_created_with_correct_cidr -v

# Run tests matching pattern
pytest tests/ -v -k "test_vpc"
```

### Test Markers

Tests can be marked with pytest markers for categorization:

```python
import pytest

@pytest.mark.unit
def test_vpc_configuration():
    """Unit test for VPC configuration."""
    pass

@pytest.mark.property
def test_security_group_least_privilege():
    """Property test for security group rules."""
    pass

@pytest.mark.integration
@pytest.mark.slow
def test_rds_connectivity():
    """Integration test for RDS connectivity."""
    pass

@pytest.mark.aws
def test_cloudtrail_logging():
    """Test requiring AWS credentials."""
    pass
```

Run tests by marker:
```bash
# Run only unit tests
pytest tests/ -v -m unit

# Run only property tests
pytest tests/ -v -m property

# Run only integration tests
pytest tests/ -v -m integration

# Run tests NOT marked as slow
pytest tests/ -v -m "not slow"

# Run tests marked as unit OR property
pytest tests/ -v -m "unit or property"
```

## Test Coverage Requirements

- **Unit tests**: 100% of stacks must have tests
- **Property tests**: All universal properties must be tested
- **Integration tests**: All connectivity paths must be tested
- **Minimum coverage**: 80% code coverage for stack definitions

### Generate Coverage Report

```bash
# Generate HTML coverage report
pytest tests/ --cov=lib --cov-report=html

# Open coverage report
open htmlcov/index.html
```

## Continuous Integration

Tests should be run in CI/CD pipeline before deployment:

```bash
# Pre-deployment test workflow
pytest tests/unit/ -v                    # Unit tests (no AWS credentials)
pytest tests/property/ -v -m property    # Property tests (requires credentials)
cdk synth                                # Generate CloudFormation templates
cdk diff                                 # Preview changes
cdk deploy --all                         # Deploy infrastructure
pytest tests/integration/ -v -m integration  # Integration tests (post-deployment)
```

## Troubleshooting

### Common Issues

1. **Import errors:**
   ```bash
   # Ensure you're in the infrastructure directory
   cd infrastructure
   
   # Ensure dependencies are installed
   pip install -r requirements-dev.txt
   ```

2. **AWS credentials not found:**
   ```bash
   # Set AWS profile
   export AWS_PROFILE=showcore-app
   
   # Or configure default credentials
   aws configure
   ```

3. **Tests fail with "Resource not found":**
   - Ensure infrastructure is deployed before running property/integration tests
   - Check that resources have correct tags (Project=ShowCore)
   - Verify you're testing in the correct AWS region

4. **Hypothesis tests take too long:**
   ```bash
   # Use faster Hypothesis profile
   pytest tests/property/ -v --hypothesis-profile=dev
   ```

## Best Practices

1. **Write tests before implementation** (TDD approach)
2. **Use descriptive test names** that explain what is being tested
3. **Add docstrings** to all test functions
4. **Reference requirements** in test docstrings (e.g., "Validates: Requirements 2.1")
5. **Clean up resources** created during integration tests
6. **Use fixtures** for common test setup
7. **Mock external dependencies** in unit tests when appropriate
8. **Test both success and failure cases**
9. **Keep tests fast** - unit tests should run in seconds
10. **Document test assumptions** in comments

## Additional Resources

- [AWS CDK Assertions](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.assertions-readme.html)
- [Pytest Documentation](https://docs.pytest.org/)
- [Hypothesis Documentation](https://hypothesis.readthedocs.io/)
- [Boto3 Documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)
- [ShowCore IaC Standards](../.kiro/specs/showcore-aws-migration-phase1/iac-standards.md)
