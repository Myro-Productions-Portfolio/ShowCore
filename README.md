# ShowCore: On-Premises to AWS Cloud Migration

## Mission Statement

This repository documents the complete journey of migrating a web application from traditional on-premises hosting to a modern, scalable AWS cloud infrastructure.

**Purpose**: To demonstrate practical AWS service integration, cloud architecture decisions, infrastructure-as-code practices, and real-world migration strategies as I build expertise in cloud engineering and solutions architecture.

This is a living portfolio project that will evolve from a simple lift-and-shift migration to a full-scale enterprise cloud application, showcasing progressive learning and implementation of AWS best practices.

---

## Project Background

### Internal Project Memo

**From**: Nicolas Myers <pmnicolasm@gmail.com>
**To**: Project Development Team
**Date**: February 3, 2026
**Subject**: ShowCore Platform - AWS Migration Initiative

> Team,
>
> I'm initiating a new portfolio project to demonstrate practical AWS migration strategies and cloud-native architecture patterns. This project will serve dual purposes: building a production-ready application while documenting the entire cloud migration journey for my AWS Solutions Architect certification path.
>
> **Current State**:
> - Traditional VPS hosting with manual deployments
> - PostgreSQL and Redis running on a single server
> - Docker Compose orchestration
> - No auto-scaling or high availability
>
> **The Challenge**:
> We're going to migrate this application to AWS, treating it as if it were a real client engagement. I'll document every decision, every service choice, and every lesson learned along the way. This isn't just about moving infrastructure - it's about understanding *why* we choose each AWS service and *how* they work together.
>
> **Goals**:
> - Build production-grade AWS infrastructure
> - Implement proper monitoring, scaling, and disaster recovery
> - Document the learning process for others
> - Create a portfolio piece that demonstrates real-world cloud architecture
>
> Let's build something that showcases not just the destination, but the journey of learning AWS.
>
> - Nicolas

---

## Current State Assessment

### Existing Infrastructure (On-Premises)

**Application Stack:**
- Frontend: React 18 + TypeScript + Tailwind CSS v4
- Backend: Hono (HTTP framework) + tRPC (Type-safe RPC)
- Database: PostgreSQL + Prisma ORM
- Cache: Redis (session management, rate limiting)
- Deployment: Docker Compose on single VPS

**Pain Points:**
- Manual deployment process
- No horizontal scaling capability
- Single point of failure (one server)
- Limited monitoring and observability
- Manual SSL certificate management
- No disaster recovery plan
- Database backups are manual

**What Works:**
- Clean, modern codebase
- Type-safe API layer (tRPC)
- Well-structured React components
- Dockerized for portability

---

## Application Preview

### Current On-Premises Application

Below are screenshots of the application in its current state before AWS migration. These serve as a baseline for comparing performance, scalability, and functionality improvements throughout the migration process.

#### Authentication
Modern authentication interface with multiple login methods including email/password, magic links, and OAuth providers (Google, Apple, Microsoft).

![Login Page](docs/images/login-page.png)

#### Dashboard
Main dashboard showing welcome screen, setup progress, activity feed, and quick navigation to key features. Demonstrates the application's clean UI and user-friendly design.

![Dashboard](docs/images/dashboard.png)

#### Settings & Configuration
Comprehensive settings interface allowing users to manage account preferences, security settings, and application configuration. Shows the depth of functionality built into the platform.

![Settings Page](docs/images/settings.png)

---

## Migration Goals & Success Criteria

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Establish AWS account structure and deploy basic infrastructure

- [ ] AWS account setup (IAM, Organizations, billing alerts)
- [ ] VPC design and subnet architecture
- [ ] RDS PostgreSQL instance (replace on-prem DB)
- [ ] ElastiCache Redis cluster
- [ ] S3 buckets for static assets and backups
- [ ] CloudFront CDN setup

**Success Criteria**: Database migrated, Redis operational, static assets on CDN

### Phase 2: Application Deployment (Weeks 3-4)
**Goal**: Get the application running on AWS

- [ ] ECS/Fargate for container orchestration (or EC2 with Auto Scaling)
- [ ] Application Load Balancer (ALB)
- [ ] Route 53 DNS management
- [ ] ACM SSL certificates (automated renewal)
- [ ] Initial monitoring with CloudWatch

**Success Criteria**: Application accessible via custom domain with HTTPS

### Phase 3: CI/CD & Automation (Weeks 5-6)
**Goal**: Eliminate manual deployments

- [ ] GitHub Actions or AWS CodePipeline
- [ ] Automated testing pipeline
- [ ] Blue/green or rolling deployments
- [ ] Infrastructure as Code (Terraform or CloudFormation)
- [ ] Automated database backups (RDS snapshots)

**Success Criteria**: Push to main = automatic deployment, zero-downtime updates

### Phase 4: Observability & Scaling (Weeks 7-8)
**Goal**: Production-grade monitoring and auto-scaling

- [ ] CloudWatch Logs aggregation
- [ ] CloudWatch Dashboards
- [ ] SNS alerting (email, SMS, Slack)
- [ ] Auto Scaling policies based on metrics
- [ ] Cost monitoring and optimization

**Success Criteria**: Full visibility into application health, automatic scaling during traffic spikes

### Phase 5: Advanced AWS Services (Future)
**Goal**: Evolve into a cloud-native application

- [ ] Lambda functions for async tasks
- [ ] SQS/SNS for event-driven architecture
- [ ] DynamoDB for high-performance data
- [ ] API Gateway for advanced routing
- [ ] Cognito for user authentication
- [ ] OpenSearch for full-text search
- [ ] Multi-region disaster recovery

---

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: TanStack Query (React Query)
- **Design System**: Custom (Amber/Yellow primary, Zinc neutral)
- **Typography**: DM Sans, IBM Plex Mono

### Backend
- **HTTP Server**: Hono (edge-ready, AWS Lambda compatible)
- **API Layer**: tRPC (type-safe, reduces AWS API Gateway complexity)
- **ORM**: Prisma (migrations, type-safe queries)
- **Authentication**: JWT (future: AWS Cognito)

### AWS Services (Planned)
- **Compute**: ECS Fargate (containerized workloads)
- **Database**: RDS PostgreSQL (Multi-AZ for HA)
- **Cache**: ElastiCache Redis
- **Storage**: S3 (static assets, backups)
- **CDN**: CloudFront
- **DNS**: Route 53
- **Certificates**: AWS Certificate Manager (ACM)
- **Monitoring**: CloudWatch, X-Ray
- **CI/CD**: CodePipeline + CodeBuild (or GitHub Actions)
- **IaC**: Terraform (infrastructure as code)

---

## Repository Structure

```
ShowCore/
├── apps/                    # Frontend React application
├── backend/                 # Hono + tRPC backend
├── sections/                # Feature modules
├── design-system/           # UI components and tokens
├── data-model/              # TypeScript types and Prisma schema
├── shell/                   # Application layout and routing
├── infrastructure/          # (Coming soon) Terraform/CloudFormation
├── .github/workflows/       # (Coming soon) CI/CD pipelines
├── docker-compose.yml       # Local development environment
├── package.json             # Node.js dependencies
└── README.md                # This file
```

---

## Local Development

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Myro-Productions-Portfolio/ShowCore.git
cd ShowCore

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start local services (PostgreSQL + Redis)
docker-compose up -d

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

---

## Learning Resources & Documentation

As this migration progresses, I'll be documenting:
- Architecture decision records (ADRs)
- Cost analysis and optimization strategies
- Security best practices implemented
- Performance benchmarks (on-prem vs AWS)
- Lessons learned and gotchas

**Certifications:**
- AWS Certified Cloud Practitioner (Passed January 2026)
- AWS Certified Solutions Architect Associate (In Progress)

---

## Project Timeline

- **Start Date**: February 3, 2026
- **Phase 1 Target**: February 17, 2026
- **Production Migration**: TBD (dependent on Phase 1-3 completion)

---

## About This Project

This is a portfolio project created by Nicolas Myers to demonstrate AWS cloud migration expertise and solutions architecture capabilities. The application serves as a practical learning platform for implementing production-grade AWS infrastructure, CI/CD pipelines, and cloud-native architecture patterns.

**Contact:**
- **GitHub**: [@Myro-Productions-Portfolio](https://github.com/Myro-Productions-Portfolio)
- **Email**: pmnicolasm@gmail.com

This project is open for feedback, suggestions, and collaboration. If you're also learning AWS or have experience with cloud migrations, feel free to open an issue or PR with recommendations.

---

## Legal & Disclaimer

This is an independent portfolio project created for educational and demonstration purposes. All code, architecture decisions, and documentation are original work created to showcase cloud engineering capabilities.

---

*This README will be updated regularly as the migration progresses. Check the commit history to see the evolution of this project from on-premises to cloud-native.*
