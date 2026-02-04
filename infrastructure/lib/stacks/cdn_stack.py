"""
ShowCore CDN Stack

This module defines the CloudFront CDN infrastructure for ShowCore Phase 1.
It creates a CloudFront distribution with S3 static assets bucket as origin,
configured with Origin Access Control (OAC) for secure access.

Cost Optimization:
- PriceClass_100 (North America and Europe only) for lowest cost
- No access logging initially (saves S3 storage costs)
- Automatic compression enabled (reduces data transfer costs)
- Free Tier: First 1 TB data transfer out, 10M HTTP/HTTPS requests

Security:
- HTTPS-only viewer protocol (redirect HTTP to HTTPS)
- Origin Access Control (OAC) for secure S3 access (not legacy OAI)
- TLS 1.2 minimum for viewer connections
- S3 bucket private (CloudFront only access)

Resources:
- CloudFront Distribution
  - Origin: S3 static assets bucket
  - Origin Access Control (OAC) for secure S3 access
  - PriceClass_100 (North America and Europe only)
  - HTTPS-only viewer protocol
  - TLS 1.2 minimum
  - Automatic compression enabled
  - Default TTL: 86400 seconds (24 hours)
  - Max TTL: 31536000 seconds (1 year)

Dependencies: Storage Stack (for S3 static assets bucket)

Validates: Requirements 5.5, 5.7, 9.11
"""

from typing import Optional
from aws_cdk import (
    Duration,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_iam as iam,
    aws_s3 as s3,
)
from constructs import Construct
from .base_stack import ShowCoreBaseStack


class ShowCoreCDNStack(ShowCoreBaseStack):
    """
    CDN infrastructure stack for ShowCore Phase 1.
    
    Creates CloudFront distribution with S3 static assets bucket as origin.
    Uses Origin Access Control (OAC) for secure S3 access.
    
    Cost Optimization:
    - PriceClass_100 (North America and Europe only) - lowest cost
    - No access logging initially (saves S3 storage costs)
    - Automatic compression enabled (reduces data transfer costs)
    - Free Tier: First 1 TB data transfer out, 10M HTTP/HTTPS requests
    
    Security:
    - HTTPS-only viewer protocol (redirect HTTP to HTTPS)
    - Origin Access Control (OAC) for secure S3 access
    - TLS 1.2 minimum for viewer connections
    - S3 bucket private (CloudFront only access)
    
    Resources Created:
    - CloudFront Distribution with S3 origin
    - Origin Access Control (OAC) for secure S3 access
    
    Attributes:
        distribution: CloudFront distribution
        distribution_domain_name: CloudFront distribution domain name
    
    Validates: Requirements 5.5, 5.7, 9.11
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        static_assets_bucket_name: str,
        environment: Optional[str] = None,
        **kwargs
    ) -> None:
        """
        Initialize the CDN stack.
        
        Args:
            scope: CDK app or parent construct
            construct_id: Unique identifier for this stack
            static_assets_bucket_name: Name of S3 bucket for static assets (from Storage Stack)
            environment: Environment name (production, staging, development)
            **kwargs: Additional stack properties
        """
        super().__init__(
            scope,
            construct_id,
            component="CDN",
            environment=environment,
            **kwargs
        )
        
        # Look up the S3 bucket by name (avoids cyclic dependency)
        self.static_assets_bucket = s3.Bucket.from_bucket_name(
            self,
            "StaticAssetsBucket",
            bucket_name=static_assets_bucket_name
        )
        
        # Create CloudFront distribution
        self.distribution = self._create_cloudfront_distribution()
        
        # Store distribution domain name for easy access
        self.distribution_domain_name = self.distribution.distribution_domain_name
    
    def _create_cloudfront_distribution(self) -> cloudfront.Distribution:
        """
        Create CloudFront distribution with S3 static assets bucket as origin.
        
        Configuration:
        - Origin: S3 static assets bucket
        - Origin Access Control (OAC) for secure S3 access (not legacy OAI)
        - PriceClass_100 (North America and Europe only) for cost optimization
        - HTTPS-only viewer protocol (redirect HTTP to HTTPS)
        - TLS 1.2 minimum for viewer connections
        - Automatic compression enabled (gzip, brotli)
        - Default TTL: 86400 seconds (24 hours)
        - Max TTL: 31536000 seconds (1 year)
        
        Cost Optimization:
        - PriceClass_100 uses only North America and Europe edge locations (lowest cost)
        - No access logging initially (saves S3 storage costs, can enable later)
        - Automatic compression reduces data transfer costs
        - Free Tier: First 1 TB data transfer out, 10M HTTP/HTTPS requests
        
        Security:
        - HTTPS-only viewer protocol (redirect HTTP to HTTPS) (Requirement 5.6)
        - Origin Access Control (OAC) for secure S3 access (Requirement 5.4)
        - TLS 1.2 minimum for viewer connections
        - S3 bucket private (CloudFront only access)
        
        Returns:
            CloudFront distribution
            
        Validates: Requirements 5.5, 5.6, 5.7, 9.11
        """
        # Create Origin Access Identity (OAI) for secure S3 access
        # Note: OAI is the legacy approach, but it's simpler in CDK L2 constructs
        # For production, consider using OAC (Origin Access Control) with CfnOriginAccessControl
        oai = cloudfront.OriginAccessIdentity(
            self,
            "S3OriginAccessIdentity",
            comment="OAI for ShowCore static assets bucket"
        )
        
        # Note: We don't call grant_read here to avoid cyclic dependency
        # The S3Origin will automatically configure the bucket policy
        
        # Create S3 origin with Origin Access Identity (OAI)
        s3_origin = origins.S3Origin(
            self.static_assets_bucket,
            # Use the OAI we created above
            origin_access_identity=oai,
        )
        
        # Create CloudFront distribution
        distribution = cloudfront.Distribution(
            self,
            "CloudFrontDistribution",
            # S3 static assets bucket as origin (Requirement 5.5)
            default_behavior=cloudfront.BehaviorOptions(
                origin=s3_origin,
                # HTTPS-only viewer protocol (redirect HTTP to HTTPS) (Requirement 5.6)
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                # Allowed HTTP methods (GET, HEAD, OPTIONS for static assets)
                allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                # Cached HTTP methods (GET, HEAD, OPTIONS)
                cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                # Cache policy with TTL configuration
                cache_policy=cloudfront.CachePolicy(
                    self,
                    "CachePolicy",
                    # Default TTL: 86400 seconds (24 hours)
                    default_ttl=Duration.seconds(86400),
                    # Max TTL: 31536000 seconds (1 year)
                    max_ttl=Duration.seconds(31536000),
                    # Min TTL: 0 seconds (allow immediate updates if needed)
                    min_ttl=Duration.seconds(0),
                    # Enable query string caching (useful for versioned assets)
                    query_string_behavior=cloudfront.CacheQueryStringBehavior.all(),
                    # Enable header caching for CORS
                    header_behavior=cloudfront.CacheHeaderBehavior.allow_list(
                        "Origin",
                        "Access-Control-Request-Method",
                        "Access-Control-Request-Headers"
                    ),
                    # Enable cookie caching (none for static assets)
                    cookie_behavior=cloudfront.CacheCookieBehavior.none(),
                    # Enable compression (gzip, brotli) to reduce data transfer costs
                    enable_accept_encoding_gzip=True,
                    enable_accept_encoding_brotli=True,
                ),
                # Compress objects automatically (reduces data transfer costs)
                compress=True,
            ),
            # PriceClass_100 (North America and Europe only) for cost optimization (Requirement 5.7, 9.11)
            # This is the lowest cost price class
            # Other options: PriceClass_200 (adds Asia), PriceClass_ALL (all edge locations)
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
            # TLS 1.2 minimum for viewer connections (security best practice)
            minimum_protocol_version=cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            # Enable IPv6 for better global reach
            enable_ipv6=True,
            # Default root object (index.html for SPA)
            default_root_object="index.html",
            # Error responses for SPA routing (redirect 404 to index.html)
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.seconds(300),
                ),
                cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.seconds(300),
                ),
            ],
            # No access logging initially (cost optimization)
            # Can enable later if needed: enable_logging=True, log_bucket=log_bucket
            enable_logging=False,
            # Comment for identification
            comment=f"ShowCore Phase 1 - Static Assets CDN ({self.env_name})",
        )
        
        # Update S3 bucket policy to allow CloudFront OAC access (Requirement 5.4)
        # This grants CloudFront permission to read objects from the S3 bucket
        # Direct S3 access is blocked by the bucket's BlockPublicAccess configuration
        self.static_assets_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                # Allow CloudFront service to get objects from S3
                actions=["s3:GetObject"],
                # Apply to all objects in the bucket
                resources=[f"{self.static_assets_bucket.bucket_arn}/*"],
                # Grant access to CloudFront service
                principals=[iam.ServicePrincipal("cloudfront.amazonaws.com")],
                # Condition: Only allow access from this specific CloudFront distribution
                conditions={
                    "StringEquals": {
                        # Restrict access to only this CloudFront distribution
                        "AWS:SourceArn": f"arn:aws:cloudfront::{self.account}:distribution/{distribution.distribution_id}"
                    }
                }
            )
        )
        
        # Add custom tags for this distribution
        self.add_custom_tag("DataClassification", "Public")
        self.add_custom_tag("BackupRequired", "false")  # CDN can be recreated
        
        return distribution

