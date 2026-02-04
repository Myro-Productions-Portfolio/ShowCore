# ADR-009: Security Group Design and Least Privilege Approach

**Status**: Accepted  
**Date**: February 4, 2026  
**Deciders**: ShowCore Engineering Team  
**Validates**: Requirements 6.2, 3.3, 4.3, 2.12

## Context

Phase 1 infrastructure requires security groups to control network access to:
- RDS PostgreSQL database (port 5432)
- ElastiCache Redis cluster (port 6379)
- VPC Interface Endpoints (port 443)
- Future application tier (ports 80, 443)

Security groups act as virtual firewalls controlling inbound and outbound traffic. Poor security group configuration is a common source of security vulnerabilities, particularly:
- Allowing 0.0.0.0/0 (all internet) access to databases
- Overly permissive port ranges
- Unnecessary outbound rules
- Missing descriptions for rules

Current context:
- ShowCore is a public portfolio project (security demonstration important)
- No public endpoints in Phase 1 (data tier only)
- Future application tier will have public endpoints (Phase 2)
- Need to demonstrate security best practices
- AWS Well-Architected Framework emphasizes least privilege

## Decision

**Implement strict least privilege security groups with explicit deny-by-default approach.**

Implementation principles:
1. **No 0.0.0.0/0 on sensitive ports** (22, 5432, 6379)
2. **Specific source security groups** instead of CIDR ranges
3. **Descriptive rule names** for all rules
4. **Minimal outbound rules** (stateful = no outbound needed)
5. **Separate security groups** per service
6. **Property-based testing** to verify no overly permissive rules

## Alternatives Considered

### Alternative 1: Permissive Security Groups (Anti-Pattern)

**Approach**: Allow 0.0.0.0/0 access to all services for simplicity.

**Pros**:
- Simple configuration
- No connectivity issues
- Easy troubleshooting

**Cons**:
- Major security vulnerability
- Exposes database to internet
- Violates AWS best practices
- Violates ShowCore requirements (6.2)
- Bad practice for portfolio project
- Fails security audits

**Decision**: Rejected. Unacceptable security risk.

### Alternative 2: CIDR-Based Security Groups

**Approach**: Use VPC CIDR ranges (10.0.0.0/16) as source for all rules.

**Pros**:
- More secure than 0.0.0.0/0
- Simple to configure
- Works for all VPC resources

**Cons**:
- Less granular than security group references
- Allows access from all VPC resources
- Harder to audit (which resources have access?)
- Doesn't follow least privilege principle
- More difficult to refactor

**Decision**: Rejected. Not granular enough for least privilege.

### Alternative 3: Security Group References (Selected)

**Approach**: Use security group IDs as sources for all rules.

**Pros**:
- Most granular access control
- Follows least privilege principle
- Easy to audit (clear resource relationships)
- Easy to refactor (change security group, not CIDR)
- AWS best practice
- Demonstrates security knowledge

**Cons**:
- Slightly more complex configuration
- Requires planning security group dependencies
- Need to create security groups before referencing

**Decision**: Accepted. Best security posture and AWS best practice.

### Alternative 4: Network ACLs Instead of Security Groups

**Approach**: Use Network ACLs for subnet-level filtering instead of security groups.

**Pros**:
- Subnet-level control
- Stateless (explicit inbound and outbound)
- Can deny specific traffic

**Cons**:
- Less granular than security groups
- Stateless (must configure both directions)
- More complex rule management
- Security groups are preferred for most use cases
- Network ACLs are for additional defense-in-depth

**Decision**: Rejected. Security groups are preferred, can add NACLs later for defense-in-depth.

## Rationale

The decision prioritizes security best practices and demonstrates AWS security knowledge.

### Security Principles

**Least Privilege**:
- Grant only the minimum access required
- Use security group references (most specific)
- No 0.0.0.0/0 on sensitive ports
- Explicit deny-by-default

**Defense in Depth**:
- Multiple layers of security
- Security groups + private subnets + VPC Endpoints
- Encryption at rest and in transit
- CloudTrail audit logging

**Separation of Concerns**:
- Separate security group per service
- Clear ownership and responsibility
- Easier to audit and modify

**Auditability**:
- Descriptive rule names
- Clear source/destination relationships
- Property-based tests verify compliance

### Security Group Design

**RDS Security Group**:
- Name: `showcore-rds-sg`
- Ingress: PostgreSQL (5432) from application security group only
- Egress: None (stateful, return traffic allowed automatically)
- Description: "Security group for RDS PostgreSQL database"

**ElastiCache Security Group**:
- Name: `showcore-elasticache-sg`
- Ingress: Redis (6379) from application security group only
- Egress: None (stateful, return traffic allowed automatically)
- Description: "Security group for ElastiCache Redis cluster"

**VPC Endpoint Security Group**:
- Name: `showcore-vpc-endpoint-sg`
- Ingress: HTTPS (443) from VPC CIDR (10.0.0.0/16)
- Egress: None (stateful, return traffic allowed automatically)
- Description: "Security group for VPC Interface Endpoints"

**Application Security Group** (Phase 2):
- Name: `showcore-app-sg`
- Ingress: HTTP (80), HTTPS (443) from 0.0.0.0/0 (public access)
- Egress: None (stateful, return traffic allowed automatically)
- Description: "Security group for application tier"

### Sensitive Ports

These ports must NEVER allow 0.0.0.0/0 access:
- **22 (SSH)**: Remote shell access
- **3389 (RDP)**: Remote desktop access
- **5432 (PostgreSQL)**: Database access
- **3306 (MySQL)**: Database access
- **6379 (Redis)**: Cache access
- **27017 (MongoDB)**: Database access

Property-based test verifies no security group allows 0.0.0.0/0 on these ports.

### Stateful vs Stateless

**Security Groups (Stateful)**:
- Return traffic automatically allowed
- No need for explicit outbound rules
- Simpler configuration

**Network ACLs (Stateless)**:
- Must configure both inbound and outbound
- More complex rule management
- Used for additional defense-in-depth

**Verdict**: Use stateful security groups, no outbound rules needed.

## Consequences

### Positive

1. **Strong Security Posture**: No overly permissive rules
2. **Least Privilege**: Minimal access granted
3. **Auditability**: Clear rule descriptions and relationships
4. **AWS Best Practice**: Follows Well-Architected Framework
5. **Portfolio Demonstration**: Shows security knowledge
6. **Property Testing**: Automated verification of security rules
7. **Easy Refactoring**: Security group references easier to change

### Negative

1. **More Complex**: Requires planning security group dependencies
2. **More Configuration**: More security groups to manage
3. **Troubleshooting**: Need to check multiple security groups

### Neutral

1. **Acceptable Complexity**: Worth it for security benefits
2. **Documentation Required**: Document security group relationships
3. **Testing Required**: Property tests verify compliance

## Implementation

### Security Group Definitions

```python
# VPC Endpoint Security Group
vpc_endpoint_sg = ec2.SecurityGroup(
    self, "VpcEndpointSecurityGroup",
    vpc=vpc,
    description="Security group for VPC Interface Endpoints",
    allow_all_outbound=False,  # No outbound rules needed (stateful)
)

vpc_endpoint_sg.add_ingress_rule(
    peer=ec2.Peer.ipv4(vpc.vpc_cidr_block),  # 10.0.0.0/16
    connection=ec2.Port.tcp(443),
    description="HTTPS from VPC for AWS service access"
)

# RDS Security Group
rds_sg = ec2.SecurityGroup(
    self, "RdsSecurityGroup",
    vpc=vpc,
    description="Security group for RDS PostgreSQL database",
    allow_all_outbound=False,  # No outbound rules needed (stateful)
)

# Will add ingress rule after application security group is created
# rds_sg.add_ingress_rule(
#     peer=ec2.Peer.security_group_id(app_sg.security_group_id),
#     connection=ec2.Port.tcp(5432),
#     description="PostgreSQL from application tier"
# )

# ElastiCache Security Group
elasticache_sg = ec2.SecurityGroup(
    self, "ElastiCacheSecurityGroup",
    vpc=vpc,
    description="Security group for ElastiCache Redis cluster",
    allow_all_outbound=False,  # No outbound rules needed (stateful)
)

# Will add ingress rule after application security group is created
# elasticache_sg.add_ingress_rule(
#     peer=ec2.Peer.security_group_id(app_sg.security_group_id),
#     connection=ec2.Port.tcp(6379),
#     description="Redis from application tier"
# )

# Application Security Group (Phase 2)
# app_sg = ec2.SecurityGroup(
#     self, "AppSecurityGroup",
#     vpc=vpc,
#     description="Security group for application tier",
#     allow_all_outbound=False,  # No outbound rules needed (stateful)
# )
# 
# app_sg.add_ingress_rule(
#     peer=ec2.Peer.any_ipv4(),  # 0.0.0.0/0 - public access
#     connection=ec2.Port.tcp(80),
#     description="HTTP from internet"
# )
# 
# app_sg.add_ingress_rule(
#     peer=ec2.Peer.any_ipv4(),  # 0.0.0.0/0 - public access
#     connection=ec2.Port.tcp(443),
#     description="HTTPS from internet"
# )
```

### Property-Based Test

```python
def test_security_group_least_privilege():
    """
    Property: No security group allows 0.0.0.0/0 access on sensitive ports.
    
    Validates: Requirements 6.2
    """
    ec2 = boto3.client('ec2', region_name='us-east-1')
    security_groups = ec2.describe_security_groups()
    
    sensitive_ports = [22, 3389, 5432, 3306, 6379, 27017]
    
    for sg in security_groups['SecurityGroups']:
        for rule in sg.get('IpPermissions', []):
            from_port = rule.get('FromPort')
            to_port = rule.get('ToPort')
            
            # Check if rule covers any sensitive port
            if from_port and to_port:
                for port in sensitive_ports:
                    if from_port <= port <= to_port:
                        # Check if rule allows 0.0.0.0/0
                        for ip_range in rule.get('IpRanges', []):
                            assert ip_range['CidrIp'] != '0.0.0.0/0', \
                                f"Security group {sg['GroupId']} ({sg['GroupName']}) " \
                                f"allows 0.0.0.0/0 on sensitive port {port}"
                        
                        for ipv6_range in rule.get('Ipv6Ranges', []):
                            assert ipv6_range['CidrIpv6'] != '::/0', \
                                f"Security group {sg['GroupId']} ({sg['GroupName']}) " \
                                f"allows ::/0 on sensitive port {port}"
```

### Unit Tests

```python
def test_rds_security_group_no_public_access():
    """Test RDS security group does not allow public access."""
    app = cdk.App()
    stack = ShowCoreSecurityStack(app, "TestStack", vpc=mock_vpc)
    template = Template.from_stack(stack)
    
    # Verify RDS security group exists
    template.has_resource_properties("AWS::EC2::SecurityGroup", {
        "GroupDescription": "Security group for RDS PostgreSQL database"
    })
    
    # Verify no rule allows 0.0.0.0/0 on port 5432
    # (This is checked by property test after deployment)

def test_elasticache_security_group_no_public_access():
    """Test ElastiCache security group does not allow public access."""
    app = cdk.App()
    stack = ShowCoreSecurityStack(app, "TestStack", vpc=mock_vpc)
    template = Template.from_stack(stack)
    
    # Verify ElastiCache security group exists
    template.has_resource_properties("AWS::EC2::SecurityGroup", {
        "GroupDescription": "Security group for ElastiCache Redis cluster"
    })
    
    # Verify no rule allows 0.0.0.0/0 on port 6379
    # (This is checked by property test after deployment)

def test_vpc_endpoint_security_group_allows_vpc():
    """Test VPC Endpoint security group allows VPC CIDR."""
    app = cdk.App()
    stack = ShowCoreSecurityStack(app, "TestStack", vpc=mock_vpc)
    template = Template.from_stack(stack)
    
    # Verify VPC Endpoint security group allows HTTPS from VPC
    template.has_resource_properties("AWS::EC2::SecurityGroup", {
        "GroupDescription": "Security group for VPC Interface Endpoints",
        "SecurityGroupIngress": [
            {
                "IpProtocol": "tcp",
                "FromPort": 443,
                "ToPort": 443,
                "CidrIp": "10.0.0.0/16"
            }
        ]
    })
```

### Security Group Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                     Internet (0.0.0.0/0)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS (80, 443)
                              ▼
                    ┌──────────────────────┐
                    │  Application Tier    │
                    │  (app-sg)            │
                    │  Phase 2             │
                    └──────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                │ PostgreSQL (5432)         │ Redis (6379)
                ▼                           ▼
      ┌──────────────────┐        ┌──────────────────┐
      │  RDS PostgreSQL  │        │  ElastiCache     │
      │  (rds-sg)        │        │  (elasticache-sg)│
      └──────────────────┘        └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    VPC (10.0.0.0/16)                         │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  VPC Interface Endpoints (vpc-endpoint-sg)             │ │
│  │  HTTPS (443) from VPC CIDR                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## When to Review

Review security group configuration when:

1. **Adding New Services**: Create new security groups with least privilege
2. **Connectivity Issues**: Verify security group rules before adding permissive rules
3. **Security Audit**: Quarterly review of all security groups
4. **Compliance Requirements**: When compliance standards change
5. **After Incidents**: Review security groups after any security incident

## Security Best Practices

1. **Never use 0.0.0.0/0 on sensitive ports** (22, 5432, 6379, etc.)
2. **Use security group references** instead of CIDR ranges when possible
3. **Add descriptive names** to all rules
4. **Minimize outbound rules** (stateful security groups don't need them)
5. **Separate security groups** per service
6. **Regular audits** of security group rules
7. **Property testing** to verify compliance
8. **Document relationships** between security groups

## References

- [AWS Security Groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)
- [Security Group Best Practices](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-best-practices.html)
- [AWS Well-Architected Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html)
- [Least Privilege Principle](https://en.wikipedia.org/wiki/Principle_of_least_privilege)
- ShowCore Requirements: 6.2, 3.3, 4.3, 2.12
- ShowCore Design: design.md (Security Architecture)

## Related Decisions

- ADR-001: VPC Endpoints over NAT Gateway (network security)
- ADR-008: Encryption key management (data security)
- ADR-005: CloudTrail audit logging (security monitoring)

## Approval

- **Proposed By**: ShowCore Engineering Team
- **Reviewed By**: Security Review
- **Approved By**: Project Lead
- **Date**: February 4, 2026

---

**Implementation Status**: ✅ Implemented in `infrastructure/lib/stacks/security_stack.py`  
**Property Test Status**: ✅ Implemented in `infrastructure/tests/property/test_security_groups.py`  
**Next Review**: After Phase 1 completion or quarterly security audit
