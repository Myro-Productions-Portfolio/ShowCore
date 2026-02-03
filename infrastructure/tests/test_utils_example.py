"""
Example tests demonstrating the use of test utilities.

These tests show how to use the AWSResourceValidator and helper functions
for integration and property-based testing.

Note: These are example tests and will be skipped if AWS resources don't exist.
"""

import pytest
from tests.utils import AWSResourceValidator, get_account_id


@pytest.mark.integration
@pytest.mark.aws
def test_aws_resource_validator_initialization():
    """Test that AWSResourceValidator can be initialized."""
    validator = AWSResourceValidator(region='us-east-1')
    
    # Verify clients are lazy-loaded
    assert validator._ec2_client is None
    assert validator._rds_client is None
    assert validator._s3_client is None
    
    # Access a client to trigger lazy loading
    ec2_client = validator.ec2
    assert ec2_client is not None
    assert validator._ec2_client is not None


@pytest.mark.integration
@pytest.mark.aws
def test_get_account_id():
    """Test that get_account_id returns a valid account ID."""
    account_id = get_account_id()
    
    # Account ID should be a 12-digit string
    if account_id:
        assert len(account_id) == 12
        assert account_id.isdigit()
    else:
        pytest.skip("Unable to retrieve AWS account ID (credentials not configured)")


@pytest.mark.integration
@pytest.mark.aws
def test_get_vpc_by_tag_example():
    """Example test showing how to get VPC by tag."""
    validator = AWSResourceValidator(region='us-east-1')
    
    # Try to get ShowCore VPC
    vpc = validator.get_vpc_by_tag('Project', 'ShowCore')
    
    if vpc:
        # If VPC exists, verify it has expected properties
        assert 'VpcId' in vpc
        assert 'CidrBlock' in vpc
        print(f"Found VPC: {vpc['VpcId']} with CIDR: {vpc['CidrBlock']}")
    else:
        pytest.skip("ShowCore VPC not found (infrastructure not deployed)")


@pytest.mark.integration
@pytest.mark.aws
def test_get_security_groups_example():
    """Example test showing how to get security groups."""
    validator = AWSResourceValidator(region='us-east-1')
    
    # Get ShowCore VPC
    vpc = validator.get_vpc_by_tag('Project', 'ShowCore')
    if not vpc:
        pytest.skip("ShowCore VPC not found")
    
    # Get security groups in VPC
    security_groups = validator.get_security_groups_by_vpc(vpc['VpcId'])
    
    # Should have at least one security group (default)
    assert len(security_groups) > 0
    
    # Each security group should have required properties
    for sg in security_groups:
        assert 'GroupId' in sg
        assert 'GroupName' in sg
        print(f"Found security group: {sg['GroupName']} ({sg['GroupId']})")


@pytest.mark.integration
@pytest.mark.aws
def test_check_security_group_rule_example():
    """Example test showing how to check security group rules."""
    validator = AWSResourceValidator(region='us-east-1')
    
    # Get ShowCore VPC
    vpc = validator.get_vpc_by_tag('Project', 'ShowCore')
    if not vpc:
        pytest.skip("ShowCore VPC not found")
    
    # Get security groups
    security_groups = validator.get_security_groups_by_vpc(vpc['VpcId'])
    if not security_groups:
        pytest.skip("No security groups found")
    
    # Check if any security group allows SSH from 0.0.0.0/0
    for sg in security_groups:
        has_open_ssh = validator.check_security_group_rule(
            sg['GroupId'],
            port=22,
            cidr='0.0.0.0/0'
        )
        
        # For ShowCore, SSH should NOT be open to the world
        if 'showcore' in sg['GroupName'].lower():
            assert not has_open_ssh, \
                f"Security group {sg['GroupName']} has SSH open to 0.0.0.0/0"


@pytest.mark.integration
@pytest.mark.aws
def test_get_resources_by_tag_example():
    """Example test showing how to get resources by tag."""
    validator = AWSResourceValidator(region='us-east-1')
    
    # Get all ShowCore resources
    resources = validator.get_resources_by_tag('Project', 'ShowCore')
    
    if resources:
        print(f"Found {len(resources)} ShowCore resources")
        
        # Each resource should have ARN and tags
        for resource in resources[:5]:  # Show first 5
            assert 'ResourceARN' in resource
            assert 'Tags' in resource
            print(f"Resource: {resource['ResourceARN']}")
    else:
        pytest.skip("No ShowCore resources found (infrastructure not deployed)")


@pytest.mark.unit
def test_validator_lazy_loading():
    """Test that validator clients are lazy-loaded."""
    validator = AWSResourceValidator(region='us-east-1')
    
    # Initially, no clients should be loaded
    assert validator._ec2_client is None
    assert validator._rds_client is None
    assert validator._elasticache_client is None
    assert validator._s3_client is None
    
    # Access EC2 client
    ec2 = validator.ec2
    assert ec2 is not None
    assert validator._ec2_client is not None
    
    # Other clients should still be None
    assert validator._rds_client is None
    assert validator._elasticache_client is None
    
    # Access RDS client
    rds = validator.rds
    assert rds is not None
    assert validator._rds_client is not None
    
    # Access same client again should return cached instance
    ec2_again = validator.ec2
    assert ec2_again is ec2  # Same object
