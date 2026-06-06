"""Generate 3rike Mobility AWS architecture diagram.

Usage:
    uv run python docs/gen_diagram.py          # generates PNG + DOT
    uv run python docs/gen_diagram.py --dot    # generates only DOT source
"""

import sys, os
from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import EC2, Lambda
from diagrams.aws.database import RDS
from diagrams.aws.storage import S3
from diagrams.aws.integration import Eventbridge
from diagrams.aws.ml import Bedrock
from diagrams.aws.management import Cloudwatch, SystemsManager
from diagrams.aws.security import IAM
from diagrams.aws.general import User, Client
from diagrams.onprem.ci import GithubActions
from diagrams.generic.compute import Rack

OUTPUT = os.path.join(os.path.dirname(__file__), "3rike-architecture")

diag = Diagram(
    "3rike Mobility — AWS Architecture",
    show=False,
    filename=OUTPUT,
    direction="LR",
    graph_attr={"bgcolor": "#ffffff", "pad": "0.5", "dpi": "150"},
)

diag.__enter__()

user = User("Operator")
frontend = Client("Next.js Frontend\n(Vercel / EC2)")

with Cluster("AWS Cloud — us-east-1"):
    with Cluster("Compute"):
        backend = EC2("FastAPI Backend\nt3.micro")

    with Cluster("Data Layer"):
        rds = RDS("RDS PostgreSQL\ndb.t3.micro")
        s3 = S3("Swap Data\nBucket")

    with Cluster("AI Forecasting"):
        events = Eventbridge("EventBridge\n30-min schedule")
        forecast = Lambda("Forecast Lambda")
        bedrock = Bedrock("Claude Haiku 4.5\n(Bedrock)")
        fallback_ = Lambda("Fallback\nMoving Avg")

    with Cluster("Security & Operations"):
        iam = IAM("IAM Roles\n& Policies")
        alarms = Cloudwatch("CloudWatch\nAlarms & Logs")

    ssm = SystemsManager("SSM\nRun Command")

with Cluster("CI/CD Pipeline"):
    github = GithubActions("GitHub Actions")
    tf = Rack("Terraform IaC")

user >> Edge(label="Dashboard UI") >> frontend
frontend >> Edge(label="REST API calls") >> backend
backend >> Edge(label="SQL") >> rds
backend >> Edge(label="Read history") >> s3

events >> Edge(label="rate(30 min)") >> forecast
forecast >> Edge(label="AI forecast") >> bedrock
forecast - Edge(style="dashed", label="fallback") - fallback_
forecast >> Edge(label="Write predictions") >> rds
forecast >> Edge(label="Read swap data") >> s3
backend << Edge(label="Read predictions", style="dotted") << rds

github >> Edge(label="push → terraform apply") >> tf
tf >> Edge(color="darkgreen", label="provision") >> rds
tf >> Edge(color="darkgreen") >> s3
tf >> Edge(color="darkgreen") >> backend
tf >> Edge(color="darkgreen") >> forecast
tf >> Edge(color="darkgreen") >> events
tf >> Edge(color="darkgreen") >> iam
tf >> Edge(color="darkgreen") >> alarms

github >> Edge(label="SSM send-command", color="blue") >> ssm
ssm >> Edge(label="git pull + restart", color="blue") >> backend

backend - Edge(style="dashed", color="orange", label="metrics") - alarms
forecast - Edge(style="dashed", color="orange", label="logs") - alarms

# Save DOT source
dot_source = diag.dot.source
dot_path = OUTPUT + ".dot"
with open(dot_path, "w") as f:
    f.write(dot_source)
print(f"✓ DOT source: {dot_path}")

# Try to render PNG
try:
    diag.__exit__(None, None, None)
    print(f"✓ PNG diagram: {OUTPUT}.png")
except Exception as e:
    print(f"✗ PNG render skipped (install graphviz): {e}")
    print(f"  Render manually: dot -Tpng {dot_path} -o {OUTPUT}.png")
