# ADR-011: CloudFront Distribution Configuration and Price Class Selection

**Status**: Accepted  
**Date**: February 4, 2026  
**Deciders**: ShowCore Engineering Team  
**Validates**: Requirements 5.5, 5.6, 5.7, 9.11

## Context

Phase 1 infrastructure requires a Content Delivery Network (CDN) to serve static frontend assets globally with low latency and high performance. CloudFront is AWS's CDN service that caches content at edge locations worldwide.

Current context:
- ShowCore is a low-traffic portfolio/learning project
- Static assets stored in S3 bucket (HTML, CSS, JavaScript, images)
- Target monthly cost under $60
- Expected traffic: < 100 GB/month data transfer
- Primary audience: North America (developer portfolio)
- Secondary audience: Europe (potential employers/clients)
- Minimal traffic from other regions

CloudFront pricing structure:
- **Price Class All**: 225+ edge locations worldwide
  - North America: $0.085/GB
  - Europe: $0.085/GB
  - Asia: $0.140/GB
  - South America: $0.250/GB
  - Australia: $0.140/GB
  - Africa/Middle East: $0.170/GB

- **Price Class 200**: North America, Europe, Asia, Middle East, Africa
  - Excludes: South America, Australia
  - Same per-GB pricing as Price Class All

- **Price Class 100**: North America and Europe only
  - Excludes: Asia, South America, Australia, Africa, Middle East
  - Same per-GB pricing as Price Class All
  - Lowest cost option

Key decisions needed:
1. Which CloudFront price class to use
2. Cache TTL configuration
3. HTTPS/TLS configuration
4. Compression settings
5. Origin Access Control (OAC) vs Origin Access Identity (OAI)

## Decision

**Use CloudFront Price Class 100 (North America and Europe only) with HTTPS-only, automatic compression, and Origin Access Control (OAC).**

Implementation:

**Price Class**: PriceClass_100 (North America and Europe)
**Cache TTL**: Default 24 hours, Max 1 year
**HTTPS**: HTTPS-only (redirect HTTP to HTTPS)
**TLS Version**: TLS 1.2 minimum
**Compression**: Automatic (gzip, brotli)
**Origin Access**: Origin Access Control (OAC)
**Logging**: Disabled initially (can enable later)
**Custom Domain**: Deferred to Phase 2

## Alternatives Considered

### Alternative 1: Price Class All (Global Coverage)

Use all 225+ CloudFront edge locations worldwide.

**Pros**:
- Best global performance
- Lowest latency for all users worldwide
- Best user experience for international visitors
- No geographic restrictions
- Follows AWS best practices

**Cons**:
- Higher cost for traffic from expensive regions
- Asia: $0.140/GB (65% more expensive)
- South America: $0.250/GB (194% more expensive)
- Australia: $0.140/GB (65% more expensive)
- Africa/Middle East: $0.170/GB (100% more expensive)
- Overkill for portfolio website with minimal international traffic
- Most traffic from North America/Europe anyway

**Monthly Cost**: ~$2-5 (if traffic from expensive regions)

**Decision**: Rejected. Not cost-effective for target audience.

### Alternative 2: Price Class 200 (Excludes South America and Australia)

Use edge locations in North America, Europe, Asia, Middle East, and Africa.

**Pros**:
- Good global coverage
- Includes Asia (potential employers in tech hubs)
- Includes Middle East and Africa
- Better than Price Class 100 for international visitors

**Cons**:
- Still includes expensive regions (Asia: $0.140/GB)
- Minimal traffic expected from Asia/Middle East/Africa
- Not significantly better than Price Class 100 for target audience
- Higher cost without clear benefit

**Monthly Cost**: ~$1.50-3 (if traffic from Asia)

**Decision**: Rejected. Not worth the additional cost.

### Alternative 3: Price Class 100 (Selected)

Use edge locations in North America and Europe only.

**Pros**:
- Lowest cost option
- Covers primary audience (North America)
- Covers secondary audience (Europe)
- Same per-GB pricing as other price classes ($0.085/GB)
- Sufficient for portfolio/learning project
- Users in other regions still served (from nearest edge location)

**Cons**:
- Higher latency for users in Asia, South America, Australia, Africa
- Not optimal for global audience
- Users in excluded regions served from Europe edge locations

**Monthly Cost**: ~$1-2 (for expected traffic)

**Decision**: Accepted. Best balance of cost and performance for target audience.

### Alternative 4: No CDN (S3 Direct)

Serve static assets directly from S3 without CloudFront.

**Pros**:
- Lowest cost (no CloudFront charges)
- Simplest architecture
- No CDN configuration needed

**Cons**:
- Higher latency (no edge caching)
- Higher S3 data transfer costs ($0.09/GB vs $0.085/GB)
- No automatic compression
- No HTTPS redirect
- No cache control
- Poor user experience
- Not learning CloudFront

**Monthly Cost**: ~$1-2 (similar to CloudFront)

**Decision**: Rejected. Poor user experience, misses learning opportunity.

## Rationale

The decision prioritizes cost optimization while maintaining good performance for the target audience.

### Cost Analysis

**Price Class 100** (selected):
- Data transfer: 100 GB × $0.085/GB = $8.50/month
- Requests: 1,000,000 × $0.0075/10,000 = $0.75/month
- Total: ~$9.25/month (if 100 GB traffic)
- First 1 TB free (Free Tier): $0/month for first 12 months
- After Free Tier: ~$1-2/month for expected traffic (10-20 GB)

**Price Class 200**:
- Same pricing if traffic only from North America/Europe
- Higher cost if traffic from Asia ($0.140/GB)
- Estimated: ~$1.50-3/month after Free Tier

**Price Class All**:
- Same pricing if traffic only from North America/Europe
- Much higher cost if traffic from South America ($0.250/GB)
- Estimated: ~$2-5/month after Free Tier

**Savings**: ~$0.50-3/month compared to higher price classes

### Performance Analysis

**Price Class 100 Performance**:
- North America: Excellent (< 50ms latency)
- Europe: Excellent (< 50ms latency)
- Asia: Good (100-200ms latency, served from Europe)
- South America: Fair (150-250ms latency, served from North America)
- Australia: Fair (200-300ms latency, served from Europe)

**Target Audience**:
- Primary: North America (developer portfolio) - Excellent performance
- Secondary: Europe (potential employers) - Excellent performance
- Tertiary: Other regions (minimal traffic) - Acceptable performance

**Verdict**: Price Class 100 provides excellent performance for 90%+ of expected traffic.

### Cache TTL Configuration

**Default TTL: 24 hours (86400 seconds)**
- Balances freshness with cache hit rate
- Static assets change infrequently
- Reduces origin requests to S3
- Improves performance and reduces costs

**Max TTL: 1 year (31536000 seconds)**
- For assets with cache-busting (e.g., `app.v123.js`)
- Maximizes cache hit rate
- Minimizes S3 requests
- Reduces data transfer costs

**Min TTL: 0 seconds**
- For dynamic content (future use)
- Allows immediate updates when needed

### HTTPS and TLS Configuration

**HTTPS-Only (Redirect HTTP to HTTPS)**:
- Security best practice
- Required for modern web applications
- Free with AWS Certificate Manager
- No additional cost

**TLS 1.2 Minimum**:
- Security best practice
- Disables older, insecure protocols (TLS 1.0, TLS 1.1)
- Supported by all modern browsers
- No compatibility issues for target audience

### Compression Configuration

**Automatic Compression (gzip, brotli)**:
- Reduces data transfer by 60-80%
- Improves page load times
- Free (no additional cost)
- Supported by all modern browsers
- Reduces CloudFront data transfer charges

**Example Savings**:
- Uncompressed: 100 KB HTML file
- Compressed: 20 KB (80% reduction)
- Data transfer savings: 80 KB × $0.085/GB = $0.0000068 per request
- For 100,000 requests: $0.68 savings

### Origin Access Control (OAC) vs Origin Access Identity (OAI)

**Origin Access Control (OAC)** (selected):
- Newer, recommended approach
- Better security (supports AWS Signature Version 4)
- Supports all S3 buckets (including SSE-KMS)
- Supports S3 bucket policies
- Future-proof

**Origin Access Identity (OAI)** (legacy):
- Older approach
- Being phased out by AWS
- Limited security (AWS Signature Version 2)
- Not recommended for new deployments

**Decision**: Use OAC for better security and future compatibility.

## Consequences

### Positive

1. **Cost Savings**: ~$0.50-3/month compared to higher price classes
2. **Excellent Performance**: < 50ms latency for North America and Europe (90%+ of traffic)
3. **Free Tier Benefits**: First 1 TB data transfer free for 12 months
4. **Automatic Compression**: 60-80% data transfer reduction
5. **HTTPS Security**: All traffic encrypted, HTTP redirected to HTTPS
6. **Cache Optimization**: 24-hour default TTL reduces origin requests
7. **S3 Security**: OAC prevents direct S3 access, CloudFront only

### Negative

1. **Higher Latency for Other Regions**: 100-300ms latency for Asia, South America, Australia, Africa
2. **Not Global**: Users in excluded regions served from distant edge locations
3. **Limited Logging**: Access logging disabled initially (can enable later for $0.01/10,000 requests)
4. **No Custom Domain**: Using CloudFront domain (d1234.cloudfront.net) initially

### Neutral

1. **Acceptable for Phase 1**: Target audience primarily in North America/Europe
2. **Learning Trade-off**: Focuses on cost optimization over global performance
3. **Upgrade Path**: Can change to Price Class 200 or All later if needed (no downtime)

## Implementation

### CDK Implementation

**CDN Stack** (`lib/stacks/cdn_stack.py`):

```python
from aws_cdk import (
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_s3 as s3,
    Duration,
)

# CloudFront Distribution
distribution = cloudfront.Distribution(
    self, "CloudFrontDistribution",
    default_behavior=cloudfront.BehaviorOptions(
        origin=origins.S3Origin(
            static_assets_bucket,
            origin_access_identity=None,  # Use OAC instead
        ),
        viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cache_policy=cloudfront.CachePolicy(
            self, "CachePolicy",
            default_ttl=Duration.hours(24),
            max_ttl=Duration.days(365),
            min_ttl=Duration.seconds(0),
        ),
        compress=True,  # Enable automatic compression
    ),
    price_class=cloudfront.PriceClass.PRICE_CLASS_100,  # North America and Europe only
    minimum_protocol_version=cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    enable_logging=False,  # Disable logging initially (cost optimization)
    comment="ShowCore Phase 1 CDN - Static Assets",
)

# Origin Access Control (OAC)
oac = cloudfront.CfnOriginAccessControl(
    self, "OAC",
    origin_access_control_config=cloudfront.CfnOriginAccessControl.OriginAccessControlConfigProperty(
        name="ShowCoreOAC",
        origin_access_control_origin_type="s3",
        signing_behavior="always",
        signing_protocol="sigv4",
    ),
)

# Update S3 bucket policy to allow CloudFront OAC access
static_assets_bucket.add_to_resource_policy(
    iam.PolicyStatement(
        actions=["s3:GetObject"],
        resources=[f"{static_assets_bucket.bucket_arn}/*"],
        principals=[iam.ServicePrincipal("cloudfront.amazonaws.com")],
        conditions={
            "StringEquals": {
                "AWS:SourceArn": f"arn:aws:cloudfront::{self.account}:distribution/{distribution.distribution_id}"
            }
        },
    )
)
```

### Verification

**Verify CloudFront Configuration**:
```bash
# Get distribution details
aws cloudfront get-distribution \
  --id E1234EXAMPLE \
  --query 'Distribution.DistributionConfig.PriceClass'
# Should return: "PriceClass_100"

# Verify HTTPS redirect
curl -I http://d1234example.cloudfront.net/index.html
# Should return: 301 or 302 redirect to HTTPS

# Verify compression
curl -H "Accept-Encoding: gzip" https://d1234example.cloudfront.net/index.html -I
# Should return: Content-Encoding: gzip

# Verify TLS version
openssl s_client -connect d1234example.cloudfront.net:443 -tls1_1
# Should fail (TLS 1.1 not supported)

openssl s_client -connect d1234example.cloudfront.net:443 -tls1_2
# Should succeed (TLS 1.2 supported)
```

**Monitor CloudFront Costs**:
```bash
# Check CloudFront metrics in CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name BytesDownloaded \
  --dimensions Name=DistributionId,Value=E1234EXAMPLE \
  --start-time 2026-01-01T00:00:00Z \
  --end-time 2026-02-01T00:00:00Z \
  --period 86400 \
  --statistics Sum
```

## When to Revisit This Decision

Should review this decision:

**After 3 Months** - Analyze CloudFront access logs (if enabled) to see geographic distribution of traffic. If significant traffic from Asia/South America, consider Price Class 200.

**If International Traffic Increases** - If > 10% of traffic from Asia/South America/Australia, upgrade to Price Class 200 or All.

**If Performance Complaints** - If users in excluded regions report slow load times, upgrade to higher price class.

**Before Production Launch** - If ShowCore becomes production service with global users, upgrade to Price Class All.

**If Custom Domain Needed** - Configure custom domain (cdn.showcore.com) with AWS Certificate Manager (free).

**If Logging Needed** - Enable CloudFront access logging for analytics ($0.01/10,000 requests + S3 storage).

**Quarterly Cost Review** - Check CloudFront costs in Cost Explorer. Verify costs stay under $2/month after Free Tier.

## References

- [CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)
- [CloudFront Price Classes](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PriceClass.html)
- [Origin Access Control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [CloudFront Compression](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/ServingCompressedFiles.html)
- ShowCore Requirements: 5.5, 5.6, 5.7, 9.11
- ShowCore Design: design.md (CDN Infrastructure)

## Related Decisions

- ADR-010: S3 Lifecycle Policies - CloudFront serves content from S3
- ADR-008: Encryption Key Management - S3 uses SSE-S3 encryption
- ADR-006: Single-AZ Deployment Strategy - Cost optimization philosophy

## Approval

- **Proposed By**: ShowCore Engineering Team
- **Reviewed By**: Cost Optimization Review, Performance Review
- **Approved By**: Project Lead
- **Date**: February 4, 2026

---

**Implementation Status**: ✅ Implemented in cdn_stack.py  
**Next Review**: After 3 months or when international traffic increases
