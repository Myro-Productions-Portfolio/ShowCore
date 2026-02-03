# ADR-002: AWS CDK vs Terraform for Infrastructure as Code

## Status
Accepted - February 3, 2026

## Context

Phase 1 infrastructure deployment requires an Infrastructure as Code (IaC) tool to define and manage AWS resources. All infrastructure must be version-controlled, testable, and reproducible across environments. Manual resource creation in the AWS Console is prohibited.

The project needs to deploy:
- VPC with public and private subnets across 2 availability zones
- VPC Endpoints (Gateway and Interface types)
- RDS PostgreSQL 16 instance (db.t3.micro)
- ElastiCache Redis 7 cluster (cache.t3.micro)
- S3 buckets for static assets and backups
- CloudFront distribution
- CloudWatch monitoring and alarms
- AWS Backup configuration

Current context:
- Team has strong Python experience from backend development (Hono + tRPC)
- AWS account configured with IAM user for deployments
- Focus on learning AWS best practices for Solutions Architect certification
- Cost optimization is a priority (target under $60/month)
- Need comprehensive testing (unit tests, property tests, integration tests)

## Decision

Using AWS CDK with Python as the Infrastructure as Code tool for Phase 1 and all subsequent phases.

Implementation approach:
- AWS CDK v2 with Python 3.11+
- Modular stack architecture (Network, Security, Database, Cache, Storage, CDN, Monitoring, Backup)
- Type hints and docstrings for all code
- Comprehensive testing with pytest
- CloudFormation as the underlying deployment engine

## Alternatives Considered

### Option 1: Terraform (HashiCorp Configuration Language)

Use Terraform with HCL to define infrastructure declaratively.

Advantages:
- Cloud-agnostic (can manage multiple cloud providers)
- Mature ecosystem with extensive provider support
- Large community and abundant learning resources
- State management with remote backends (S3 + DynamoDB)
- Terraform Cloud for team collaboration
- Plan/apply workflow shows changes before deployment
- Module registry for reusable components

Disadvantages:
- HCL is a new language to learn (not Python)
- Less type safety compared to programming languages
- AWS-specific features sometimes lag behind CDK
- State file management adds complexity
- No native AWS integration (third-party provider)
- Testing requires additional tools (Terratest, etc.)
- Less expressive for complex logic

Learning curve: Medium (new language, new concepts)
AWS integration: Good (via terraform-provider-aws)
Type safety: Limited (HCL is declarative, not strongly typed)
Testing: Requires additional frameworks

### Option 2: AWS CDK with Python (Selected)

Use AWS CDK with Python to define infrastructure programmatically.

Advantages:
- Python is already familiar from backend development
- Strong type safety with Python type hints
- Native AWS integration (built by AWS)
- L2 constructs provide high-level abstractions
- CloudFormation under the hood (reliable, well-tested)
- Excellent IDE support (autocomplete, inline docs)
- Easy to write unit tests with pytest
- Construct library for reusable components
- Can use Python libraries for complex logic
- Synthesizes to CloudFormation templates

Disadvantages:
- AWS-only (not cloud-agnostic)
- Smaller community compared to Terraform
- CloudFormation limitations apply
- State managed by CloudFormation (less control)
- Steeper learning curve for CDK concepts
- Breaking changes between CDK versions

Learning curve: Low (familiar language, new framework)
AWS integration: Excellent (native AWS tool)
Type safety: Strong (Python type hints)
Testing: Native (pytest, CDK assertions)

### Option 3: AWS CloudFormation (YAML/JSON)

Use CloudFormation templates directly without abstraction layer.

Advantages:
- Native AWS service (no additional tools)
- Declarative YAML/JSON syntax
- Well-documented and stable
- No abstraction layer to learn
- Direct control over all properties

Disadvantages:
- Verbose YAML/JSON syntax
- No type safety or IDE support
- Difficult to reuse code (nested stacks are complex)
- Hard to test (no unit testing framework)
- No programming constructs (loops, conditionals)
- Manual parameter management
- Limited abstraction capabilities

Learning curve: Low (simple syntax)
AWS integration: Excellent (native)
Type safety: None
Testing: Very difficult

### Option 4: Pulumi with Python

Use Pulumi with Python for infrastructure as code.

Advantages:
- Python language (familiar)
- Cloud-agnostic (multi-cloud support)
- Strong type safety
- Good testing support
- Modern tooling and IDE support

Disadvantages:
- Smaller community than Terraform or CDK
- Requires Pulumi Cloud or self-hosted backend
- Less mature than Terraform or CDK
- Additional service dependency
- Fewer learning resources
- Not as widely adopted in enterprise

Learning curve: Medium (new framework)
AWS integration: Good (via Pulumi AWS provider)
Type safety: Strong (Python)
Testing: Good (native Python testing)

## Rationale

The decision came down to four main factors:

**Python familiarity**: The team already uses Python for the backend (Hono + tRPC backend logic). Using Python for infrastructure means no context switching between languages. We can leverage existing Python knowledge, libraries, and tooling. Type hints provide excellent IDE support with autocomplete and inline documentation.

**AWS integration**: CDK is built by AWS specifically for AWS. It has native support for all AWS services and features. L2 constructs provide sensible defaults and best practices built-in. When AWS releases new services or features, CDK support is typically available immediately. CloudFormation under the hood means we benefit from AWS's battle-tested deployment engine.

**Learning value**: For Solutions Architect certification preparation, deep AWS knowledge is more valuable than cloud-agnostic skills. CDK teaches AWS service relationships and best practices. The construct library demonstrates how AWS services should be configured. This knowledge transfers directly to the certification exam and real-world AWS projects.

**Type safety and testing**: Python type hints provide compile-time checking of resource configurations. CDK assertions library makes unit testing straightforward. Property-based testing with Hypothesis works naturally with Python. Integration testing can use boto3 alongside CDK code. The testing story is much stronger than Terraform or CloudFormation.

Additional considerations:

**Cost**: CDK itself is free (just uses CloudFormation). No additional service costs like Pulumi Cloud. No state management costs like Terraform (S3 + DynamoDB).

**Community and resources**: While smaller than Terraform, CDK has excellent documentation, active GitHub repository, and growing community. AWS provides official examples and best practices. The construct hub has reusable components.

**Future flexibility**: If we need multi-cloud later, we can evaluate Terraform or Pulumi then. For Phase 1 and likely all ShowCore phases, AWS-only is perfectly fine. The architecture knowledge gained with CDK transfers to other IaC tools.

Trade-offs I'm accepting:

**Cloud lock-in**: CDK is AWS-only. If we ever need to deploy to Azure or GCP, we'd need a different tool. This is acceptable because ShowCore is an AWS learning project. Multi-cloud is not a requirement.

**CloudFormation limitations**: CDK synthesizes to CloudFormation, so CloudFormation limits apply (200 resources per stack, etc.). For Phase 1 scale, this is not a concern. Can use nested stacks if needed.

**Smaller community**: Terraform has more Stack Overflow answers and blog posts. CDK community is smaller but growing. AWS documentation is excellent, which compensates.

**Breaking changes**: CDK has had breaking changes between major versions. Using CDK v2 (stable) mitigates this. Pinning versions in requirements.txt provides stability.

## Consequences

### What we gain

**Familiar language**: Python is already used for backend development. No need to learn HCL or another configuration language. Can use Python libraries for complex logic (date calculations, string manipulation, etc.).

**Strong type safety**: Python type hints catch configuration errors at development time. IDE autocomplete shows available properties and methods. Inline documentation appears in IDE. Reduces trial-and-error deployment cycles.

**Excellent testing**: pytest for unit tests works naturally. CDK assertions library validates CloudFormation templates. Property-based testing with Hypothesis for universal properties. Integration testing with boto3. Can achieve high test coverage.

**Native AWS integration**: L2 constructs provide sensible defaults. Automatic security group rules, IAM policies, etc. New AWS features available immediately. CloudFormation reliability and rollback capabilities.

**Reusable constructs**: Can create custom constructs for ShowCore patterns. Construct library provides community components. Easy to share code between stacks.

**Better learning experience**: Understanding CDK teaches AWS service relationships. Construct library demonstrates best practices. Knowledge directly applicable to Solutions Architect certification.

### What we lose

**Cloud-agnostic flexibility**: Locked into AWS. If we need multi-cloud, would need to rewrite with Terraform or Pulumi. This is acceptable for a learning project focused on AWS.

**Terraform ecosystem**: Can't use Terraform modules from the registry. Smaller community means fewer blog posts and examples. Less Stack Overflow content.

**State management control**: CloudFormation manages state automatically. Less control compared to Terraform state files. Can't easily manipulate state. This is actually a benefit for simplicity.

**HCL experience**: Won't gain Terraform/HCL skills. If future jobs require Terraform, would need to learn it separately. However, IaC concepts transfer between tools.

### How I'm handling the downsides

**Cloud lock-in**: Acceptable for this project. AWS is the target platform for all phases. If multi-cloud becomes a requirement, can evaluate migration then. The architecture knowledge transfers to other tools.

**Smaller community**: AWS documentation is excellent. CDK GitHub has active maintainers. Can always fall back to CloudFormation documentation. The construct hub provides examples.

**Learning Terraform**: If needed for future jobs, Terraform concepts are similar to CDK. Understanding IaC principles with CDK makes learning Terraform easier. Can learn Terraform separately if needed.

**CloudFormation limits**: Phase 1 infrastructure is well under 200 resources per stack. Using modular stack architecture (Network, Database, Cache, etc.) keeps stacks small. Can use nested stacks if needed.

## Implementation

### Project structure

```
infrastructure/
├── app.py                      # CDK app entry point
├── cdk.json                    # CDK configuration
├── requirements.txt            # Python dependencies
├── requirements-dev.txt        # Development dependencies
├── README.md                   # Deployment instructions
│
├── lib/                        # CDK constructs and stacks
│   ├── stacks/                 # Stack definitions
│   │   ├── network_stack.py
│   │   ├── security_stack.py
│   │   ├── database_stack.py
│   │   ├── cache_stack.py
│   │   ├── storage_stack.py
│   │   ├── cdn_stack.py
│   │   ├── monitoring_stack.py
│   │   └── backup_stack.py
│   │
│   └── constructs/             # Reusable constructs
│       ├── vpc_endpoints.py
│       ├── tagged_resource.py
│       └── monitoring_alarms.py
│
└── tests/                      # Test files
    ├── unit/                   # Unit tests
    ├── property/               # Property-based tests
    └── integration/            # Integration tests
```

### Stack hierarchy

```python
ShowCorePhase1App
├── ShowCoreNetworkStack (foundation)
├── ShowCoreSecurityStack (depends on Network)
├── ShowCoreDatabaseStack (depends on Network, Security)
├── ShowCoreCacheStack (depends on Network, Security)
├── ShowCoreStorageStack (depends on Network)
├── ShowCoreCDNStack (depends on Storage)
├── ShowCoreMonitoringStack (depends on all above)
└── ShowCoreBackupStack (depends on Database, Cache)
```

### Development workflow

```bash
# 1. Validate syntax
cdk synth

# 2. Run linter and type checker
pylint lib/ tests/
mypy lib/ tests/

# 3. Run tests
pytest tests/ -v

# 4. Preview changes
cdk diff

# 5. Deploy
cdk deploy --all
```

### Testing approach

- **Unit tests**: Test each stack creates expected resources with correct properties
- **Property tests**: Test universal properties (security groups, tagging, encryption)
- **Integration tests**: Test connectivity and functionality after deployment

### Coding standards

- Python type hints for all functions and classes
- Docstrings for all public methods
- PEP 8 style guide
- Meaningful variable names (no abbreviations)
- Comments for cost optimization and security decisions

## When to revisit this

Should review this decision:
- After Phase 1 completion - assess CDK experience and any pain points
- If multi-cloud becomes a requirement - evaluate Terraform or Pulumi
- If team composition changes - consider team's language preferences
- If CloudFormation limits become a constraint - evaluate alternatives
- Annually - review CDK ecosystem maturity and community growth

## References

- AWS CDK documentation: https://docs.aws.amazon.com/cdk/latest/guide/home.html
- AWS CDK Python reference: https://docs.aws.amazon.com/cdk/api/v2/python/
- Terraform documentation: https://www.terraform.io/docs
- Infrastructure as Code standards: `.kiro/steering/iac-standards.md`
- Requirements document: `requirements.md` (Requirement 10)

## Related decisions

- ADR-001: VPC Endpoints vs NAT Gateway - accepted
- ADR-003: Single-AZ vs Multi-AZ deployment strategy - pending
- ADR-004: Testing strategy for infrastructure code - pending
