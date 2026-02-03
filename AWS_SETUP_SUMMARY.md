# AWS CLI & IAM Setup for ShowCore

## Summary
Successfully configured AWS CLI and created dedicated IAM credentials for the ShowCore project following AWS best practices.

## What Was Created

### 1. IAM User: `showcore-app`
- **Purpose**: Dedicated user for ShowCore application deployment and infrastructure management
- **User ARN**: `arn:aws:iam::498618930321:user/showcore-app`
- **Tags**: 
  - Project: ShowCore
  - Purpose: ApplicationDeployment

### 2. IAM Policy: `ShowCoreDeploymentPolicy`
- **Policy ARN**: `arn:aws:iam::498618930321:policy/ShowCoreDeploymentPolicy`
- **Permissions Include**:
  - VPC & Networking (subnets, security groups, NAT gateways)
  - RDS (PostgreSQL database management)
  - ElastiCache (Redis cluster management)
  - S3 (storage buckets with `showcore-*` prefix)
  - CloudFront (CDN distribution)
  - ECS/Fargate (container orchestration)
  - Application Load Balancer
  - Route 53 (DNS management)
  - ACM (SSL certificate management)
  - CloudWatch (monitoring and logging)
  - IAM (service role creation with `showcore-*` prefix)
  - ECR (container registry)

### 3. AWS CLI Profiles

#### Default Profile (Admin - "nic")
```bash
aws configure list
# Uses: AKIAXIGABCSI46LE3YFA
# User: nic (admin/architect)
```

#### ShowCore Profile (Application)
```bash
aws configure list --profile showcore
# Uses: AKIAXIGABCSIQBZHAXOR
# User: showcore-app (limited permissions)
```

## How to Use

### For ShowCore Development/Deployment
Always use the `showcore` profile:
```bash
# Example commands
aws s3 ls --profile showcore
aws ecs list-clusters --profile showcore
aws rds describe-db-instances --profile showcore
```

### For Administrative Tasks
Use the default profile (or specify `--profile default`):
```bash
# Example: Creating new IAM users, billing, etc.
aws iam list-users
aws ce get-cost-and-usage --time-period Start=2026-02-01,End=2026-02-03
```

### Setting Default Profile for a Session
```bash
# Temporarily use showcore profile for all commands
export AWS_PROFILE=showcore

# Verify
aws sts get-caller-identity
```

## MCP Configuration Updated

All AWS-related MCP servers in your Kiro Powers have been updated to use the `showcore` profile:

- ✅ `power-aws-infrastructure-as-code` → AWS_PROFILE: showcore
- ✅ `power-cloudwatch-application-signals` → AWS_PROFILE: showcore
- ✅ `power-ecs-express-power` → AWS_API_MCP_PROFILE_NAME: showcore
- ✅ `power-saas-builder-awslabs.dynamodb-mcp-server` → AWS_PROFILE: showcore
- ✅ `power-saas-builder-awslabs.aws-serverless-mcp` → AWS_PROFILE: showcore
- ✅ `power-cloud-architect-awsapi` → Uses showcore credentials

## Security Best Practices Implemented

1. ✅ **Separation of Duties**: Admin credentials (nic) separate from app credentials (showcore-app)
2. ✅ **Least Privilege**: ShowCore user only has permissions needed for the migration phases
3. ✅ **Resource Scoping**: S3 and IAM permissions limited to `showcore-*` resources
4. ✅ **Audit Trail**: Separate users allow tracking of who did what
5. ✅ **Credential Rotation**: Easy to rotate showcore-app keys without affecting admin access

## Next Steps

1. **Test Permissions**: Try creating a test S3 bucket with the showcore profile
   ```bash
   aws s3 mb s3://showcore-test-bucket --profile showcore
   ```

2. **Set Up Environment Variables**: Add to your `.env` file:
   ```bash
   AWS_PROFILE=showcore
   AWS_REGION=us-east-1
   ```

3. **Infrastructure as Code**: When you start using Terraform/CDK, configure them to use the showcore profile

4. **CI/CD**: Store the showcore-app access keys as secrets in GitHub Actions:
   - `AWS_ACCESS_KEY_ID`: AKIAXIGABCSIQBZHAXOR
   - `AWS_SECRET_ACCESS_KEY`: (stored securely)

## Credentials Location

- **AWS Config**: `~/.aws/config`
- **AWS Credentials**: `~/.aws/credentials`
- **MCP Config**: `~/.kiro/settings/mcp.json`
- **Backup**: `~/.kiro/settings/mcp.json.backup`

## Important Notes

- ⚠️ The original credentials CSV has been deleted for security
- ⚠️ Never commit AWS credentials to Git
- ⚠️ Consider using AWS SSO for production environments
- ⚠️ Set up MFA on the "nic" admin account for additional security
- ⚠️ Review CloudTrail logs periodically to monitor API usage

## Troubleshooting

### If MCP servers aren't connecting:
1. Restart Kiro to reload MCP configuration
2. Check MCP Server view in Kiro feature panel
3. Verify credentials: `aws sts get-caller-identity --profile showcore`

### If permissions are denied:
1. Check which user you're using: `aws sts get-caller-identity`
2. Verify the policy is attached: `aws iam list-attached-user-policies --user-name showcore-app`
3. Review CloudTrail for specific denied actions

---

**Created**: February 3, 2026  
**AWS Account**: 498618930321  
**Region**: us-east-1  
**Project**: ShowCore AWS Migration
