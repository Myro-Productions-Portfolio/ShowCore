# ADR-003: Public Repository Security and Data Sanitization

## Status
Accepted - February 3, 2026

## Context

ShowCore is a portfolio project intended to demonstrate AWS Solutions Architect skills to potential employers and the broader community. The repository needs to be public on GitHub to serve as a portfolio piece, but it contains infrastructure code and documentation that references real AWS resources.

Current situation:
- Repository contains AWS account IDs, IAM ARNs, and other account-specific information
- Documentation includes email addresses and contact information
- Infrastructure code will contain resource configurations and networking details
- ADRs and design documents reference actual AWS account numbers
- This is a learning project meant to be shared publicly

The challenge: How to maintain a public portfolio repository while protecting sensitive information and following security best practices?

## Decision

Implement comprehensive data sanitization for all public commits, using automated hooks and documentation to prevent sensitive data leaks.

Implementation approach:
- Replace all real AWS account IDs with standard placeholder `123456789012`
- Replace all real email addresses with `*@example.com` domain
- Create automated hook to scan files before commits
- Maintain security sanitization guide for reference
- Use environment variables and AWS Secrets Manager for actual deployments
- Enhanced `.gitignore` to exclude sensitive file types

## Alternatives Considered

### Option 1: Private Repository

Keep the repository private and only share with specific employers upon request.

Advantages:
- No risk of sensitive data exposure
- Can use real account IDs and emails in documentation
- Simpler workflow (no sanitization needed)
- No need for automated scanning

Disadvantages:
- Defeats the purpose of a public portfolio
- Employers can't easily discover the work
- Can't contribute to community learning
- Limits visibility for networking and job opportunities
- GitHub profile shows less activity

Impact: Not suitable for portfolio goals

### Option 2: Sanitize Manually (No Automation)

Manually review and sanitize files before each commit without automated tools.

Advantages:
- No additional tooling needed
- Full manual control
- Simple approach

Disadvantages:
- High risk of human error
- Easy to forget to sanitize
- No safety net for mistakes
- Time-consuming manual reviews
- Inconsistent sanitization patterns

Impact: Too risky for public repository

### Option 3: Automated Sanitization with Hooks (Selected)

Use Kiro hooks to automatically scan files for sensitive data before commits, combined with comprehensive documentation.

Advantages:
- Automated safety net catches mistakes
- Consistent sanitization patterns
- Documentation provides clear guidelines
- Hook triggers on every file edit
- Reduces cognitive load (don't have to remember)
- Can still manually review with `git diff`

Disadvantages:
- Requires initial setup time
- Hook might have false positives
- Still need manual review as final check
- Adds slight friction to workflow

Impact: Best balance of security and usability

### Option 4: Separate Public/Private Repositories

Maintain two repositories - private for actual work, public for sanitized showcase.

Advantages:
- Complete separation of concerns
- No risk of accidental exposure
- Can work freely in private repo

Disadvantages:
- Double maintenance burden
- Easy for repos to drift out of sync
- More complex workflow
- Commit history doesn't match
- Defeats "living portfolio" concept

Impact: Too much overhead for solo project

## Rationale

The decision came down to three main factors:

**Portfolio visibility**: The primary goal is demonstrating AWS skills to employers and the community. A public repository is essential for this. Employers want to see real work, decision-making processes (ADRs), and documentation quality. Private repositories don't serve this purpose.

**Security best practices**: Even though this is a learning project, it's important to demonstrate security awareness. Sanitizing sensitive data shows understanding of security principles. The automated hook demonstrates knowledge of DevSecOps practices. This is actually a portfolio strength - showing security-conscious development.

**Practical workflow**: The automated hook provides a safety net without being overly burdensome. It catches mistakes while still allowing normal development flow. The documentation provides clear guidelines for what to sanitize and why. This is sustainable for a solo developer.

Trade-offs I'm accepting:

**Slight workflow friction**: The hook adds a small delay when editing files. Need to review warnings and potentially sanitize data. This is acceptable because it prevents much bigger problems (exposed credentials, account takeover).

**Not foolproof**: The hook can't catch everything. Still need manual review with `git diff` before pushing. This is acceptable because it's a reasonable safety measure, not a guarantee.

**Documentation overhead**: Created security sanitization guide and updated `.gitignore`. This is one-time setup cost with ongoing benefits.

**Placeholder data in docs**: Using `123456789012` instead of real account ID makes documentation slightly less "real". This is acceptable because the architecture and decisions are what matter, not the specific account number.

## Consequences

### What we gain

**Public portfolio**: Repository is safe to share publicly. Employers and community can see the work. GitHub profile shows active development. Can reference in resume and LinkedIn.

**Security demonstration**: Shows security awareness and best practices. Demonstrates understanding of data sanitization. Shows knowledge of DevSecOps automation. This is actually a portfolio strength.

**Automated protection**: Hook catches sensitive data before commits. Reduces risk of human error. Provides consistent sanitization patterns. Peace of mind when committing.

**Clear guidelines**: Security sanitization guide provides reference. `.gitignore` excludes sensitive file types. Patterns are documented and reusable.

**Real-world practice**: Mirrors enterprise security practices. Good habit formation for professional work. Demonstrates mature development practices.

### What we lose

**Slight workflow friction**: Need to review hook warnings. Need to sanitize data when found. Need to use environment variables for deployments.

**Not completely foolproof**: Hook might miss some patterns. Still need manual review. False sense of security if relied on exclusively.

**Documentation maintenance**: Need to keep sanitization guide updated. Need to remember patterns when writing new docs.

**Less "authentic" documentation**: Using placeholder account IDs. Can't show actual resource ARNs. Slightly less realistic examples.

### How I'm handling the downsides

**Workflow friction**: The hook is fast and non-blocking. Warnings are clear and actionable. Manual review with `git diff` is quick. This is a reasonable trade-off for security.

**Not foolproof**: Documentation emphasizes that hook is a safety net, not a guarantee. Always review diffs before pushing. Use `git diff | grep` commands to double-check.

**Maintenance**: Security guide is comprehensive and shouldn't need frequent updates. Patterns are simple and memorable (123456789012, @example.com).

**Placeholder data**: The architecture and decision-making are what matter for portfolio. Employers understand sanitization is necessary. Can explain real setup in interviews.

## Implementation

### Automated Hook

**Hook name**: `sensitive-data-check`
**Location**: `.kiro/hooks/sensitive-data-check.kiro.hook`
**Trigger**: File edits to code and documentation files
**Action**: Scans for sensitive patterns and warns user

**Patterns detected**:
- AWS Account IDs (12-digit numbers)
- Email addresses
- AWS credentials (AKIA*, secret keys)
- Database credentials
- IP addresses (public)
- API keys and tokens

### Sanitization Patterns

**AWS Account ID**:
- Real: `498618930321`
- Sanitized: `123456789012`
- In code: Use environment variables or CDK context

**Email Addresses**:
- Real: `user@domain.com`
- Sanitized: `admin@example.com`, `user@example.com`
- In code: Use environment variables

**Database Endpoints**:
- Real: `showcore-db.cluster-abc123xyz.us-east-1.rds.amazonaws.com`
- Sanitized: `showcore-db.cluster-xxxxx.us-east-1.rds.amazonaws.com`

**IP Addresses**:
- Private IPs: OK to use (10.x.x.x, 172.16.x.x, 192.168.x.x)
- Public IPs: Use RFC 5737 documentation IPs (192.0.2.x)

### Enhanced .gitignore

Added exclusions for:
- Environment files (`.env`, `.env.*`)
- AWS credentials files
- Secrets and keys (`.pem`, `.key`, `*.secret`)
- Terraform state files (may contain sensitive data)
- CDK context files (may contain account-specific data)

### Documentation

**SECURITY-SANITIZATION-GUIDE.md**:
- Comprehensive guide on what to sanitize and why
- Examples of safe vs unsafe patterns
- Pre-commit checklist
- Git commands for manual review
- What to do if sensitive data is committed

### Files Sanitized

Initial sanitization completed for:
- `tasks.md` - Replaced account ID
- `design.md` - Replaced account ID
- `iac-standards.md` - Replaced account ID
- `AWS_SETUP_SUMMARY.md` - Replaced account ID and ARNs
- `README.md` - Replaced email addresses, added security notice

### Deployment Approach

For actual infrastructure deployment:
```bash
# Set environment variables (not committed)
export AWS_ACCOUNT_ID="498618930321"
export CDK_DEFAULT_ACCOUNT="498618930321"
export ALERT_EMAIL="real-email@domain.com"
```

In CDK code:
```python
# Use environment variables
account = os.environ.get("CDK_DEFAULT_ACCOUNT")
email = os.environ.get("ALERT_EMAIL")

# Or use CDK context
account = self.node.try_get_context("account")
```

## When to revisit this

Should review this decision:
- If repository needs to become private (e.g., contains proprietary code)
- If automated scanning becomes too burdensome
- If better sanitization tools become available
- If moving to enterprise environment with different security requirements
- Quarterly - review for any sensitive data that slipped through

## References

- GitHub: Removing sensitive data - https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
- AWS: Best practices for managing AWS access keys - https://docs.aws.amazon.com/general/latest/gr/aws-access-keys-best-practices.html
- OWASP: Sensitive Data Exposure - https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure
- Security sanitization guide: `SECURITY-SANITIZATION-GUIDE.md`

## Related decisions

- ADR-001: VPC Endpoints vs NAT Gateway - accepted
- ADR-002: AWS CDK vs Terraform - accepted
- Future: ADR on secrets management strategy (Secrets Manager vs Parameter Store)
