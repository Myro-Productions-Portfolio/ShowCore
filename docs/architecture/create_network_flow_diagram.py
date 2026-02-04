"""
ShowCore Phase 1 Network Flow Diagram Generator

This script generates a simplified network flow diagram focusing on:
- VPC Endpoints architecture (Gateway vs Interface)
- Cost optimization (NO NAT Gateway)
- Network traffic flows
- Security boundaries

Usage:
    python create_network_flow_diagram.py

Output:
    showcore_network_flow.png - Network flow diagram
"""

from diagrams import Diagram, Cluster, Edge
from diagrams.aws.network import VPC, PublicSubnet, PrivateSubnet, InternetGateway, Endpoint, RouteTable
from diagrams.aws.database import RDS, ElastiCache
from diagrams.aws.storage import S3
from diagrams.aws.management import Cloudwatch
from diagrams.aws.compute import EC2

# Diagram configuration
# Size is in inches (Graphviz uses 96 DPI by default)
# 1920x1080 at 96 DPI = 20x11.25 inches (WIDTH x HEIGHT for landscape)
graph_attr = {
    "fontsize": "16",
    "bgcolor": "white",
    "pad": "0.5",
    "splines": "spline",
    "nodesep": "1.0",
    "ranksep": "1.5",
    "ratio": "fill",  # Fill the specified size
    "size": "20,11.25!",  # WIDTH,HEIGHT in inches (! forces exact size)
    "dpi": "96",
    "rankdir": "LR"  # Explicitly set Left-to-Right for landscape
}

node_attr = {
    "fontsize": "11",
    "height": "1.0",
    "width": "1.0"
}

with Diagram(
    "ShowCore Network Flow & Cost Optimization\n(VPC Endpoints Architecture - NO NAT Gateway)",
    filename="showcore_network_flow",
    direction="LR",
    graph_attr=graph_attr,
    node_attr=node_attr,
    show=False
):
    
    # Internet
    internet = InternetGateway("Internet\nGateway")
    
    # VPC
    with Cluster("VPC (10.0.0.0/16)"):
        
        # Public Subnet
        with Cluster("Public Subnet\n10.0.0.0/24\n(Future ALB)"):
            public_rt = RouteTable("Public Route Table\n0.0.0.0/0 → IGW")
            future_alb = EC2("Future\nApplication\nLoad Balancer")
        
        # Private Subnet
        with Cluster("Private Subnet\n10.0.2.0/24\n(NO Internet Access)"):
            private_rt = RouteTable("Private Route Table\nNO Default Route\nOnly VPC Endpoints")
            
            with Cluster("Data Layer"):
                rds = RDS("RDS\nPostgreSQL")
                redis = ElastiCache("ElastiCache\nRedis")
        
        # VPC Endpoints
        with Cluster("VPC Endpoints\n(Cost-Optimized)"):
            with Cluster("Gateway Endpoints\n(FREE - $0/month)"):
                s3_gw = Endpoint("S3\nGateway")
                dynamodb_gw = Endpoint("DynamoDB\nGateway")
            
            with Cluster("Interface Endpoints\n(~$7/month each)"):
                cw_logs = Endpoint("CloudWatch\nLogs")
                cw_mon = Endpoint("CloudWatch\nMonitoring")
    
    # AWS Services (outside VPC)
    with Cluster("AWS Services"):
        s3_service = S3("S3\nService")
        cw_service = Cloudwatch("CloudWatch\nService")
    
    # Cost Comparison Box
    with Cluster("Cost Comparison"):
        nat_cost = EC2("NAT Gateway\n~$32/month\n❌ NOT USED")
        vpc_cost = Endpoint("VPC Endpoints\n~$21/month\n✅ USED\n\nSavings: ~$11/month")
    
    # Network Flows
    
    # Public subnet to internet
    internet >> Edge(label="Internet\nAccess", color="green") >> public_rt
    public_rt >> future_alb
    
    # Private subnet - NO internet access
    private_rt - Edge(label="❌ NO Route", color="red", style="dashed") - internet
    
    # Private subnet to Gateway Endpoints (FREE)
    private_rt >> Edge(label="FREE\nS3 Access", color="blue") >> s3_gw
    private_rt >> Edge(label="FREE\nDynamoDB", color="blue") >> dynamodb_gw
    
    # Private subnet to Interface Endpoints (~$7/month each)
    private_rt >> Edge(label="~$7/month\nLogs", color="orange") >> cw_logs
    private_rt >> Edge(label="~$7/month\nMetrics", color="orange") >> cw_mon
    
    # Data layer to VPC Endpoints
    rds >> Edge(label="Backups") >> s3_gw
    rds >> Edge(label="Logs") >> cw_logs
    rds >> Edge(label="Metrics") >> cw_mon
    
    redis >> Edge(label="Snapshots") >> s3_gw
    redis >> Edge(label="Logs") >> cw_logs
    redis >> Edge(label="Metrics") >> cw_mon
    
    # VPC Endpoints to AWS Services
    s3_gw >> Edge(label="Private\nConnection", color="blue") >> s3_service
    cw_logs >> Edge(label="Private\nConnection", color="orange") >> cw_service
    cw_mon >> Edge(label="Private\nConnection", color="orange") >> cw_service

print("✅ Network flow diagram generated: showcore_network_flow.png")
print("\nKey Network Design:")
print("- Public subnets: Internet access via Internet Gateway")
print("- Private subnets: NO internet access (no NAT Gateway)")
print("- Gateway Endpoints: FREE S3 and DynamoDB access")
print("- Interface Endpoints: ~$7/month each for CloudWatch and SSM")
print("- Cost savings: ~$11/month vs NAT Gateway architecture")
