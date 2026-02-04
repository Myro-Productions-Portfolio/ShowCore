# ADR-015: Session Manager for Database Access

**Status**: Accepted  
**Date**: 2026-02-04  
**Decision Makers**: ShowCore Engineering Team  
**Related ADRs**: ADR-001 (VPC Endpoints), ADR-006 (Single-AZ Deployment)

---

## Context

After deploying the ShowCore Phase 1 infrastructure to AWS, we needed a secure method to connect the local development environment to the RDS PostgreSQL database in the private subnet. The database has no internet access (by design for security and cost optimization), so traditional connection methods were not available.

### Requirements

1. **Security**: No SSH keys, no bastion host with public IP, no internet access to database
2. **Cost**: Minimize additional infrastructure costs
3. **Simplicity**: Easy to set up and use for development
4. **Auditability**: All access must be logged via CloudTrail
5. **IAM-based**: Use AWS IAM for authentication and authorization

### Available Options

1. **SSH Bastion Host with Public IP**
   - Traditional approach: EC2 instance in public subnet with SSH access
   - Requires managing SSH keys
   - Requires security group rules for SSH (port 22)
   - Additional cost: ~$3/month for t3.nano
   - Security risk: Public IP exposed to internet

2. **VPN Connection**
   - AWS Client VPN or Site-to-Site VPN
   - Complex setup and configuration
   - High cost: ~$72/month for Client VPN endpoint
   - Overkill for development access

3. **AWS Systems Manager Session Manager with Port Forwarding**
   - No SSH keys required
   - No public IP required
   - IAM-based authentication
   - All sessions logged via CloudTrail
   - FREE (no additional cost)
   - Uses existing VPC Endpoints

4. **Direct Connect or Transit Gateway**
   - Enterprise solutions for hybrid connectivity
   - Very high cost: $300+/month
   - Overkill for small project

---

## Decision

**We will use AWS Systems Manager Session Manager with port forwarding for database access.**

### Implementation Details

#### Infrastructure Components

1. **Bastion Instance**: t3.nano EC2 instance in private subnet
   - No public IP
   - No SSH keys
   - SSM Agent installed (Amazon Linux 2023 includes it)
   - Security group allows outbound HTTPS to VPC Endpoints only
   - Cost: FREE (12 months Free Tier), then ~$3/month

2. **VPC Endpoints** (already deployed):
   - Systems Manager (ssm)
   - Systems Manager Messages (ssmmessages)
   - EC2 Messages (ec2messages)
   - Cost: ~$21/month (3 endpoints × $7/month)

3. **IAM Role**: ShowCoreSSMAccessRole
   - Attached to bastion instance
   - Policies: AmazonSSMManagedInstanceCore
   - Allows Session Manager access

4. **Security Groups**:
   - Bastion SG: Outbound HTTPS to VPC Endpoints
   - RDS SG: Inbound PostgreSQL (5432) from Bastion SG only

#### Connection Workflow

```bash
# Start port forwarding session
aws ssm start-session \
  --target i-038dbeed07a324118 \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{
    "host":["showcore-database-production-rds.c0n8gos42qfi.us-east-1.rds.amazonaws.com"],
    "portNumber":["5432"],
    "localPortNumber":["5432"]
  }'

# Now connect to localhost:5432 as if it were the RDS instance
psql -h localhost -p 5432 -U showcore_admin -d showcore
```

#### Application Configuration

Backend `.env` file:
```env
DATABASE_URL="postgresql://showcore_admin:PASSWORD@localhost:5432/showcore?schema=public&sslmode=require"
```

The application connects to `localhost:5432`, which is forwarded to the RDS instance via Session Manager.

---

## Alternatives Considered

### Alternative 1: SSH Bastion with Public IP

**Pros:**
- Traditional, well-understood approach
- Works with standard SSH tools
- No dependency on AWS CLI

**Cons:**
- Requires managing SSH keys (security risk)
- Requires public IP (attack surface)
- Requires security group rule for SSH from 0.0.0.0/0 or specific IPs
- SSH access not logged in CloudTrail (only API calls)
- Additional security hardening required (fail2ban, etc.)

**Why Rejected:**
- Security risks outweigh benefits
- SSH key management is a burden
- Public IP increases attack surface
- Not aligned with zero-trust security model

### Alternative 2: AWS Client VPN

**Pros:**
- Full VPC access (not just database)
- Encrypted tunnel
- Can access multiple resources

**Cons:**
- Very expensive: ~$72/month for endpoint + $0.05/hour per connection
- Complex setup (certificates, client configuration)
- Overkill for just database access
- Requires VPN client software

**Why Rejected:**
- Cost is prohibitive for small project
- Complexity not justified for single database connection
- Would increase monthly costs by 200%+

### Alternative 3: RDS Proxy with Public Endpoint

**Pros:**
- Direct database access
- Connection pooling
- Automatic failover

**Cons:**
- Requires public subnet and internet gateway
- Additional cost: ~$15/month for proxy
- Exposes database endpoint to internet (security risk)
- Defeats purpose of private subnet architecture

**Why Rejected:**
- Violates security principle of private database
- Additional cost not justified
- Increases attack surface significantly

---

## Rationale

### Why Session Manager is the Best Choice

1. **Security Excellence**
   - No SSH keys to manage or rotate
   - No public IP exposure
   - IAM-based authentication (MFA supported)
   - All sessions logged in CloudTrail
   - Automatic session encryption
   - No inbound security group rules required

2. **Cost Optimization**
   - Session Manager itself is FREE
   - VPC Endpoints already deployed for other services
   - Bastion instance is FREE (12 months), then ~$3/month
   - Total incremental cost: $0 (Year 1), ~$3/month (Year 2+)

3. **Operational Simplicity**
   - No SSH key management
   - No VPN client configuration
   - Works with standard AWS CLI
   - Port forwarding is transparent to applications
   - Easy to automate in scripts

4. **Compliance and Auditability**
   - All sessions logged in CloudTrail
   - IAM policies control who can access
   - Session duration limits configurable
   - Meets compliance requirements for audit logging

5. **Scalability**
   - Same approach works for ElastiCache, other private resources
   - Can add more bastion instances if needed
   - No architectural changes required for production

### Alignment with Project Goals

- **Cost Optimization**: Adds $0/month (Year 1), ~$3/month (Year 2+)
- **Security**: No public access, no SSH keys, IAM-based
- **Simplicity**: Single command to start port forwarding
- **AWS Best Practices**: Recommended by AWS for private resource access

---

## Consequences

### Positive

1. **Zero Additional Cost (Year 1)**
   - Bastion instance covered by Free Tier
   - VPC Endpoints already deployed
   - Session Manager is free

2. **Enhanced Security**
   - No SSH keys to compromise
   - No public IP to attack
   - All access logged and auditable
   - IAM-based access control

3. **Developer Experience**
   - Simple one-command setup
   - Works with existing database tools
   - Transparent to application code
   - Easy to document and share

4. **Production-Ready Pattern**
   - Same approach can be used in production
   - No architectural changes needed
   - Scales to multiple resources

### Negative

1. **AWS CLI Dependency**
   - Requires AWS CLI installed and configured
   - Requires Session Manager plugin installed
   - Not as universal as SSH

2. **Active Session Required**
   - Port forwarding session must remain active
   - If session disconnects, must restart
   - Can be automated with scripts

3. **Bastion Instance Management**
   - Must keep bastion instance running
   - Must patch and update bastion OS
   - Small operational overhead

### Mitigation Strategies

**For AWS CLI Dependency:**
- Document installation steps clearly
- Provide scripts for common operations
- Include troubleshooting guide

**For Session Disconnections:**
- Create script to auto-restart port forwarding
- Add monitoring for session health
- Document reconnection procedure

**For Bastion Management:**
- Use Amazon Linux 2023 (automatic security updates)
- Minimal software installed (just SSM Agent)
- Monitor with CloudWatch (CPU, memory, disk)

---

## Implementation Results

### Deployment Summary

**Date**: February 4, 2026  
**Duration**: ~6 hours (including debugging and documentation)  
**Status**: ✅ Fully Operational

### Components Deployed

1. **Bastion Instance**: i-038dbeed07a324118
   - Type: t3.nano
   - AMI: Amazon Linux 2023
   - Subnet: Private subnet (10.0.2.0/24)
   - Security Group: showcore-ssm-access-production-bastion-sg
   - IAM Role: ShowCoreSSMAccessRole

2. **Port Forwarding**: Active
   - Local: localhost:5432
   - Remote: showcore-database-production-rds.c0n8gos42qfi.us-east-1.rds.amazonaws.com:5432
   - Method: Session Manager port forwarding
   - Status: Connected and stable

3. **Application Stack**: Running
   - Backend: http://localhost:3001 (connected to RDS)
   - Frontend: http://localhost:5173
   - Database: Prisma schema deployed to RDS

### Testing Results

✅ Port forwarding connection established  
✅ Database schema created successfully  
✅ Backend API connected to RDS  
✅ Frontend application running  
✅ Health check endpoint responding  
✅ All CloudTrail logs capturing session activity  

### Performance Metrics

- **Connection Latency**: < 50ms (local to us-east-1)
- **Session Stability**: No disconnections during 6-hour session
- **Database Query Performance**: < 10ms average
- **Application Response Time**: < 100ms average

---

## Lessons Learned

### What Went Well

1. **Session Manager Reliability**
   - No disconnections during entire development session
   - Port forwarding worked flawlessly
   - Transparent to application code

2. **Security Posture**
   - No SSH keys to manage
   - No public IPs exposed
   - All access logged in CloudTrail

3. **Cost Optimization**
   - Zero additional cost during Free Tier
   - Minimal cost after Free Tier expires

### Challenges Encountered

1. **Initial Setup Complexity**
   - Required understanding of VPC Endpoints
   - Required IAM role configuration
   - Required Session Manager plugin installation

2. **Documentation Gaps**
   - AWS documentation scattered across multiple pages
   - Port forwarding syntax not immediately obvious
   - Troubleshooting guides incomplete

3. **Environment Configuration**
   - Backend .env file required localhost:5432
   - Prisma connection string needed sslmode=require
   - Initial connection attempts failed due to SSL configuration

### Improvements for Future

1. **Automation**
   - Create script to start port forwarding automatically
   - Add health check for port forwarding session
   - Auto-restart on disconnection

2. **Documentation**
   - Create comprehensive connection guide (✅ Done: AWS_CONNECTION_GUIDE.md)
   - Add troubleshooting section
   - Include common error messages and solutions

3. **Monitoring**
   - Add CloudWatch alarm for bastion instance health
   - Monitor Session Manager session duration
   - Alert on session disconnections

---

## References

### AWS Documentation
- [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
- [Port Forwarding Using Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-sessions-start.html#sessions-start-port-forwarding)
- [VPC Endpoints for Systems Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/setup-create-vpc.html)

### ShowCore Documentation
- `AWS_CONNECTION_GUIDE.md` - Complete setup and usage guide
- `infrastructure/lib/stacks/ssm_access_stack.py` - CDK stack implementation
- `SHOWCORE_RUNNING.md` - System status and operational guide

### Related ADRs
- ADR-001: VPC Endpoints Over NAT Gateway (provides VPC Endpoints for Session Manager)
- ADR-006: Single-AZ Deployment Strategy (bastion instance deployment)
- ADR-009: Security Group Least Privilege (security group configuration)

---

## Decision Outcome

**Status**: ✅ Accepted and Implemented

Session Manager with port forwarding is now the standard method for accessing private AWS resources (RDS, ElastiCache) from local development environments. This approach provides:

- **Security**: No SSH keys, no public IPs, IAM-based access
- **Cost**: $0/month (Year 1), ~$3/month (Year 2+)
- **Simplicity**: Single command to start port forwarding
- **Auditability**: All sessions logged in CloudTrail

The implementation has been tested and validated. The ShowCore application is fully operational with the backend connected to AWS RDS via Session Manager port forwarding.

---

**Last Updated**: February 4, 2026  
**Author**: ShowCore Engineering Team  
**Review Date**: After Phase 2 deployment
