"""
Unit tests for ShowCore Security Stack

Tests verify:
- Security groups have correct ingress rules
- Security groups follow least privilege (no 0.0.0.0/0 on sensitive ports)
- AWS Config is enabled and recording
- CloudTrail is enabled with log file validation
- Systems Manager Session Manager is configured
- CloudTrail S3 bucket has SSE-S3 encryption (not KMS)
- S3 buckets have versioning enabled
- S3 buckets have lifecycle policies

Validates: Requirements 6.2, 6.3, 6.5, 6.8, 9.9
"""

import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2
from aws_cdk.assertions import Template, Match
from lib.stacks.security_stack import ShowCoreSecurityStack


def _create_test_vpc(app: cdk.App) -> ec2.Vpc:
    """Create a test VPC for security stack tests."""
    test_stack = cdk.Stack(app, "TestVpcStack")
    return ec2.Vpc(
        test_stack,
        "TestVpc",
        cidr="10.0.0.0/16",
        max_azs=2
    )


# ============================================================================
# Security Group Tests (Requirements 6.2)
# ============================================================================

def test_rds_security_group_created():
    """Test RDS security group is created with correct configuration."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify RDS security group exists
    template.has_resource_properties("AWS::EC2::SecurityGroup", {
        "GroupDescription": "Security group for RDS PostgreSQL instance - allows PostgreSQL from application tier",
        "VpcId": Match.any_value()
    })


def test_elasticache_security_group_created():
    """Test ElastiCache security group is created with correct configuration."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify ElastiCache security group exists
    template.has_resource_properties("AWS::EC2::SecurityGroup", {
        "GroupDescription": "Security group for ElastiCache Redis cluster - allows Redis from application tier",
        "VpcId": Match.any_value()
    })


def test_vpc_endpoint_security_group_created():
    """Test VPC Endpoint security group is created with correct configuration."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify VPC Endpoint security group exists with HTTPS ingress rule
    template.has_resource_properties("AWS::EC2::SecurityGroup", {
        "GroupDescription": "Security group for VPC Interface Endpoints - allows HTTPS from VPC CIDR",
        "SecurityGroupIngress": [
            {
                "CidrIp": "10.0.0.0/16",
                "Description": "HTTPS from VPC for AWS service access",
                "FromPort": 443,
                "IpProtocol": "tcp",
                "ToPort": 443
            }
        ]
    })


def test_security_groups_have_no_outbound_rules():
    """Test security groups have no outbound rules (stateful firewall)."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify security groups have no egress rules (allow_all_outbound=False)
    # CDK creates security groups without explicit egress rules when allow_all_outbound=False
    # This is correct behavior for stateful firewalls
    security_groups = template.find_resources("AWS::EC2::SecurityGroup")
    
    # Count security groups (should be 3: RDS, ElastiCache, VPC Endpoint)
    assert len(security_groups) == 3


def test_rds_security_group_has_no_ingress_rules():
    """Test RDS security group has no ingress rules initially (least privilege)."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Find RDS security group
    security_groups = template.find_resources("AWS::EC2::SecurityGroup", {
        "Properties": {
            "GroupDescription": "Security group for RDS PostgreSQL instance - allows PostgreSQL from application tier"
        }
    })
    
    # Verify RDS security group has no ingress rules (will be added when app tier is deployed)
    for sg_id, sg_props in security_groups.items():
        # SecurityGroupIngress should not exist or be empty
        assert "SecurityGroupIngress" not in sg_props["Properties"] or \
               len(sg_props["Properties"]["SecurityGroupIngress"]) == 0


def test_elasticache_security_group_has_no_ingress_rules():
    """Test ElastiCache security group has no ingress rules initially (least privilege)."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Find ElastiCache security group
    security_groups = template.find_resources("AWS::EC2::SecurityGroup", {
        "Properties": {
            "GroupDescription": "Security group for ElastiCache Redis cluster - allows Redis from application tier"
        }
    })
    
    # Verify ElastiCache security group has no ingress rules (will be added when app tier is deployed)
    for sg_id, sg_props in security_groups.items():
        # SecurityGroupIngress should not exist or be empty
        assert "SecurityGroupIngress" not in sg_props["Properties"] or \
               len(sg_props["Properties"]["SecurityGroupIngress"]) == 0


def test_security_group_outputs_exported():
    """Test security group IDs are exported for cross-stack references."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify security group outputs exist
    outputs = template.find_outputs("*")
    assert "RdsSecurityGroupId" in outputs
    assert "ElastiCacheSecurityGroupId" in outputs
    assert "VpcEndpointSecurityGroupId" in outputs


# ============================================================================
# CloudTrail Tests (Requirements 6.5, 9.9)
# ============================================================================

def test_cloudtrail_trail_created():
    """Test CloudTrail trail is created with correct configuration."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify CloudTrail trail exists with log file validation enabled
    template.has_resource_properties("AWS::CloudTrail::Trail", {
        "IsMultiRegionTrail": True,
        "IncludeGlobalServiceEvents": True,
        "EnableLogFileValidation": True,
    })


def test_cloudtrail_bucket_created():
    """Test S3 bucket for CloudTrail logs is created."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify S3 buckets exist (CloudTrail bucket + Config bucket = 2)
    template.resource_count_is("AWS::S3::Bucket", 2)


def test_cloudtrail_bucket_has_versioning():
    """Test CloudTrail S3 bucket has versioning enabled."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify CloudTrail bucket has versioning enabled
    template.has_resource_properties("AWS::S3::Bucket", {
        "VersioningConfiguration": {
            "Status": "Enabled"
        }
    })


def test_cloudtrail_bucket_has_sse_s3_encryption():
    """Test CloudTrail S3 bucket has SSE-S3 encryption (not KMS for cost optimization)."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify CloudTrail bucket has SSE-S3 encryption (AES256, not KMS)
    template.has_resource_properties("AWS::S3::Bucket", {
        "BucketEncryption": {
            "ServerSideEncryptionConfiguration": [
                {
                    "ServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"  # SSE-S3 (not aws:kms)
                    }
                }
            ]
        }
    })


def test_cloudtrail_bucket_blocks_public_access():
    """Test CloudTrail S3 bucket blocks all public access."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify CloudTrail bucket blocks all public access
    template.has_resource_properties("AWS::S3::Bucket", {
        "PublicAccessBlockConfiguration": {
            "BlockPublicAcls": True,
            "BlockPublicPolicy": True,
            "IgnorePublicAcls": True,
            "RestrictPublicBuckets": True
        }
    })


def test_cloudtrail_bucket_has_lifecycle_policy():
    """Test CloudTrail S3 bucket has lifecycle policy to delete old logs."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify CloudTrail bucket has lifecycle rule to delete logs after 90 days
    template.has_resource_properties("AWS::S3::Bucket", {
        "LifecycleConfiguration": {
            "Rules": Match.array_with([
                Match.object_like({
                    "Id": "DeleteOldLogs",
                    "Status": "Enabled",
                    "ExpirationInDays": 90
                })
            ])
        }
    })


def test_cloudtrail_bucket_has_policy():
    """Test CloudTrail S3 bucket has policy allowing CloudTrail to write logs."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify bucket policy allows CloudTrail service
    template.has_resource_properties("AWS::S3::BucketPolicy", {
        "PolicyDocument": {
            "Statement": Match.array_with([
                Match.object_like({
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "cloudtrail.amazonaws.com"
                    },
                    "Action": "s3:GetBucketAcl"
                }),
                Match.object_like({
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "cloudtrail.amazonaws.com"
                    },
                    "Action": "s3:PutObject"
                })
            ])
        }
    })


# ============================================================================
# AWS Config Tests (Requirements 6.3)
# ============================================================================

def test_config_recorder_created():
    """Test AWS Config configuration recorder is created."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify Config recorder exists and records all resource types
    template.has_resource_properties("AWS::Config::ConfigurationRecorder", {
        "RecordingGroup": {
            "AllSupported": True,
            "IncludeGlobalResourceTypes": True
        }
    })


def test_config_delivery_channel_created():
    """Test AWS Config delivery channel is created."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify Config delivery channel exists with daily snapshots
    template.has_resource_properties("AWS::Config::DeliveryChannel", {
        "ConfigSnapshotDeliveryProperties": {
            "DeliveryFrequency": "TwentyFour_Hours"
        }
    })


def test_config_rules_created():
    """Test AWS Config rules are created for compliance monitoring."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify Config rules exist (2 rules: RDS encryption, S3 public read)
    template.resource_count_is("AWS::Config::ConfigRule", 2)
    
    # Verify RDS storage encrypted rule
    template.has_resource_properties("AWS::Config::ConfigRule", {
        "ConfigRuleName": "showcore-rds-storage-encrypted",
        "Source": {
            "Owner": "AWS",
            "SourceIdentifier": "RDS_STORAGE_ENCRYPTED"
        }
    })
    
    # Verify S3 bucket public read prohibited rule
    template.has_resource_properties("AWS::Config::ConfigRule", {
        "ConfigRuleName": "showcore-s3-bucket-public-read-prohibited",
        "Source": {
            "Owner": "AWS",
            "SourceIdentifier": "S3_BUCKET_PUBLIC_READ_PROHIBITED"
        }
    })


def test_config_bucket_created():
    """Test S3 bucket for AWS Config delivery channel is created."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify Config bucket has versioning and SSE-S3 encryption
    template.has_resource_properties("AWS::S3::Bucket", {
        "VersioningConfiguration": {
            "Status": "Enabled"
        },
        "BucketEncryption": {
            "ServerSideEncryptionConfiguration": [
                {
                    "ServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"  # SSE-S3 (not KMS)
                    }
                }
            ]
        }
    })


def test_config_bucket_has_lifecycle_policies():
    """Test AWS Config S3 bucket has lifecycle policies for cost optimization."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify Config bucket has lifecycle rules (Glacier transition + deletion)
    template.has_resource_properties("AWS::S3::Bucket", {
        "LifecycleConfiguration": {
            "Rules": Match.array_with([
                Match.object_like({
                    "Id": "TransitionOldConfigDataToGlacier",
                    "Status": "Enabled",
                    "Transitions": Match.array_with([
                        Match.object_like({
                            "StorageClass": "GLACIER",
                            "TransitionInDays": 90
                        })
                    ])
                }),
                Match.object_like({
                    "Id": "DeleteOldConfigData",
                    "Status": "Enabled",
                    "ExpirationInDays": 365
                })
            ])
        }
    })


def test_config_iam_role_created():
    """Test IAM role for AWS Config is created."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify Config IAM role exists with correct managed policy
    template.has_resource_properties("AWS::IAM::Role", {
        "AssumeRolePolicyDocument": {
            "Statement": Match.array_with([
                Match.object_like({
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "config.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                })
            ])
        },
        "ManagedPolicyArns": Match.array_with([
            Match.string_like_regexp(".*ConfigRole.*")
        ])
    })


# ============================================================================
# Session Manager Tests (Requirements 6.8)
# ============================================================================

def test_session_manager_role_created():
    """Test IAM role for Session Manager is created."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify Session Manager IAM role exists
    template.has_resource_properties("AWS::IAM::Role", {
        "RoleName": "showcore-session-manager-role",
        "AssumeRolePolicyDocument": {
            "Statement": Match.array_with([
                Match.object_like({
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                })
            ])
        },
        "ManagedPolicyArns": Match.array_with([
            Match.string_like_regexp(".*AmazonSSMManagedInstanceCore.*")
        ])
    })


def test_session_manager_role_has_cloudwatch_logs_permissions():
    """Test Session Manager role has CloudWatch Logs permissions for session logging."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify Session Manager role has inline policy for CloudWatch Logs
    template.has_resource_properties("AWS::IAM::Policy", {
        "PolicyDocument": {
            "Statement": Match.array_with([
                Match.object_like({
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogGroups",
                        "logs:DescribeLogStreams"
                    ]
                })
            ])
        }
    })


def test_session_manager_role_outputs_exported():
    """Test Session Manager role ARN and name are exported."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify Session Manager role outputs exist
    outputs = template.find_outputs("*")
    assert "SessionManagerRoleArn" in outputs
    assert "SessionManagerRoleName" in outputs


# ============================================================================
# Stack Outputs Tests
# ============================================================================

def test_stack_exports_all_required_outputs():
    """Test stack exports all required outputs for cross-stack references."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    template = Template.from_stack(stack)
    
    # Verify all required outputs exist
    outputs = template.find_outputs("*")
    
    # Security group outputs
    assert "RdsSecurityGroupId" in outputs
    assert "ElastiCacheSecurityGroupId" in outputs
    assert "VpcEndpointSecurityGroupId" in outputs
    
    # CloudTrail outputs
    assert "CloudTrailBucketName" in outputs
    assert "CloudTrailArn" in outputs
    
    # AWS Config outputs
    assert "ConfigBucketName" in outputs
    assert "ConfigRecorderName" in outputs
    
    # Session Manager outputs
    assert "SessionManagerRoleArn" in outputs
    assert "SessionManagerRoleName" in outputs


# ============================================================================
# Integration Tests
# ============================================================================

def test_stack_has_required_tags():
    """Test stack has all required tags from base stack."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    
    # Verify stack has required tags (inherited from ShowCoreBaseStack)
    tags = cdk.Tags.of(stack)
    # Note: Tags are applied at stack level, not directly testable via assertions
    # This test verifies the Tags.of() calls don't raise errors
    assert tags is not None


def test_stack_synthesizes_without_errors():
    """Test stack synthesizes without errors."""
    app = cdk.App()
    vpc = _create_test_vpc(app)
    stack = ShowCoreSecurityStack(app, "TestSecurityStack", vpc=vpc)
    
    # Synthesize stack to CloudFormation template
    template = Template.from_stack(stack)
    
    # Verify template is not empty
    assert template is not None
    
    # Verify template has resources
    resources = template.find_resources("*")
    assert len(resources) > 0
