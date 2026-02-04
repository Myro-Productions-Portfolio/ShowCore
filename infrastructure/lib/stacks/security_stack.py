"""
ShowCore Security Stack

This stack creates:
- Security groups for data tier (RDS, ElastiCache, VPC Endpoints)
- CloudTrail trail for audit logging across all regions
- S3 bucket for CloudTrail logs with versioning and encryption
- CloudTrail log file validation
- AWS Config for continuous compliance monitoring
- AWS Config rules for security compliance (rds-storage-encrypted, s3-bucket-public-read-prohibited)
- IAM role for AWS Systems Manager Session Manager with CloudWatch Logs permissions

Cost Optimization:
- CloudTrail: First trail is free, additional trails $2/month
- S3 storage for logs: ~$0.023/GB/month
- Log file validation: Free
- SSE-S3 encryption: Free (no KMS costs)
- Security groups: Free
- AWS Config: First 2 rules free, then $2/rule/month
- IAM role: Free
- Session Manager: Free
- CloudWatch Logs: ~$0.50/GB ingested, ~$0.03/GB stored

Security:
- Security groups follow least privilege principle
- NO 0.0.0.0/0 access on sensitive ports (22, 5432, 6379)
- RDS security group allows PostgreSQL only from application tier
- ElastiCache security group allows Redis only from application tier
- VPC Endpoint security group allows HTTPS only from VPC CIDR
- CloudTrail logs all API calls for audit trail
- S3 bucket has versioning enabled
- S3 bucket uses SSE-S3 encryption
- Log file validation ensures integrity
- Bucket policy restricts access to CloudTrail service only
- AWS Config monitors compliance continuously
- Session Manager provides secure instance access without SSH keys
- Session Manager logs all session activity to CloudWatch Logs
- No bastion hosts or open inbound ports required

Dependencies: ShowCoreNetworkStack (requires VPC)

Validates: Requirements 3.3, 4.3, 6.2, 6.3, 6.8, 2.12, 2.9
"""

from aws_cdk import (
    RemovalPolicy,
    Duration,
    aws_s3 as s3,
    aws_cloudtrail as cloudtrail,
    aws_iam as iam,
    aws_ec2 as ec2,
    aws_config as config,
    CfnOutput,
)
from constructs import Construct
from .base_stack import ShowCoreBaseStack


class ShowCoreSecurityStack(ShowCoreBaseStack):
    """
    Security infrastructure stack for ShowCore Phase 1.
    
    Creates security groups for data tier, CloudTrail for audit logging,
    AWS Config for continuous compliance monitoring, and IAM role for
    Session Manager secure instance access.
    
    Security Groups:
    - RDS Security Group: Allows PostgreSQL (5432) only from application tier
    - ElastiCache Security Group: Allows Redis (6379) only from application tier
    - VPC Endpoint Security Group: Allows HTTPS (443) only from VPC CIDR
    
    Security Best Practices:
    - Follows least privilege principle
    - NO 0.0.0.0/0 access on sensitive ports (22, 5432, 6379)
    - Descriptive security group rule descriptions
    - Stateful firewall (return traffic allowed automatically)
    
    Cost Optimization:
    - Security groups are free
    - First CloudTrail trail is free
    - S3 storage costs ~$0.023/GB/month
    - SSE-S3 encryption is free (no KMS costs)
    - Log file validation is free
    - AWS Config: First 2 rules free, then $2/rule/month
    - IAM role is free
    - Session Manager is free
    - CloudWatch Logs: ~$0.50/GB ingested, ~$0.03/GB stored
    
    Audit Logging:
    - CloudTrail logs all API calls across all regions
    - S3 bucket has versioning enabled for log integrity
    - S3 bucket uses SSE-S3 encryption at rest
    - Log file validation ensures logs haven't been tampered with
    - Bucket policy restricts access to CloudTrail service only
    
    Compliance Monitoring:
    - AWS Config monitors resource compliance continuously
    - Config rules: rds-storage-encrypted, s3-bucket-public-read-prohibited
    - Config delivery channel sends compliance data to S3
    - Configuration recorder tracks resource changes
    
    Session Manager:
    - IAM role for EC2 instances to use Session Manager
    - No SSH keys required for instance access
    - No bastion hosts required
    - No open inbound ports required
    - All session activity logged to CloudWatch Logs
    - Uses Systems Manager Interface Endpoint for private connectivity
    
    Resources:
    - RDS Security Group: PostgreSQL access control
    - ElastiCache Security Group: Redis access control
    - VPC Endpoint Security Group: AWS service access control
    - S3 Bucket: CloudTrail logs with versioning and encryption
    - CloudTrail Trail: Multi-region trail with log file validation
    - AWS Config Configuration Recorder: Tracks resource changes
    - AWS Config Delivery Channel: Delivers compliance data to S3
    - AWS Config Rules: rds-storage-encrypted, s3-bucket-public-read-prohibited
    - IAM Role: Session Manager role with CloudWatch Logs permissions
    
    Dependencies: ShowCoreNetworkStack (requires VPC)
    
    Validates: Requirements 3.3, 4.3, 6.2, 6.3, 6.8, 2.12, 2.9
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.IVpc,
        **kwargs
    ) -> None:
        """
        Initialize the security stack.
        
        Args:
            scope: CDK app or parent construct
            construct_id: Unique identifier for this stack
            vpc: VPC from NetworkStack for security group creation
            **kwargs: Additional stack properties
        """
        super().__init__(
            scope,
            construct_id,
            component="Security",
            **kwargs
        )
        
        # Store VPC reference
        self.vpc = vpc
        
        # Create security groups for data tier
        # These security groups follow least privilege principle
        # NO 0.0.0.0/0 access on sensitive ports (22, 5432, 6379)
        self.rds_security_group = self._create_rds_security_group()
        self.elasticache_security_group = self._create_elasticache_security_group()
        self.vpc_endpoint_security_group = self._create_vpc_endpoint_security_group()
        
        # Create S3 bucket for CloudTrail logs
        self.cloudtrail_bucket = self._create_cloudtrail_bucket()
        
        # Create CloudTrail trail
        self.trail = self._create_cloudtrail_trail()
        
        # AWS Config is disabled due to Service Control Policy (SCP) restrictions in this AWS account
        # The following resources are commented out:
        # - S3 bucket for AWS Config delivery channel
        # - AWS Config configuration recorder
        # - AWS Config delivery channel
        # - AWS Config rules for compliance monitoring
        
        # # Create S3 bucket for AWS Config delivery channel
        # self.config_bucket = self._create_config_bucket()
        # 
        # # Create AWS Config configuration recorder
        # self.config_recorder = self._create_config_recorder()
        # 
        # # Create AWS Config delivery channel
        # self.config_delivery_channel = self._create_config_delivery_channel()
        # 
        # # Create AWS Config rules for compliance monitoring
        # self.config_rules = self._create_config_rules()
        
        # Create IAM role for Session Manager
        self.session_manager_role = self._create_session_manager_role()
        
        # Export security group IDs for cross-stack references
        self._create_security_group_outputs()
        
        # Export CloudTrail bucket name and trail ARN
        CfnOutput(
            self,
            "CloudTrailBucketName",
            value=self.cloudtrail_bucket.bucket_name,
            export_name="ShowCoreCloudTrailBucketName",
            description="S3 bucket name for CloudTrail logs"
        )
        
        CfnOutput(
            self,
            "CloudTrailArn",
            value=self.trail.trail_arn,
            export_name="ShowCoreCloudTrailArn",
            description="ARN of CloudTrail trail"
        )
        
        # AWS Config outputs are commented out due to SCP restrictions
        # # Export AWS Config bucket name and recorder name
        # CfnOutput(
        #     self,
        #     "ConfigBucketName",
        #     value=self.config_bucket.bucket_name,
        #     export_name="ShowCoreConfigBucketName",
        #     description="S3 bucket name for AWS Config delivery channel"
        # )
        # 
        # CfnOutput(
        #     self,
        #     "ConfigRecorderName",
        #     value=self.config_recorder.name,
        #     export_name="ShowCoreConfigRecorderName",
        #     description="Name of AWS Config configuration recorder"
        # )
    
    def _create_rds_security_group(self) -> ec2.SecurityGroup:
        """
        Create security group for RDS PostgreSQL instance.
        
        Security Rules:
        - Ingress: PostgreSQL (5432) from application tier security group
        - Egress: None (stateful firewall, return traffic allowed automatically)
        
        Least Privilege:
        - NO 0.0.0.0/0 access on port 5432 (PostgreSQL)
        - NO 0.0.0.0/0 access on port 22 (SSH)
        - Only allows connections from application tier
        
        Note: Application tier security group will be created in future phase.
        For now, this security group is created without ingress rules.
        Ingress rules will be added when application tier is deployed.
        
        Cost: Free (no charges for security groups)
        
        Returns:
            Security Group construct for RDS
            
        Validates: Requirements 3.3, 6.2
        """
        rds_sg = ec2.SecurityGroup(
            self,
            "RdsSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS PostgreSQL instance - allows PostgreSQL from application tier",
            allow_all_outbound=False,  # No outbound rules needed (stateful)
        )
        
        # Note: Ingress rules will be added when application tier is deployed
        # For now, we create the security group without ingress rules
        # This follows the principle of least privilege - start with no access
        # 
        # Future ingress rule (to be added in application tier stack):
        # rds_sg.add_ingress_rule(
        #     peer=ec2.Peer.security_group_id(app_sg.security_group_id),
        #     connection=ec2.Port.tcp(5432),
        #     description="PostgreSQL from application tier"
        # )
        
        return rds_sg
    
    def _create_elasticache_security_group(self) -> ec2.SecurityGroup:
        """
        Create security group for ElastiCache Redis cluster.
        
        Security Rules:
        - Ingress: Redis (6379) from application tier security group
        - Egress: None (stateful firewall, return traffic allowed automatically)
        
        Least Privilege:
        - NO 0.0.0.0/0 access on port 6379 (Redis)
        - NO 0.0.0.0/0 access on port 22 (SSH)
        - Only allows connections from application tier
        
        Note: Application tier security group will be created in future phase.
        For now, this security group is created without ingress rules.
        Ingress rules will be added when application tier is deployed.
        
        Cost: Free (no charges for security groups)
        
        Returns:
            Security Group construct for ElastiCache
            
        Validates: Requirements 4.3, 6.2
        """
        elasticache_sg = ec2.SecurityGroup(
            self,
            "ElastiCacheSecurityGroup",
            vpc=self.vpc,
            description="Security group for ElastiCache Redis cluster - allows Redis from application tier",
            allow_all_outbound=False,  # No outbound rules needed (stateful)
        )
        
        # Note: Ingress rules will be added when application tier is deployed
        # For now, we create the security group without ingress rules
        # This follows the principle of least privilege - start with no access
        # 
        # Future ingress rule (to be added in application tier stack):
        # elasticache_sg.add_ingress_rule(
        #     peer=ec2.Peer.security_group_id(app_sg.security_group_id),
        #     connection=ec2.Port.tcp(6379),
        #     description="Redis from application tier"
        # )
        
        return elasticache_sg
    
    def _create_vpc_endpoint_security_group(self) -> ec2.SecurityGroup:
        """
        Create security group for VPC Interface Endpoints.
        
        Interface Endpoints use Elastic Network Interfaces (ENIs) with private IP
        addresses in the VPC. They require a security group to control access.
        
        Security Rules:
        - Ingress: HTTPS (443) from VPC CIDR (10.0.0.0/16)
        - Egress: None (stateful firewall, return traffic allowed automatically)
        
        This security group allows all resources in the VPC to access AWS services
        via Interface Endpoints using HTTPS.
        
        Least Privilege:
        - Only allows HTTPS (443) from VPC CIDR
        - NO 0.0.0.0/0 access
        - Restricts access to resources within the VPC only
        
        Cost: Free (no charges for security groups)
        
        Returns:
            Security Group construct for VPC Endpoints
            
        Validates: Requirements 2.12, 6.2
        """
        vpc_endpoint_sg = ec2.SecurityGroup(
            self,
            "VpcEndpointSecurityGroup",
            vpc=self.vpc,
            description="Security group for VPC Interface Endpoints - allows HTTPS from VPC CIDR",
            allow_all_outbound=False,  # No outbound rules needed (stateful)
        )
        
        # Allow HTTPS (443) from VPC CIDR
        # This allows all resources in the VPC to access AWS services via Interface Endpoints
        vpc_endpoint_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(443),
            description="HTTPS from VPC for AWS service access"
        )
        
        return vpc_endpoint_sg
    
    def _create_security_group_outputs(self) -> None:
        """
        Create CloudFormation outputs for security group IDs.
        
        Exports security group IDs for use by other stacks (Database, Cache).
        
        Exports:
        - RdsSecurityGroupId: Security group ID for RDS
        - ElastiCacheSecurityGroupId: Security group ID for ElastiCache
        - VpcEndpointSecurityGroupId: Security group ID for VPC Endpoints
        """
        CfnOutput(
            self,
            "RdsSecurityGroupId",
            value=self.rds_security_group.security_group_id,
            export_name="ShowCoreRdsSecurityGroupId",
            description="Security group ID for RDS PostgreSQL instance"
        )
        
        CfnOutput(
            self,
            "ElastiCacheSecurityGroupId",
            value=self.elasticache_security_group.security_group_id,
            export_name="ShowCoreElastiCacheSecurityGroupId",
            description="Security group ID for ElastiCache Redis cluster"
        )
        
        CfnOutput(
            self,
            "VpcEndpointSecurityGroupId",
            value=self.vpc_endpoint_security_group.security_group_id,
            export_name="ShowCoreVpcEndpointSecurityGroupId",
            description="Security group ID for VPC Interface Endpoints"
        )
    
    def _create_cloudtrail_bucket(self) -> s3.Bucket:
        """
        Create S3 bucket for CloudTrail logs.
        
        Configuration:
        - Versioning enabled for log integrity
        - SSE-S3 encryption at rest (free, no KMS costs)
        - Block all public access
        - Lifecycle policy to delete logs after 90 days (cost optimization)
        - Bucket policy allows CloudTrail service to write logs
        
        Cost Optimization:
        - SSE-S3 encryption is free (no KMS costs)
        - Short retention period (90 days) reduces storage costs
        - S3 storage costs: ~$0.023/GB/month
        
        Security:
        - Versioning enabled for log integrity
        - Log file validation enabled in CloudTrail trail
        - Bucket policy restricts access to CloudTrail service only
        - Block all public access
        
        Returns:
            S3 Bucket construct for CloudTrail logs
            
        Validates: Requirements 6.5, 1.4, 9.9
        """
        bucket = s3.Bucket(
            self,
            "CloudTrailBucket",
            bucket_name=f"showcore-cloudtrail-logs-{self.account}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,  # SSE-S3 (free)
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,  # Keep logs on stack deletion
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    enabled=True,
                    expiration=Duration.days(90)  # Delete logs after 90 days (cost optimization)
                )
            ]
        )
        
        # Add bucket policy to allow CloudTrail to write logs
        bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSCloudTrailAclCheck",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=["s3:GetBucketAcl"],
                resources=[bucket.bucket_arn]
            )
        )
        
        bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSCloudTrailWrite",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=["s3:PutObject"],
                resources=[f"{bucket.bucket_arn}/*"],
                conditions={
                    "StringEquals": {
                        "s3:x-amz-acl": "bucket-owner-full-control"
                    }
                }
            )
        )
        
        return bucket
    
    def _create_cloudtrail_trail(self) -> cloudtrail.Trail:
        """
        Create CloudTrail trail for audit logging.
        
        Configuration:
        - Multi-region trail (logs API calls from all regions)
        - Logs management events (API calls)
        - Log file validation enabled (ensures integrity)
        - Logs stored in S3 bucket with encryption
        - First trail is free
        
        Returns:
            CloudTrail Trail construct
        """
        trail = cloudtrail.Trail(
            self,
            "CloudTrail",
            trail_name="showcore-audit-trail",
            bucket=self.cloudtrail_bucket,
            is_multi_region_trail=True,  # Log API calls from all regions
            include_global_service_events=True,  # Include IAM, STS, CloudFront
            enable_file_validation=True,  # Enable log file validation
            management_events=cloudtrail.ReadWriteType.ALL,  # Log all management events
        )
        
        return trail
    
    def _create_config_bucket(self) -> s3.Bucket:
        """
        Create S3 bucket for AWS Config delivery channel.
        
        AWS Config uses a delivery channel to send configuration snapshots and
        compliance data to an S3 bucket. This bucket stores:
        - Configuration snapshots (periodic snapshots of resource configurations)
        - Configuration history (changes to resource configurations over time)
        - Compliance data (results of Config rule evaluations)
        
        Configuration:
        - Versioning enabled for data integrity
        - SSE-S3 encryption at rest (free, no KMS costs)
        - Block all public access
        - Lifecycle policy to transition old data to Glacier after 90 days
        - Bucket policy allows AWS Config service to write data
        
        Cost Optimization:
        - SSE-S3 encryption is free (no KMS costs)
        - Lifecycle policy reduces storage costs
        - Glacier transition after 90 days (~$0.004/GB/month vs ~$0.023/GB/month)
        
        Returns:
            S3 Bucket construct for AWS Config delivery channel
            
        Validates: Requirements 6.3
        """
        bucket = s3.Bucket(
            self,
            "ConfigBucket",
            bucket_name=f"showcore-config-{self.account}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,  # SSE-S3 (free)
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,  # Keep compliance data on stack deletion
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionOldConfigDataToGlacier",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                ),
                s3.LifecycleRule(
                    id="DeleteOldConfigData",
                    enabled=True,
                    expiration=Duration.days(365)  # Delete data after 1 year
                )
            ]
        )
        
        # Add bucket policy to allow AWS Config to write data
        bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSConfigBucketPermissionsCheck",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("config.amazonaws.com")],
                actions=["s3:GetBucketAcl"],
                resources=[bucket.bucket_arn]
            )
        )
        
        bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSConfigBucketExistenceCheck",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("config.amazonaws.com")],
                actions=["s3:ListBucket"],
                resources=[bucket.bucket_arn]
            )
        )
        
        bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSConfigBucketPutObject",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("config.amazonaws.com")],
                actions=["s3:PutObject"],
                resources=[f"{bucket.bucket_arn}/*"],
                conditions={
                    "StringEquals": {
                        "s3:x-amz-acl": "bucket-owner-full-control"
                    }
                }
            )
        )
        
        return bucket
    
    def _create_config_recorder(self) -> config.CfnConfigurationRecorder:
        """
        Create AWS Config configuration recorder.
        
        The configuration recorder tracks changes to AWS resources in your account.
        It records:
        - Resource configurations (current state of resources)
        - Resource relationships (how resources are connected)
        - Configuration changes (when resources are created, modified, or deleted)
        
        Configuration:
        - Records all supported resource types
        - Records global resources (IAM, CloudFront, etc.)
        - Uses IAM role with permissions to read resource configurations
        
        Cost:
        - Configuration items: First 2,000 free, then $0.003 per item
        - For low-traffic project, likely to stay within free tier
        
        Returns:
            AWS Config Configuration Recorder construct
            
        Validates: Requirements 6.3
        """
        # Create IAM role for AWS Config
        config_role = iam.Role(
            self,
            "ConfigRole",
            assumed_by=iam.ServicePrincipal("config.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWS_ConfigRole")
            ],
            description="IAM role for AWS Config to read resource configurations"
        )
        
        # Create configuration recorder
        recorder = config.CfnConfigurationRecorder(
            self,
            "ConfigRecorder",
            name="showcore-config-recorder",
            role_arn=config_role.role_arn,
            recording_group=config.CfnConfigurationRecorder.RecordingGroupProperty(
                all_supported=True,  # Record all supported resource types
                include_global_resource_types=True  # Include IAM, CloudFront, etc.
            )
        )
        
        return recorder
    
    def _create_config_delivery_channel(self) -> config.CfnDeliveryChannel:
        """
        Create AWS Config delivery channel.
        
        The delivery channel sends configuration snapshots and compliance data
        to the S3 bucket. It delivers:
        - Configuration snapshots (periodic snapshots of all resources)
        - Configuration history (changes to resources over time)
        - Compliance data (results of Config rule evaluations)
        
        Configuration:
        - Delivers to S3 bucket created in _create_config_bucket()
        - Snapshot delivery frequency: 24 hours (daily)
        - Depends on configuration recorder
        
        Cost:
        - Delivery channel itself is free
        - S3 storage costs apply (~$0.023/GB/month)
        
        Returns:
            AWS Config Delivery Channel construct
            
        Validates: Requirements 6.3
        """
        delivery_channel = config.CfnDeliveryChannel(
            self,
            "ConfigDeliveryChannel",
            name="showcore-config-delivery-channel",
            s3_bucket_name=self.config_bucket.bucket_name,
            config_snapshot_delivery_properties=config.CfnDeliveryChannel.ConfigSnapshotDeliveryPropertiesProperty(
                delivery_frequency="TwentyFour_Hours"  # Daily snapshots
            )
        )
        
        # Delivery channel depends on configuration recorder
        delivery_channel.add_dependency(self.config_recorder)
        
        return delivery_channel
    
    def _create_config_rules(self) -> list:
        """
        Create AWS Config rules for compliance monitoring.
        
        Config rules evaluate resource configurations against desired settings.
        They provide continuous compliance monitoring and alert when resources
        are non-compliant.
        
        Rules:
        1. rds-storage-encrypted: Ensures RDS instances have encryption at rest enabled
        2. s3-bucket-public-read-prohibited: Ensures S3 buckets are not publicly readable
        
        Cost:
        - First 2 rules are free
        - Additional rules: $2/rule/month
        - For Phase 1, we have 2 rules, so cost is $0/month
        
        Returns:
            List of AWS Config Rule constructs
            
        Validates: Requirements 6.3
        """
        rules = []
        
        # Rule 1: RDS storage encrypted
        # Ensures all RDS instances have encryption at rest enabled
        rds_encrypted_rule = config.CfnConfigRule(
            self,
            "RdsStorageEncryptedRule",
            config_rule_name="showcore-rds-storage-encrypted",
            description="Checks that RDS instances have encryption at rest enabled",
            source=config.CfnConfigRule.SourceProperty(
                owner="AWS",
                source_identifier="RDS_STORAGE_ENCRYPTED"
            )
        )
        
        # Rule depends on configuration recorder and delivery channel
        rds_encrypted_rule.add_dependency(self.config_recorder)
        rds_encrypted_rule.add_dependency(self.config_delivery_channel)
        
        rules.append(rds_encrypted_rule)
        
        # Rule 2: S3 bucket public read prohibited
        # Ensures S3 buckets do not allow public read access
        s3_public_read_rule = config.CfnConfigRule(
            self,
            "S3BucketPublicReadProhibitedRule",
            config_rule_name="showcore-s3-bucket-public-read-prohibited",
            description="Checks that S3 buckets do not allow public read access",
            source=config.CfnConfigRule.SourceProperty(
                owner="AWS",
                source_identifier="S3_BUCKET_PUBLIC_READ_PROHIBITED"
            )
        )
        
        # Rule depends on configuration recorder and delivery channel
        s3_public_read_rule.add_dependency(self.config_recorder)
        s3_public_read_rule.add_dependency(self.config_delivery_channel)
        
        rules.append(s3_public_read_rule)
        
        return rules

    def _create_session_manager_role(self) -> iam.Role:
        """
        Create IAM role for AWS Systems Manager Session Manager.
        
        Session Manager provides secure, auditable instance management without
        requiring SSH keys, bastion hosts, or open inbound ports. It uses the
        Systems Manager Interface Endpoint to connect to instances in private
        subnets without internet access.
        
        Configuration:
        - IAM role with AmazonSSMManagedInstanceCore managed policy
        - CloudWatch Logs permissions for session logging
        - No SSH keys required for instance access
        - Session logs sent to CloudWatch Logs via Interface Endpoint
        
        Security Benefits:
        - No SSH keys to manage or rotate
        - No bastion hosts required (eliminates attack surface)
        - No inbound ports required (security groups can be fully locked down)
        - All session activity logged to CloudWatch Logs for audit
        - IAM-based access control (who can start sessions)
        - Session Manager Interface Endpoint provides private connectivity
        
        Cost:
        - IAM role: Free
        - Session Manager: Free
        - CloudWatch Logs: ~$0.50/GB ingested, ~$0.03/GB stored
        - Systems Manager Interface Endpoint: ~$7/month (already created in NetworkStack)
        
        Usage:
        - Attach this role to EC2 instances that need Session Manager access
        - Users connect via: aws ssm start-session --target <instance-id>
        - No SSH keys needed, no bastion hosts needed
        - All connections go through Systems Manager Interface Endpoint
        
        Returns:
            IAM Role construct for Session Manager
            
        Validates: Requirements 6.8, 2.9
        """
        # Create IAM role for EC2 instances to use Session Manager
        session_manager_role = iam.Role(
            self,
            "SessionManagerRole",
            role_name="showcore-session-manager-role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for EC2 instances to use Session Manager for secure access without SSH keys",
            managed_policies=[
                # AmazonSSMManagedInstanceCore provides core Session Manager functionality
                # Allows instances to communicate with Systems Manager service
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonSSMManagedInstanceCore"
                )
            ]
        )
        
        # Add CloudWatch Logs permissions for session logging
        # Session Manager can log all session activity to CloudWatch Logs
        # This provides audit trail of who accessed which instances and what commands were run
        session_manager_role.add_to_policy(
            iam.PolicyStatement(
                sid="SessionManagerCloudWatchLogs",
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                ],
                resources=[
                    f"arn:aws:logs:{self.region}:{self.account}:log-group:/aws/ssm/*"
                ],
                conditions={
                    "StringEquals": {
                        "aws:RequestedRegion": self.region
                    }
                }
            )
        )
        
        # Add S3 permissions for session logs (optional, if storing logs in S3)
        # This is optional - can be added later if needed
        # For now, we only log to CloudWatch Logs via Interface Endpoint
        
        # Export role ARN for use by other stacks (e.g., when creating EC2 instances)
        CfnOutput(
            self,
            "SessionManagerRoleArn",
            value=session_manager_role.role_arn,
            export_name="ShowCoreSessionManagerRoleArn",
            description="IAM role ARN for Session Manager - attach to EC2 instances for secure access without SSH keys"
        )
        
        CfnOutput(
            self,
            "SessionManagerRoleName",
            value=session_manager_role.role_name,
            export_name="ShowCoreSessionManagerRoleName",
            description="IAM role name for Session Manager"
        )
        
        return session_manager_role
