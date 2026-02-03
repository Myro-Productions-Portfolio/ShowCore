"""
ShowCore Security Stack

This stack creates:
- CloudTrail trail for audit logging across all regions
- S3 bucket for CloudTrail logs with versioning and encryption
- CloudTrail log file validation
- AWS Config for compliance monitoring (future)

Cost Optimization:
- CloudTrail: First trail is free, additional trails $2/month
- S3 storage for logs: ~$0.023/GB/month
- Log file validation: Free
- SSE-S3 encryption: Free (no KMS costs)

Security:
- CloudTrail logs all API calls for audit trail
- S3 bucket has versioning enabled
- S3 bucket uses SSE-S3 encryption
- Log file validation ensures integrity
- Bucket policy restricts access to CloudTrail service only

Dependencies: None (foundation stack for security)
"""

from aws_cdk import (
    Stack,
    Tags,
    RemovalPolicy,
    Duration,
    aws_s3 as s3,
    aws_cloudtrail as cloudtrail,
    aws_iam as iam,
    CfnOutput,
)
from constructs import Construct


class ShowCoreSecurityStack(Stack):
    """
    Security infrastructure stack for ShowCore Phase 1.
    
    Creates CloudTrail for audit logging and S3 bucket for log storage.
    
    Cost Optimization:
    - First CloudTrail trail is free
    - S3 storage costs ~$0.023/GB/month
    - SSE-S3 encryption is free (no KMS costs)
    - Log file validation is free
    
    Security:
    - CloudTrail logs all API calls across all regions
    - S3 bucket has versioning enabled for log integrity
    - S3 bucket uses SSE-S3 encryption at rest
    - Log file validation ensures logs haven't been tampered with
    - Bucket policy restricts access to CloudTrail service only
    
    Resources:
    - S3 Bucket: CloudTrail logs with versioning and encryption
    - CloudTrail Trail: Multi-region trail with log file validation
    
    Dependencies: None (foundation stack)
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Apply standard tags to all resources in this stack
        Tags.of(self).add("Project", "ShowCore")
        Tags.of(self).add("Phase", "Phase1")
        Tags.of(self).add("Environment", self.node.try_get_context("environment") or "production")
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("CostCenter", "Engineering")
        Tags.of(self).add("Component", "Security")
        
        # Create S3 bucket for CloudTrail logs
        self.cloudtrail_bucket = self._create_cloudtrail_bucket()
        
        # Create CloudTrail trail
        self.trail = self._create_cloudtrail_trail()
        
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
    
    def _create_cloudtrail_bucket(self) -> s3.Bucket:
        """
        Create S3 bucket for CloudTrail logs.
        
        Configuration:
        - Versioning enabled for log integrity
        - SSE-S3 encryption at rest (free, no KMS costs)
        - Block all public access
        - Lifecycle policy to transition old logs to Glacier after 90 days
        - Bucket policy allows CloudTrail service to write logs
        
        Returns:
            S3 Bucket construct for CloudTrail logs
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
                    id="TransitionOldLogsToGlacier",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                ),
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    enabled=True,
                    expiration=Duration.days(365)  # Delete logs after 1 year
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
