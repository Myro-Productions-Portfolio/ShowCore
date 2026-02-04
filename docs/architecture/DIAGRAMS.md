# ShowCore Architecture Diagrams

This document explains the architecture diagrams for ShowCore Phase 1 and how to regenerate them.

## Available Diagrams

### 1. Complete Architecture Diagram
**File**: `showcore_phase1_architecture.png`

This comprehensive diagram shows all components of the ShowCore Phase 1 infrastructure:
- VPC with multi-AZ subnets (public and private)
- RDS PostgreSQL and ElastiCache Redis in private subnets
- VPC Endpoints (Gateway and Interface) for AWS service access
- S3 buckets and CloudFront CDN
- Security, monitoring, and backup components
- Complete network topology

**Use this diagram for**:
- Understanding the complete infrastructure
- Presenting to stakeholders
- Documentation and onboarding
- Architecture reviews

### 2. Network Flow Diagram
**File**: `showcore_network_flow.png`

This simplified diagram focuses on network flows and cost optimization:
- VPC Endpoints architecture (Gateway vs Interface)
- Cost comparison (NAT Gateway vs VPC Endpoints)
- Network traffic flows between components
- Security boundaries and access patterns

**Use this diagram for**:
- Understanding network architecture
- Explaining cost optimization decisions
- Troubleshooting connectivity issues
- Network security reviews

## Regenerating Diagrams

### Prerequisites
1. Python 3.9+ installed
2. Graphviz installed (required for diagrams library)
3. diagrams library installed

### Install Dependencies

```bash
# Install Graphviz (Windows)
# Download from: https://graphviz.org/download/
# Or use Chocolatey:
choco install graphviz

# Install Graphviz (macOS)
brew install graphviz

# Install Graphviz (Linux)
sudo apt-get install graphviz  # Debian/Ubuntu
sudo yum install graphviz      # RHEL/CentOS

# Install Python diagrams library
pip install diagrams
```

### Generate Diagrams

```bash
# Generate complete architecture diagram
python infrastructure/create_architecture_diagram.py

# Generate network flow diagram
python infrastructure/create_network_flow_diagram.py

# Both diagrams will be created in the current directory
# Move them to infrastructure/ directory:
move showcore_phase1_architecture.png infrastructure/
move showcore_network_flow.png infrastructure/
```

## Diagram Components

### Complete Architecture Diagram Components

#### VPC and Networking
- **VPC**: 10.0.0.0/16 CIDR block
- **Public Subnets**: 10.0.0.0/24, 10.0.1.0/24 (us-east-1a, us-east-1b)
- **Private Subnets**: 10.0.2.0/24, 10.0.3.0/24 (us-east-1a, us-east-1b)
- **Internet Gateway**: For public subnet internet access
- **NO NAT Gateway**: Cost optimization

#### VPC Endpoints
- **Gateway Endpoints (FREE)**:
  - S3 Gateway Endpoint
  - DynamoDB Gateway Endpoint
- **Interface Endpoints (~$7/month each)**:
  - CloudWatch Logs Interface Endpoint
  - CloudWatch Monitoring Interface Endpoint
  - Systems Manager Interface Endpoint

#### Data Layer
- **RDS PostgreSQL 16**: db.t3.micro (Free Tier eligible)
- **ElastiCache Redis 7**: cache.t3.micro (Free Tier eligible)

#### Storage & CDN
- **S3 Buckets**:
  - Static Assets Bucket (versioned)
  - Backups Bucket (versioned)
  - CloudTrail Logs Bucket
- **CloudFront Distribution**: PriceClass_100 (lowest cost)

#### Security & Compliance
- **CloudTrail**: All regions, log file validation
- **AWS Config**: Compliance monitoring

#### Monitoring & Alerting
- **CloudWatch Dashboard**: Metrics and logs
- **CloudWatch Alarms**: Critical, warning, billing
- **SNS Topics**: Critical, warning, billing alerts

#### Backup & DR
- **AWS Backup Vault**: Encrypted backup storage
- **Backup Plans**: RDS and ElastiCache daily backups

### Network Flow Diagram Components

#### Network Paths
- **Public Subnet → Internet**: Via Internet Gateway (green)
- **Private Subnet → Internet**: ❌ NO Route (red, dashed)
- **Private Subnet → S3**: Via S3 Gateway Endpoint (blue, FREE)
- **Private Subnet → CloudWatch**: Via Interface Endpoints (orange, ~$7/month)

#### Cost Comparison
- **NAT Gateway**: ~$32/month (❌ NOT USED)
- **VPC Endpoints**: ~$21/month (✅ USED)
- **Net Savings**: ~$11/month

## Customizing Diagrams

### Modify Complete Architecture Diagram

Edit `infrastructure/create_architecture_diagram.py`:

```python
# Add new component
with Cluster("New Component"):
    new_service = NewService("Service Name")

# Add connection
existing_service >> Edge(label="Connection") >> new_service
```

### Modify Network Flow Diagram

Edit `infrastructure/create_network_flow_diagram.py`:

```python
# Add new network flow
source >> Edge(label="Flow Description", color="blue") >> destination

# Change edge colors:
# - green: Internet access
# - red: Blocked/no access
# - blue: Gateway Endpoints (FREE)
# - orange: Interface Endpoints (~$7/month)
```

### Diagram Styling

Both scripts use these styling options:

```python
# Graph attributes
graph_attr = {
    "fontsize": "16",        # Title font size
    "bgcolor": "white",      # Background color
    "pad": "0.5",            # Padding
    "splines": "ortho",      # Edge routing (ortho, spline, line)
    "nodesep": "0.8",        # Node separation
    "ranksep": "1.0"         # Rank separation
}

# Node attributes
node_attr = {
    "fontsize": "12",        # Node label font size
    "height": "1.2",         # Node height
    "width": "1.2"           # Node width
}

# Edge attributes
edge_attr = {
    "fontsize": "10"         # Edge label font size
}
```

## Diagram Formats

The diagrams library supports multiple output formats:

```python
# PNG (default)
with Diagram("Title", filename="diagram", show=False):
    # diagram code

# PDF
with Diagram("Title", filename="diagram", outformat="pdf", show=False):
    # diagram code

# SVG (scalable)
with Diagram("Title", filename="diagram", outformat="svg", show=False):
    # diagram code

# DOT (Graphviz source)
with Diagram("Title", filename="diagram", outformat="dot", show=False):
    # diagram code
```

## Troubleshooting

### Issue: "graphviz not found"
**Solution**: Install Graphviz and ensure it's in your PATH
```bash
# Windows: Add C:\Program Files\Graphviz\bin to PATH
# macOS/Linux: Graphviz should be in PATH after installation
```

### Issue: "Module 'diagrams' not found"
**Solution**: Install diagrams library
```bash
pip install diagrams
```

### Issue: "Permission denied" when saving diagram
**Solution**: Ensure you have write permissions in the output directory
```bash
# Run from project root
python infrastructure/create_architecture_diagram.py
```

### Issue: Diagram looks cluttered
**Solution**: Adjust spacing in graph_attr
```python
graph_attr = {
    "nodesep": "1.5",  # Increase node separation
    "ranksep": "2.0"   # Increase rank separation
}
```

## Best Practices

### When to Update Diagrams

Update diagrams when:
- Adding new AWS services or components
- Changing network architecture
- Modifying VPC Endpoints configuration
- Adding or removing security groups
- Changing backup or monitoring strategy

### Diagram Maintenance

1. **Keep diagrams in sync with code**: Update diagrams when CDK code changes
2. **Version control**: Commit both diagram scripts and generated images
3. **Documentation**: Update ARCHITECTURE.md when diagrams change
4. **Review**: Include diagram updates in pull request reviews

### Diagram Naming Conventions

- Use descriptive filenames: `showcore_phase1_architecture.png`
- Include version or date for major changes: `showcore_architecture_v2.png`
- Use consistent naming across related diagrams
- Store diagrams in `infrastructure/` directory

## Additional Resources

- [Python diagrams library documentation](https://diagrams.mingrammer.com/)
- [Graphviz documentation](https://graphviz.org/documentation/)
- [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/)
- [ShowCore Architecture Documentation](ARCHITECTURE.md)
- [ShowCore Infrastructure README](README.md)

## Examples

### Adding a New Service

```python
# In create_architecture_diagram.py

# Add Lambda function
from diagrams.aws.compute import Lambda

with Cluster("Compute"):
    lambda_func = Lambda("Data Processor\nLambda")

# Connect to existing services
lambda_func >> Edge(label="Read") >> rds_primary
lambda_func >> Edge(label="Cache") >> redis_node
```

### Adding a New Network Flow

```python
# In create_network_flow_diagram.py

# Add new endpoint
secrets_endpoint = Endpoint("Secrets\nManager")

# Add flow
rds >> Edge(label="Credentials", color="orange") >> secrets_endpoint
```

### Changing Diagram Direction

```python
# Horizontal layout (left to right)
with Diagram("Title", direction="LR", ...):
    # diagram code

# Vertical layout (top to bottom)
with Diagram("Title", direction="TB", ...):
    # diagram code
```

## Conclusion

These architecture diagrams provide visual documentation of the ShowCore Phase 1 infrastructure. Keep them updated as the infrastructure evolves, and use them to communicate architecture decisions to stakeholders.

For questions or suggestions about the diagrams, please refer to the [ShowCore Infrastructure README](README.md).
