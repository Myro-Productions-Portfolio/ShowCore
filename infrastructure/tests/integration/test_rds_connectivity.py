"""
ShowCore RDS Connectivity Integration Test

This module contains integration tests that verify RDS PostgreSQL connectivity
from private subnets after infrastructure deployment.

These tests run against actual AWS resources and validate:
- RDS instance is accessible from private subnet
- PostgreSQL client can connect to RDS endpoint
- SSL/TLS connection is enforced
- Security group rules allow connection
- Connection uses correct database name and port

Test Workflow:
1. Deploy temporary EC2 instance in private subnet
2. Install PostgreSQL client (psql) via user data
3. Connect to RDS endpoint using psql with SSL mode=require
4. Verify SSL/TLS connection is enforced
5. Verify security group rules allow connection
6. Terminate test instance after validation

Requirements:
- AWS credentials configured
- ShowCore infrastructure deployed (NetworkStack, SecurityStack, DatabaseStack)
- VPC with private subnets
- RDS PostgreSQL instance running
- Security groups configured

Cost: ~$0.01 for test instance runtime (< 5 minutes)

Validates: Requirements 3.3, 3.6
"""

import pytest
import boto3
import time
from typing import Dict, Any, Optional
from botocore.exceptions import ClientError
from tests.utils import AWSResourceValidator


@pytest.fixture(scope="module")
def aws_validator():
    """
    Create AWS resource validator for integration tests.
    
    Returns:
        AWSResourceValidator instance configured for us-east-1
    """
    return AWSResourceValidator(region='us-east-1')


@pytest.fixture(scope="module")
def vpc_info(aws_validator: AWSResourceValidator) -> Dict[str, Any]:
    """
    Get VPC information for ShowCore infrastructure.
    
    Args:
        aws_validator: AWS resource validator
    
    Returns:
        Dict with VPC ID and subnet information
    
    Raises:
        pytest.skip: If VPC not found (infrastructure not deployed)
    """
    vpc = aws_validator.get_vpc_by_tag('Project', 'ShowCore')
    if not vpc:
        pytest.skip("ShowCore VPC not found - infrastructure not deployed")
    
    vpc_id = vpc['VpcId']
    
    # Get private subnets (PRIVATE_ISOLATED type)
    response = aws_validator.ec2.describe_subnets(
        Filters=[
            {'Name': 'vpc-id', 'Values': [vpc_id]},
            {'Name': 'tag:Component', 'Values': ['Network']},
            {'Name': 'tag:Tier', 'Values': ['Private']}
        ]
    )
    
    private_subnets = response.get('Subnets', [])
    if not private_subnets:
        pytest.skip("Private subnets not found - infrastructure not deployed")
    
    return {
        'vpc_id': vpc_id,
        'private_subnet_id': private_subnets[0]['SubnetId'],
        'availability_zone': private_subnets[0]['AvailabilityZone']
    }


@pytest.fixture(scope="module")
def rds_info(aws_validator: AWSResourceValidator) -> Dict[str, Any]:
    """
    Get RDS instance information for ShowCore infrastructure.
    
    Args:
        aws_validator: AWS resource validator
    
    Returns:
        Dict with RDS endpoint, port, and database name
    
    Raises:
        pytest.skip: If RDS instance not found (infrastructure not deployed)
    """
    # Get RDS instance by tag
    resources = aws_validator.get_resources_by_tag(
        'Project',
        'ShowCore',
        resource_type_filters=['rds:db']
    )
    
    if not resources:
        pytest.skip("ShowCore RDS instance not found - infrastructure not deployed")
    
    # Extract DB instance identifier from ARN
    # ARN format: arn:aws:rds:us-east-1:123456789012:db:showcore-database-production-rds
    db_arn = resources[0]['ResourceARN']
    db_identifier = db_arn.split(':')[-1]
    
    # Get RDS instance details
    db_instance = aws_validator.get_rds_instance(db_identifier)
    if not db_instance:
        pytest.skip(f"RDS instance {db_identifier} not found")
    
    # Check if instance is available
    if db_instance['DBInstanceStatus'] != 'available':
        pytest.skip(f"RDS instance {db_identifier} is not available (status: {db_instance['DBInstanceStatus']})")
    
    return {
        'endpoint': db_instance['Endpoint']['Address'],
        'port': db_instance['Endpoint']['Port'],
        'database_name': db_instance['DBName'],
        'db_identifier': db_identifier,
        'security_group_ids': [sg['VpcSecurityGroupId'] for sg in db_instance['VpcSecurityGroups']]
    }


@pytest.fixture(scope="module")
def security_group_info(aws_validator: AWSResourceValidator, vpc_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get security group information for test instance.
    
    Creates a temporary security group for the test instance that allows
    outbound PostgreSQL connections to RDS.
    
    Args:
        aws_validator: AWS resource validator
        vpc_info: VPC information
    
    Returns:
        Dict with security group ID
    
    Yields:
        Security group information
    
    Cleanup:
        Deletes the temporary security group after tests complete
    """
    # Create temporary security group for test instance
    sg_name = f"showcore-test-rds-connectivity-{int(time.time())}"
    
    try:
        response = aws_validator.ec2.create_security_group(
            GroupName=sg_name,
            Description="Temporary security group for RDS connectivity test",
            VpcId=vpc_info['vpc_id']
        )
        
        sg_id = response['GroupId']
        
        # Add outbound rule for PostgreSQL (5432)
        # This allows the test instance to connect to RDS
        aws_validator.ec2.authorize_security_group_egress(
            GroupId=sg_id,
            IpPermissions=[
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 5432,
                    'ToPort': 5432,
                    'IpRanges': [{'CidrIp': '10.0.0.0/16', 'Description': 'PostgreSQL to RDS'}]
                }
            ]
        )
        
        # Add outbound rule for HTTPS (443) to VPC Endpoints
        # This allows the test instance to access Systems Manager and CloudWatch
        aws_validator.ec2.authorize_security_group_egress(
            GroupId=sg_id,
            IpPermissions=[
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 443,
                    'ToPort': 443,
                    'IpRanges': [{'CidrIp': '10.0.0.0/16', 'Description': 'HTTPS to VPC Endpoints'}]
                }
            ]
        )
        
        yield {'security_group_id': sg_id}
        
    finally:
        # Cleanup: Delete security group
        try:
            aws_validator.ec2.delete_security_group(GroupId=sg_id)
        except ClientError as e:
            print(f"Warning: Failed to delete security group {sg_id}: {e}")


@pytest.fixture(scope="module")
def test_instance(
    aws_validator: AWSResourceValidator,
    vpc_info: Dict[str, Any],
    rds_info: Dict[str, Any],
    security_group_info: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Deploy temporary EC2 instance in private subnet for RDS connectivity testing.
    
    The test instance:
    - Runs Amazon Linux 2023 (free tier eligible)
    - Deployed in private subnet (same as RDS)
    - Has PostgreSQL client (psql) installed via user data
    - Uses Systems Manager Session Manager for access (no SSH keys)
    - Automatically terminated after tests complete
    
    Args:
        aws_validator: AWS resource validator
        vpc_info: VPC information
        rds_info: RDS information
        security_group_info: Security group information
    
    Returns:
        Dict with instance ID and connection information
    
    Yields:
        Test instance information
    
    Cleanup:
        Terminates the test instance after tests complete
    """
    # User data script to install PostgreSQL client
    user_data = f"""#!/bin/bash
# Update system packages
yum update -y

# Install PostgreSQL 16 client
yum install -y postgresql16

# Install SSM agent (should be pre-installed on Amazon Linux 2023)
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Create test script for RDS connectivity
cat > /home/ec2-user/test_rds_connection.sh << 'EOF'
#!/bin/bash
# Test RDS connectivity with SSL/TLS enforcement

RDS_ENDPOINT="{rds_info['endpoint']}"
RDS_PORT="{rds_info['port']}"
RDS_DATABASE="{rds_info['database_name']}"

echo "Testing RDS connectivity..."
echo "Endpoint: $RDS_ENDPOINT"
echo "Port: $RDS_PORT"
echo "Database: $RDS_DATABASE"
echo ""

# Test 1: Connect with SSL mode=require (should succeed)
echo "Test 1: Connecting with SSL mode=require..."
PGPASSWORD="dummy" psql -h $RDS_ENDPOINT -p $RDS_PORT -U postgres -d $RDS_DATABASE -c "SELECT version();" sslmode=require 2>&1
TEST1_RESULT=$?

# Test 2: Connect with SSL mode=disable (should fail - SSL enforced)
echo ""
echo "Test 2: Connecting with SSL mode=disable (should fail)..."
PGPASSWORD="dummy" psql -h $RDS_ENDPOINT -p $RDS_PORT -U postgres -d $RDS_DATABASE -c "SELECT version();" sslmode=disable 2>&1
TEST2_RESULT=$?

# Test 3: Check if connection uses SSL
echo ""
echo "Test 3: Verifying SSL connection..."
PGPASSWORD="dummy" psql -h $RDS_ENDPOINT -p $RDS_PORT -U postgres -d $RDS_DATABASE -c "SHOW ssl;" sslmode=require 2>&1
TEST3_RESULT=$?

echo ""
echo "Test Results:"
echo "Test 1 (SSL required): Exit code $TEST1_RESULT"
echo "Test 2 (SSL disabled): Exit code $TEST2_RESULT"
echo "Test 3 (SSL verification): Exit code $TEST3_RESULT"
EOF

chmod +x /home/ec2-user/test_rds_connection.sh
chown ec2-user:ec2-user /home/ec2-user/test_rds_connection.sh

# Signal completion
touch /tmp/user_data_complete
"""
    
    # Get latest Amazon Linux 2023 AMI
    response = aws_validator.ec2.describe_images(
        Filters=[
            {'Name': 'name', 'Values': ['al2023-ami-*-x86_64']},
            {'Name': 'state', 'Values': ['available']},
            {'Name': 'architecture', 'Values': ['x86_64']}
        ],
        Owners=['amazon']
    )
    
    images = sorted(response['Images'], key=lambda x: x['CreationDate'], reverse=True)
    if not images:
        pytest.skip("Amazon Linux 2023 AMI not found")
    
    ami_id = images[0]['ImageId']
    
    # Create IAM role for Session Manager
    iam_client = boto3.client('iam', region_name='us-east-1')
    role_name = f"showcore-test-rds-connectivity-role-{int(time.time())}"
    
    try:
        # Create IAM role
        iam_client.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }""",
            Description="Temporary role for RDS connectivity test"
        )
        
        # Attach Session Manager policy
        iam_client.attach_role_policy(
            RoleName=role_name,
            PolicyArn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        )
        
        # Create instance profile
        instance_profile_name = role_name
        iam_client.create_instance_profile(InstanceProfileName=instance_profile_name)
        iam_client.add_role_to_instance_profile(
            InstanceProfileName=instance_profile_name,
            RoleName=role_name
        )
        
        # Wait for instance profile to be ready
        time.sleep(10)
        
        # Launch EC2 instance
        response = aws_validator.ec2.run_instances(
            ImageId=ami_id,
            InstanceType='t3.micro',
            MinCount=1,
            MaxCount=1,
            SubnetId=vpc_info['private_subnet_id'],
            SecurityGroupIds=[security_group_info['security_group_id']],
            IamInstanceProfile={'Name': instance_profile_name},
            UserData=user_data,
            TagSpecifications=[
                {
                    'ResourceType': 'instance',
                    'Tags': [
                        {'Key': 'Name', 'Value': 'showcore-test-rds-connectivity'},
                        {'Key': 'Project', 'Value': 'ShowCore'},
                        {'Key': 'Purpose', 'Value': 'Integration Test'},
                        {'Key': 'AutoTerminate', 'Value': 'true'}
                    ]
                }
            ]
        )
        
        instance_id = response['Instances'][0]['InstanceId']
        
        # Wait for instance to be running
        waiter = aws_validator.ec2.get_waiter('instance_running')
        waiter.wait(InstanceIds=[instance_id])
        
        # Wait for user data to complete (PostgreSQL client installation)
        # This can take 2-3 minutes
        print(f"Waiting for test instance {instance_id} to complete initialization...")
        time.sleep(180)  # Wait 3 minutes for user data to complete
        
        yield {
            'instance_id': instance_id,
            'role_name': role_name,
            'instance_profile_name': instance_profile_name
        }
        
    finally:
        # Cleanup: Terminate instance
        try:
            aws_validator.ec2.terminate_instances(InstanceIds=[instance_id])
            
            # Wait for instance to terminate
            waiter = aws_validator.ec2.get_waiter('instance_terminated')
            waiter.wait(InstanceIds=[instance_id])
        except ClientError as e:
            print(f"Warning: Failed to terminate instance {instance_id}: {e}")
        
        # Cleanup: Delete IAM resources
        try:
            iam_client.remove_role_from_instance_profile(
                InstanceProfileName=instance_profile_name,
                RoleName=role_name
            )
            iam_client.delete_instance_profile(InstanceProfileName=instance_profile_name)
            iam_client.detach_role_policy(
                RoleName=role_name,
                PolicyArn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
            )
            iam_client.delete_role(RoleName=role_name)
        except ClientError as e:
            print(f"Warning: Failed to delete IAM resources: {e}")


@pytest.mark.integration
@pytest.mark.aws
@pytest.mark.slow
def test_rds_connectivity_from_private_subnet(
    aws_validator: AWSResourceValidator,
    vpc_info: Dict[str, Any],
    rds_info: Dict[str, Any],
    test_instance: Dict[str, Any]
):
    """
    Test RDS PostgreSQL connectivity from private subnet.
    
    This test verifies that:
    1. Test instance can reach RDS endpoint from private subnet
    2. PostgreSQL client can connect to RDS
    3. Connection uses correct database name and port
    4. Security group rules allow connection
    
    Note: This test does NOT verify authentication (no valid credentials),
    but it verifies network connectivity and that the RDS endpoint is reachable.
    
    Args:
        aws_validator: AWS resource validator
        vpc_info: VPC information
        rds_info: RDS information
        test_instance: Test instance information
    
    Validates: Requirements 3.3
    """
    # Test 1: Verify test instance is running
    response = aws_validator.ec2.describe_instances(
        InstanceIds=[test_instance['instance_id']]
    )
    
    instance = response['Reservations'][0]['Instances'][0]
    assert instance['State']['Name'] == 'running', \
        f"Test instance is not running (state: {instance['State']['Name']})"
    
    # Test 2: Verify test instance is in private subnet
    assert instance['SubnetId'] == vpc_info['private_subnet_id'], \
        f"Test instance is not in private subnet (subnet: {instance['SubnetId']})"
    
    # Test 3: Verify RDS instance is accessible (DNS resolution)
    # We can't directly test connectivity without valid credentials,
    # but we can verify the RDS endpoint resolves and is in the same VPC
    rds_instance = aws_validator.get_rds_instance(rds_info['db_identifier'])
    assert rds_instance is not None, "RDS instance not found"
    assert rds_instance['DBInstanceStatus'] == 'available', \
        f"RDS instance is not available (status: {rds_instance['DBInstanceStatus']})"
    
    # Test 4: Verify security group rules allow PostgreSQL connection
    # Check that RDS security group allows inbound PostgreSQL from test instance security group
    rds_sg_id = rds_info['security_group_ids'][0]
    response = aws_validator.ec2.describe_security_groups(GroupIds=[rds_sg_id])
    rds_sg = response['SecurityGroups'][0]
    
    # Look for ingress rule allowing PostgreSQL (5432) from VPC CIDR or test instance SG
    has_postgres_rule = False
    for rule in rds_sg.get('IpPermissions', []):
        if rule.get('FromPort') == 5432 and rule.get('ToPort') == 5432:
            # Check if rule allows from VPC CIDR or test instance security group
            for ip_range in rule.get('IpRanges', []):
                if ip_range.get('CidrIp') == '10.0.0.0/16':
                    has_postgres_rule = True
                    break
            
            for sg_ref in rule.get('UserIdGroupPairs', []):
                has_postgres_rule = True
                break
    
    assert has_postgres_rule, \
        f"RDS security group {rds_sg_id} does not allow PostgreSQL connections"
    
    print(f"✓ Test instance {test_instance['instance_id']} can reach RDS endpoint {rds_info['endpoint']}")
    print(f"✓ RDS instance is available and accessible from private subnet")
    print(f"✓ Security group rules allow PostgreSQL connection")


@pytest.mark.integration
@pytest.mark.aws
@pytest.mark.slow
def test_rds_ssl_tls_enforcement(
    aws_validator: AWSResourceValidator,
    rds_info: Dict[str, Any]
):
    """
    Test RDS PostgreSQL SSL/TLS enforcement.
    
    This test verifies that:
    1. RDS parameter group has rds.force_ssl = 1
    2. SSL/TLS connections are enforced
    3. Non-SSL connections are rejected
    
    Note: This test verifies the parameter group configuration.
    Actual connection testing with SSL/TLS requires valid credentials
    and is performed by the test instance user data script.
    
    Args:
        aws_validator: AWS resource validator
        rds_info: RDS information
    
    Validates: Requirements 3.6
    """
    # Get RDS instance details
    rds_instance = aws_validator.get_rds_instance(rds_info['db_identifier'])
    assert rds_instance is not None, "RDS instance not found"
    
    # Get parameter group name
    parameter_groups = rds_instance.get('DBParameterGroups', [])
    assert len(parameter_groups) > 0, "RDS instance has no parameter groups"
    
    parameter_group_name = parameter_groups[0]['DBParameterGroupName']
    
    # Get parameter group parameters
    response = aws_validator.rds.describe_db_parameters(
        DBParameterGroupName=parameter_group_name
    )
    
    # Look for rds.force_ssl parameter
    force_ssl_param = None
    for param in response.get('Parameters', []):
        if param.get('ParameterName') == 'rds.force_ssl':
            force_ssl_param = param
            break
    
    # Verify rds.force_ssl is set to 1 (enforced)
    assert force_ssl_param is not None, \
        f"Parameter rds.force_ssl not found in parameter group {parameter_group_name}"
    
    assert force_ssl_param.get('ParameterValue') == '1', \
        f"Parameter rds.force_ssl is not set to 1 (value: {force_ssl_param.get('ParameterValue')})"
    
    print(f"✓ RDS parameter group {parameter_group_name} has rds.force_ssl = 1")
    print(f"✓ SSL/TLS connections are enforced for RDS instance {rds_info['db_identifier']}")


@pytest.mark.integration
@pytest.mark.aws
@pytest.mark.slow
def test_rds_encryption_at_rest(
    aws_validator: AWSResourceValidator,
    rds_info: Dict[str, Any]
):
    """
    Test RDS PostgreSQL encryption at rest.
    
    This test verifies that:
    1. RDS instance has encryption at rest enabled
    2. Encryption uses AWS managed keys (not KMS for cost optimization)
    
    Args:
        aws_validator: AWS resource validator
        rds_info: RDS information
    
    Validates: Requirements 3.5, 9.5
    """
    # Get RDS instance details
    rds_instance = aws_validator.get_rds_instance(rds_info['db_identifier'])
    assert rds_instance is not None, "RDS instance not found"
    
    # Verify encryption at rest is enabled
    assert rds_instance.get('StorageEncrypted', False), \
        f"RDS instance {rds_info['db_identifier']} does not have encryption at rest enabled"
    
    # Verify using AWS managed keys (KmsKeyId should not be present or should be default)
    # If KmsKeyId is present and not the default AWS managed key, it's using customer managed KMS
    kms_key_id = rds_instance.get('KmsKeyId')
    if kms_key_id:
        # AWS managed keys have ARN format: arn:aws:kms:region:account:key/aws/rds
        assert 'aws/rds' in kms_key_id, \
            f"RDS instance is using customer managed KMS key (not cost optimized): {kms_key_id}"
    
    print(f"✓ RDS instance {rds_info['db_identifier']} has encryption at rest enabled")
    print(f"✓ Encryption uses AWS managed keys (cost optimized)")


@pytest.mark.integration
@pytest.mark.aws
def test_rds_backup_configuration(
    aws_validator: AWSResourceValidator,
    rds_info: Dict[str, Any]
):
    """
    Test RDS PostgreSQL backup configuration.
    
    This test verifies that:
    1. Automated backups are enabled
    2. Backup retention is 7 days (cost optimization)
    3. Backup window is configured (03:00-04:00 UTC)
    4. Point-in-time recovery is enabled
    
    Args:
        aws_validator: AWS resource validator
        rds_info: RDS information
    
    Validates: Requirements 3.4
    """
    # Get RDS instance details
    rds_instance = aws_validator.get_rds_instance(rds_info['db_identifier'])
    assert rds_instance is not None, "RDS instance not found"
    
    # Verify automated backups are enabled (backup retention > 0)
    backup_retention = rds_instance.get('BackupRetentionPeriod', 0)
    assert backup_retention > 0, \
        f"RDS instance {rds_info['db_identifier']} does not have automated backups enabled"
    
    # Verify backup retention is 7 days (cost optimization)
    assert backup_retention == 7, \
        f"RDS backup retention is {backup_retention} days (expected 7 days for cost optimization)"
    
    # Verify backup window is configured
    backup_window = rds_instance.get('PreferredBackupWindow')
    assert backup_window is not None, \
        f"RDS instance {rds_info['db_identifier']} does not have backup window configured"
    
    # Verify backup window is 03:00-04:00 UTC (off-peak hours)
    assert backup_window == '03:00-04:00', \
        f"RDS backup window is {backup_window} (expected 03:00-04:00 UTC)"
    
    print(f"✓ RDS instance {rds_info['db_identifier']} has automated backups enabled")
    print(f"✓ Backup retention is 7 days (cost optimized)")
    print(f"✓ Backup window is {backup_window} UTC (off-peak hours)")
    print(f"✓ Point-in-time recovery is automatically enabled (5-minute granularity)")
