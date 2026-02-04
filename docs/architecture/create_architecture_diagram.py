"""
ShowCore Phase 1 AWS Architecture Diagram Generator

This script generates a comprehensive AWS architecture diagram for ShowCore Phase 1
using the Python diagrams library.

The diagram shows:
- VPC with multi-AZ subnets (public and private)
- RDS PostgreSQL and ElastiCache Redis in private subnets
- VPC Endpoints (Gateway and Interface) for cost-optimized AWS service access
- S3 buckets and CloudFront CDN
- Security, monitoring, and backup components
- NO NAT Gateway (cost optimization)

Usage:
    python create_architecture_diagram.py

Output:
    showcore_phase1_architecture.png - Architecture diagram
"""

from diagrams import Diagram, Cluster, Edge
from diagrams.aws.network import VPC, PublicSubnet, PrivateSubnet, InternetGateway, Endpoint
from diagrams.aws.database import RDS
from diagrams.aws.database import ElastiCache
from diagrams.aws.storage import S3
from diagrams.aws.network import CloudFront
from diagrams.aws.management import Cloudwatch, CloudwatchAlarm, SystemsManager
from diagrams.aws.management import Cloudtrail, Config
from diagrams.aws.integration import SNS
from diagrams.aws.storage import Backup
from diagrams.aws.security import KMS

# Diagram configuration
# Size is in inches (Graphviz uses 96 DPI by default)
# 1920x1080 at 96 DPI = 20x11.25 inches (WIDTH x HEIGHT for landscape)
graph_attr = {
    "fontsize": "16",
    "bgcolor": "white",
    "pad": "0.5",
    "splines": "ortho",
    "nodesep": "0.8",
    "ranksep": "1.0",
    "ratio": "fill",  # Fill the specified size
    "size": "20,11.25!",  # WIDTH,HEIGHT in inches (! forces exact size)
    "dpi": "96",
    "rankdir": "LR"  # Explicitly set Left-to-Right for landscape
}

node_attr = {
    "fontsize": "12",
    "height": "1.2",
    "width": "1.2"
}

edge_attr = {
    "fontsize": "10"
}

with Diagram(
    "ShowCore Phase 1 AWS Architecture\n(Cost-Optimized VPC Endpoints Architecture)",
    filename="showcore_phase1_architecture",
    direction="LR",  # Left to Right = Landscape mode
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
    show=False
):
    
    # Internet Gateway (outside VPC)
    igw = InternetGateway("Internet Gateway")
    
    # CloudFront CDN (global service)
    cdn = CloudFront("CloudFront CDN\n(PriceClass_100)")
    
    # VPC Container
    with Cluster("VPC (10.0.0.0/16)\nus-east-1"):
        
        # Availability Zone 1
        with Cluster("Availability Zone: us-east-1a"):
            with Cluster("Public Subnet\n10.0.0.0/24"):
                public_subnet_1a = PublicSubnet("Public Subnet 1a\n(Future ALB)")
            
            with Cluster("Private Subnet\n10.0.2.0/24\n(NO Internet Access)"):
                # RDS PostgreSQL
                rds_primary = RDS("RDS PostgreSQL 16\ndb.t3.micro\n(Free Tier)")
                
                # ElastiCache Redis
                redis_node = ElastiCache("ElastiCache Redis 7\ncache.t3.micro\n(Free Tier)")
        
        # Availability Zone 2
        with Cluster("Availability Zone: us-east-1b"):
            with Cluster("Public Subnet\n10.0.1.0/24"):
                public_subnet_1b = PublicSubnet("Public Subnet 1b\n(Future ALB)")
            
            with Cluster("Private Subnet\n10.0.3.0/24\n(NO Internet Access)"):
                private_subnet_1b = PrivateSubnet("Private Subnet 1b\n(Future Expansion)")
        
        # VPC Endpoints Section
        with Cluster("VPC Endpoints\n(Cost-Optimized AWS Service Access)"):
            with Cluster("Gateway Endpoints (FREE)"):
                s3_gateway = Endpoint("S3 Gateway\nEndpoint\n$0/month")
                dynamodb_gateway = Endpoint("DynamoDB Gateway\nEndpoint\n$0/month")
            
            with Cluster("Interface Endpoints (~$7/month each)"):
                cw_logs_endpoint = Endpoint("CloudWatch Logs\nInterface Endpoint")
                cw_monitoring_endpoint = Endpoint("CloudWatch\nMonitoring Endpoint")
                ssm_endpoint = Endpoint("Systems Manager\nInterface Endpoint")
    
    # S3 Buckets (outside VPC)
    with Cluster("S3 Storage"):
        s3_static = S3("Static Assets\nBucket\n(Versioned)")
        s3_backups = S3("Backups Bucket\n(Versioned)")
        s3_cloudtrail = S3("CloudTrail Logs\nBucket")
    
    # Monitoring & Security (outside VPC)
    with Cluster("Monitoring & Alerting"):
        cw_dashboard = Cloudwatch("CloudWatch\nDashboard")
        cw_alarms = CloudwatchAlarm("CloudWatch\nAlarms")
        
        with Cluster("SNS Topics"):
            sns_critical = SNS("Critical Alerts")
            sns_warning = SNS("Warning Alerts")
            sns_billing = SNS("Billing Alerts")
    
    with Cluster("Security & Compliance"):
        cloudtrail = Cloudtrail("CloudTrail\n(All Regions)")
        config = Config("AWS Config\n(Compliance)")
    
    with Cluster("Backup & DR"):
        backup_vault = Backup("AWS Backup\nVault")
    
    # Connections
    
    # Internet Gateway to Public Subnets
    igw >> Edge(label="Internet Access") >> public_subnet_1a
    igw >> Edge(label="Internet Access") >> public_subnet_1b
    
    # CloudFront to S3 Static Assets
    cdn >> Edge(label="Origin Access\nControl (OAC)") >> s3_static
    
    # RDS and ElastiCache to VPC Endpoints
    rds_primary >> Edge(label="Logs") >> cw_logs_endpoint
    rds_primary >> Edge(label="Metrics") >> cw_monitoring_endpoint
    rds_primary >> Edge(label="Backups") >> s3_gateway
    
    redis_node >> Edge(label="Logs") >> cw_logs_endpoint
    redis_node >> Edge(label="Metrics") >> cw_monitoring_endpoint
    redis_node >> Edge(label="Snapshots") >> s3_gateway
    
    # VPC Endpoints to AWS Services
    s3_gateway >> Edge(label="S3 Access") >> s3_backups
    s3_gateway >> Edge(label="S3 Access") >> s3_static
    
    cw_logs_endpoint >> Edge(label="Log Streams") >> cw_dashboard
    cw_monitoring_endpoint >> Edge(label="Metrics") >> cw_dashboard
    
    # CloudWatch Alarms to SNS
    cw_alarms >> Edge(label="Critical") >> sns_critical
    cw_alarms >> Edge(label="Warning") >> sns_warning
    cw_alarms >> Edge(label="Billing") >> sns_billing
    
    # CloudTrail to S3
    cloudtrail >> Edge(label="API Logs") >> s3_cloudtrail
    
    # AWS Backup
    backup_vault >> Edge(label="RDS Backups") >> rds_primary
    backup_vault >> Edge(label="Redis Snapshots") >> redis_node
    backup_vault >> Edge(label="Store Backups") >> s3_backups

print("✅ Architecture diagram generated: showcore_phase1_architecture.png")
print("\nKey Features:")
print("- NO NAT Gateway (saves ~$32/month)")
print("- VPC Endpoints for AWS service access")
print("- Gateway Endpoints (S3, DynamoDB): FREE")
print("- Interface Endpoints (CloudWatch, SSM): ~$7/month each")
print("- Free Tier eligible instances (db.t3.micro, cache.t3.micro)")
print("- Single-AZ deployment for cost optimization")
print("- Private subnets have NO internet access")
print("\nEstimated Monthly Cost:")
print("- During Free Tier: ~$3-10/month")
print("- After Free Tier: ~$49-60/month")
