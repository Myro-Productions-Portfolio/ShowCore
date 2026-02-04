"""
ShowCore Storage Stack

This module defines the S3 storage infrastructure for ShowCore Phase 1.
It creates S3 buckets for static assets and backups with appropriate
security, encryption, and lifecycle policies.

Cost Optimization:
- Uses S3 SSE-S3 encryption (AWS managed keys) instead of KMS to avoid key management costs
- Configures lifecycle policies to delete old versions after 90 days
- Prevents public access (CloudFront only via OAC)
- No cross-region replication initially (can add later if needed)

Security:
- Encryption at rest using SSE-S3 (AWS managed keys with automatic rotation)
- Versioning enabled for data protection and recovery
- Block all public access (CloudFront access via Origin Access Control)
- Bucket policies enforce least privilege access

Resources:
- S3 Bucket: Static Assets (showcore-static-assets-{account-id})
  - Versioning enabled
  - SSE-S3 encryption
  - Lifecycle policy: delete old versions after 90 days
  - Block public access (CloudFront only via OAC)
- S3 Bucket: Backups (showcore-backups-{account-id})
  - Versioning enabled
  - SSE-S3 encryption
  - Private access only (IAM only)
  - Block all public access

Dependencies: Network Stack (for VPC context)

Validates: Requirements 5.1, 5.2, 5.3, 5.4, 9.9
"""

from typing import Optional
from aws_cdk import (
    Duration,
    RemovalPolicy,
    aws_s3 as s3,
)
from constructs import Construct
from .base_stack import ShowCoreBaseStack


class ShowCoreStorageStack(ShowCoreBaseStack):
    """
    Storage infrastructure stack for ShowCore Phase 1.
    
    Creates S3 buckets for static assets and backups with appropriate
    security, encryption, and lifecycle policies.
    
    Cost Optimization:
    - S3 SSE-S3 encryption (free) instead of KMS ($1/key/month)
    - Lifecycle policies to delete old versions after 90 days
    - No cross-region replication initially
    
    Security:
    - Encryption at rest using SSE-S3
    - Versioning enabled for data protection
    - Block all public access (CloudFront only via OAC)
    - Bucket policies enforce least privilege
    
    Resources Created:
    - S3 Bucket for static assets (showcore-static-assets-{account-id})
    - S3 Bucket for backups (showcore-backups-{account-id})
    
    Attributes:
        static_assets_bucket: S3 bucket for static frontend assets
        backups_bucket: S3 bucket for application backups
    
    Validates: Requirements 5.1, 5.2, 5.3, 5.4, 9.9
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment: Optional[str] = None,
        **kwargs
    ) -> None:
        """
        Initialize the storage stack.
        
        Args:
            scope: CDK app or parent construct
            construct_id: Unique identifier for this stack
            environment: Environment name (production, staging, development)
            **kwargs: Additional stack properties
        """
        super().__init__(
            scope,
            construct_id,
            component="Storage",
            environment=environment,
            **kwargs
        )
        
        # Create S3 bucket for static assets
        self.static_assets_bucket = self._create_static_assets_bucket()
        
        # Create S3 bucket for backups
        self.backups_bucket = self._create_backups_bucket()
    
    def _create_static_assets_bucket(self) -> s3.Bucket:
        """
        Create S3 bucket for static frontend assets.
        
        Configuration:
        - Versioning enabled for data protection and recovery
        - SSE-S3 encryption at rest (AWS managed keys, not KMS for cost optimization)
        - Block all public access (CloudFront only via Origin Access Control)
        - Lifecycle policy to delete old versions after 90 days
        - Bucket name: showcore-static-assets-{account-id}
        
        Cost Optimization:
        - SSE-S3 encryption is FREE (KMS would cost $1/key/month)
        - Lifecycle policy reduces storage costs by deleting old versions
        - No cross-region replication (can add later if needed)
        
        Security:
        - Encryption at rest using AWS managed keys (automatic rotation)
        - Versioning provides data protection and recovery capability
        - Block public access prevents unauthorized access
        - CloudFront access via Origin Access Control (OAC) only
        
        Returns:
            S3 bucket for static assets
            
        Validates: Requirements 5.1, 5.3, 5.4, 9.9
        """
        # Get account ID for bucket name uniqueness
        account_id = self.account
        
        # Generate bucket name following naming convention
        # Format: showcore-static-assets-{account-id}
        bucket_name = f"showcore-static-assets-{account_id}"
        
        # Create S3 bucket with versioning and encryption
        bucket = s3.Bucket(
            self,
            "StaticAssetsBucket",
            bucket_name=bucket_name,
            # Versioning enabled for data protection and recovery (Requirement 5.1)
            versioned=True,
            # SSE-S3 encryption at rest using AWS managed keys (Requirement 5.3, 9.9)
            # This is FREE - KMS would cost $1/key/month
            encryption=s3.BucketEncryption.S3_MANAGED,
            # Block all public access - CloudFront only via OAC (Requirement 5.4)
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            # Enforce SSL/TLS for all requests
            enforce_ssl=True,
            # Retain bucket on stack deletion (data protection)
            removal_policy=RemovalPolicy.RETAIN,
            # Lifecycle rules to manage storage costs
            lifecycle_rules=[
                # Delete old versions after 90 days to reduce storage costs
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    enabled=True,
                    noncurrent_version_expiration=Duration.days(90),
                )
            ],
        )
        
        # Add custom tags for this bucket
        self.add_custom_tag("DataClassification", "Internal")
        self.add_custom_tag("BackupRequired", "false")  # Versioning provides protection
        
        return bucket

    
    def _create_backups_bucket(self) -> s3.Bucket:
        """
        Create S3 bucket for application backups.
        
        Configuration:
        - Versioning enabled for data protection and recovery
        - SSE-S3 encryption at rest (AWS managed keys, not KMS for cost optimization)
        - Block all public access (private access only via IAM)
        - Lifecycle policies for cost optimization
        - Bucket name: showcore-backups-{account-id}
        
        Cost Optimization:
        - SSE-S3 encryption is FREE (KMS would cost $1/key/month)
        - Transition to Glacier Flexible Retrieval after 30 days (Requirement 5.9)
        - Delete old backups after 90 days (short retention for cost optimization)
        - Delete old versions after 90 days (Requirement 9.10)
        - No cross-region replication (can add later if needed)
        
        Security:
        - Encryption at rest using AWS managed keys (automatic rotation)
        - Versioning provides data protection and recovery capability
        - Block all public access - IAM only access
        - Bucket policy enforces private access only
        
        Returns:
            S3 bucket for backups
            
        Validates: Requirements 5.2, 5.3, 5.9, 9.9, 9.10
        """
        # Get account ID for bucket name uniqueness
        account_id = self.account
        
        # Generate bucket name following naming convention
        # Format: showcore-backups-{account-id}
        bucket_name = f"showcore-backups-{account_id}"
        
        # Create S3 bucket with versioning, encryption, and lifecycle policies
        bucket = s3.Bucket(
            self,
            "BackupsBucket",
            bucket_name=bucket_name,
            # Versioning enabled for data protection and recovery (Requirement 5.2)
            versioned=True,
            # SSE-S3 encryption at rest using AWS managed keys (Requirement 5.3, 9.9)
            # This is FREE - KMS would cost $1/key/month
            encryption=s3.BucketEncryption.S3_MANAGED,
            # Block all public access - private access only via IAM (Requirement 5.2)
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            # Enforce SSL/TLS for all requests
            enforce_ssl=True,
            # Retain bucket on stack deletion (data protection for backups)
            removal_policy=RemovalPolicy.RETAIN,
            # Lifecycle rules for cost optimization (Requirements 5.9, 9.10)
            lifecycle_rules=[
                # Transition current version backups to Glacier Flexible Retrieval after 30 days
                # This significantly reduces storage costs while maintaining data availability
                s3.LifecycleRule(
                    id="TransitionToGlacier",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(30),
                        )
                    ],
                ),
                # Delete old backups after 90 days (short retention for cost optimization)
                # This balances data retention with cost for a low-traffic project
                s3.LifecycleRule(
                    id="DeleteOldBackups",
                    enabled=True,
                    expiration=Duration.days(90),
                ),
                # Delete old versions after 90 days to reduce storage costs
                # Versioning provides protection, but old versions consume storage
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    enabled=True,
                    noncurrent_version_expiration=Duration.days(90),
                ),
            ],
        )
        
        # Add custom tags for this bucket
        self.add_custom_tag("DataClassification", "Internal")
        self.add_custom_tag("BackupRequired", "true")  # This IS the backup bucket
        
        return bucket
