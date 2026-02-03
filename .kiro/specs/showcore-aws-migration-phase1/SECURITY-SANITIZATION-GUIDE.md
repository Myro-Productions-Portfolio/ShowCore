# Security Sanitization Guide for Public GitHub Repository

## Overview

ShowCore is a **PUBLIC** portfolio repository on GitHub. This guide ensures sensitive information is never committed to the public repo. The `sensitive-data-check` hook will scan files before commits, but manual review is still required.

## Critical: What MUST Be Sanitized

### 1. AWS Account IDs

**Real Account ID**: `498618930321`

**Sanitized Versions**:
- Documentation: `123456789012` (standard AWS example account)
- Code comments: `<AWS_ACCOUNT_ID>` or `${AWS_ACCOUNT_ID}`
- CDK code: Use context variables or environment variables

**Where to check**:
- ADRs and documentation
- CDK code (`cdk.json`, stack definitions)
- CloudFormation templates
- README files
- Architecture diagrams

**Example sanitization**:
```python
# ❌ BAD - Real account ID
account = "498618930321"

# ✅ GOOD - Use context or environment variable
account = self.node.try_get_context("account") or os.environ.get("AWS_ACCOUNT_ID")

# ✅ GOOD - Documentation placeholder
# Deploy to AWS account 123456789012
```

### 2. Email Addresses

**Real Emails**: Any personal or organizational email addresses

**Sanitized Versions**:
- `admin@example.com`
- `user@example.com`
- `devops@example.com`
- `oncall@example.com`
- `finance@example.com`

**Where to check**:
- SNS topic subscriptions in code
- Documentation examples
- CloudWatch alarm configurations
- IAM user examples
- Contact information

**Example sanitization**:
```python
# ❌ BAD - Real email
sns_topic.add_subscription(
    subscriptions.EmailSubscription("john.doe@mycompany.com")
)

# ✅ GOOD - Example domain
sns_topic.add_subscription(
    subscriptions.EmailSubscription("admin@example.com")
)
```

### 3. AWS Credentials (NEVER COMMIT)

**Never commit**:
- AWS Access Key IDs (starts with `AKIA`)
- AWS Secret Access Keys
- AWS Session Tokens
- IAM user passwords
- Database passwords
- API keys

**Where to check**:
- `.env` files (should be in `.gitignore`)
- Configuration files
- Code comments
- Documentation examples
- Test files

**Safe alternatives**:
```python
# ✅ GOOD - Use AWS Secrets Manager
secret = secretsmanager.Secret(self, "DBSecret")

# ✅ GOOD - Use environment variables
api_key = os.environ.get("API_KEY")

# ✅ GOOD - Documentation placeholder
# Set AWS_ACCESS_KEY_ID in your environment
```

### 4. Database Connection Strings

**Real Connection Info**: Actual RDS endpoints, usernames, passwords

**Sanitized Versions**:
- Endpoint: `showcore-db.cluster-xxxxx.us-east-1.rds.amazonaws.com`
- Username: `<DB_USERNAME>` or `admin`
- Password: `<DB_PASSWORD>` (never show real passwords)

**Where to check**:
- Connection examples in documentation
- Code comments
- Configuration files
- Test files

**Example sanitization**:
```python
# ❌ BAD - Real connection string
conn_string = "postgresql://admin:MySecretPass123@showcore-db.cluster-abc123.us-east-1.rds.amazonaws.com:5432/showcore"

# ✅ GOOD - Sanitized example
conn_string = "postgresql://<USERNAME>:<PASSWORD>@showcore-db.cluster-xxxxx.us-east-1.rds.amazonaws.com:5432/showcore"

# ✅ GOOD - Use Secrets Manager
credentials = rds.Credentials.from_secret(db_secret)
```

### 5. IP Addresses

**Public IPs**: Any real public IP addresses

**Safe IP Ranges** (OK to use):
- Private IPs: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
- Documentation IPs (RFC 5737): `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`
- Example: `192.0.2.1`

**Where to check**:
- Security group rules
- Network ACL rules
- Documentation examples
- Architecture diagrams

**Example sanitization**:
```python
# ✅ GOOD - Private IP ranges (safe for VPC)
vpc_cidr = "10.0.0.0/16"

# ✅ GOOD - Documentation IP
# Example: Allow access from 192.0.2.1

# ❌ BAD - Real public IP
# Allow access from 203.45.67.89 (your office)
```

### 6. Internal URLs and Hostnames

**Real Internal URLs**: Actual service URLs, internal DNS names

**Sanitized Versions**:
- `internal.example.com`
- `api.example.com`
- `service.internal.example.com`

**Where to check**:
- API endpoint documentation
- Service discovery examples
- Architecture diagrams
- Integration test examples

### 7. Personal Information

**Never commit**:
- Real names (use placeholder names like "John Doe", "Jane Smith")
- Phone numbers
- Physical addresses
- Social security numbers
- Credit card numbers

**Where to check**:
- Test data
- Example user profiles
- Documentation examples

## Pre-Commit Checklist

Before committing any file, verify:

- [ ] No AWS account IDs (use `123456789012` or context variables)
- [ ] No real email addresses (use `*@example.com`)
- [ ] No AWS credentials (Access Keys, Secret Keys, Tokens)
- [ ] No database passwords or connection strings with credentials
- [ ] No real public IP addresses (use RFC 5737 documentation IPs)
- [ ] No internal URLs or hostnames (use `*.example.com`)
- [ ] No personal information (names, phones, addresses)
- [ ] No API keys or tokens
- [ ] `.env` files are in `.gitignore`
- [ ] Secrets are managed via AWS Secrets Manager or environment variables

## Git Commands for Review

Always review changes before pushing:

```bash
# Review all changes before committing
git diff

# Review staged changes
git diff --staged

# Review specific file
git diff path/to/file

# Search for potential account IDs (12-digit numbers)
git diff | grep -E '[0-9]{12}'

# Search for potential email addresses
git diff | grep -E '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'

# Search for potential AWS keys
git diff | grep -E 'AKIA[0-9A-Z]{16}'
```

## Automated Hook

The `sensitive-data-check` hook will automatically scan edited files for:
- AWS account IDs (12-digit numbers)
- Email addresses
- AWS credentials patterns
- Database connection strings
- IP addresses
- Common secret patterns

**The hook is a safety net, not a replacement for manual review.**

## What's Safe to Commit

These are **SAFE** to commit to the public repository:

✅ **Architecture documentation** (with sanitized examples)
✅ **ADRs** (with sanitized account IDs and emails)
✅ **Requirements and design documents** (with placeholders)
✅ **CDK code** (using context variables and Secrets Manager)
✅ **Test code** (with mock data and example.com emails)
✅ **Infrastructure diagrams** (with sanitized labels)
✅ **README files** (with example configurations)
✅ **Steering documents** (best practices and standards)
✅ **Private IP ranges** (10.x.x.x, 172.16.x.x, 192.168.x.x)
✅ **AWS service names and regions** (us-east-1, RDS, etc.)
✅ **Resource naming patterns** (showcore-*, etc.)

## What's NEVER Safe to Commit

❌ **AWS credentials** (Access Keys, Secret Keys, Session Tokens)
❌ **Real AWS account IDs** (use 123456789012)
❌ **Real email addresses** (use @example.com)
❌ **Database passwords** (use Secrets Manager)
❌ **API keys and tokens** (use environment variables)
❌ **Real public IP addresses** (use RFC 5737 documentation IPs)
❌ **Internal URLs** (use *.example.com)
❌ **Personal information** (names, phones, addresses)
❌ **SSH private keys** (never commit .pem, .key files)
❌ **SSL certificates** (never commit .p12, .pfx files)

## If You Accidentally Commit Sensitive Data

If sensitive data is committed but **NOT YET PUSHED**:

```bash
# Undo the last commit (keep changes)
git reset --soft HEAD~1

# Sanitize the files
# ... make changes ...

# Commit again with sanitized data
git add .
git commit -m "Add sanitized documentation"
```

If sensitive data is **ALREADY PUSHED** to GitHub:

1. **Immediately rotate credentials** (AWS keys, passwords, API keys)
2. **Remove from Git history** using `git filter-branch` or BFG Repo-Cleaner
3. **Force push** to overwrite history (⚠️ dangerous, coordinate with team)
4. **Consider the data compromised** and take appropriate security measures

**Prevention is better than remediation. Always review before pushing.**

## Sanitization Examples

### Example 1: ADR with Account ID

```markdown
❌ BAD:
Deploy to AWS account 498618930321 in us-east-1 region.

✅ GOOD:
Deploy to AWS account 123456789012 in us-east-1 region.
```

### Example 2: CDK Code with Account

```python
❌ BAD:
env = cdk.Environment(account="498618930321", region="us-east-1")

✅ GOOD:
env = cdk.Environment(
    account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
    region=os.environ.get("CDK_DEFAULT_REGION")
)
```

### Example 3: SNS Topic Subscription

```python
❌ BAD:
topic.add_subscription(EmailSubscription("john@mycompany.com"))

✅ GOOD:
topic.add_subscription(EmailSubscription("admin@example.com"))
# Or better: use environment variable
topic.add_subscription(EmailSubscription(os.environ.get("ALERT_EMAIL")))
```

### Example 4: Database Connection

```python
❌ BAD:
# Connect to: showcore-db.cluster-abc123xyz.us-east-1.rds.amazonaws.com
# Username: admin, Password: MySecretPass123

✅ GOOD:
# Connect to: showcore-db.cluster-xxxxx.us-east-1.rds.amazonaws.com
# Credentials stored in AWS Secrets Manager
```

## Additional Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [AWS: Best practices for managing AWS access keys](https://docs.aws.amazon.com/general/latest/gr/aws-access-keys-best-practices.html)
- [OWASP: Sensitive Data Exposure](https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure)

## Summary

**Remember**: This is a **PUBLIC** portfolio repository. When in doubt, sanitize. It's better to be overly cautious than to expose sensitive information.

The `sensitive-data-check` hook will help catch issues, but **you are the final line of defense**. Always review your diffs before committing and pushing to GitHub.

---

**Last Updated**: February 3, 2026
**Maintained By**: ShowCore Project
**Review Before Every Commit**: Yes
