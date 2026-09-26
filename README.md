# ☁️ Cloud Resource Management & Monitoring Dashboard

A full-stack AWS cloud management and monitoring dashboard built using **React.js, Python Flask, Boto3, and AWS services**.

The application provides a centralized interface for managing AWS resources, monitoring EC2 instances, managing S3 storage, viewing CloudWatch metrics and alarms, receiving SNS notifications, viewing AWS costs, and tracking operational activity.

---

## 📌 Project Overview

Managing AWS resources often requires switching between multiple AWS Console services. This project provides a centralized dashboard that brings common cloud management and monitoring operations into a single application.

### 🔄 Application Architecture

```text
User / Browser
      │
      ▼
React Frontend
      │
      │ REST API / JSON
      ▼
Flask Backend
      │
      │ Boto3
      ▼
┌───────────────────────────────────────────┐
│              AWS Services                 │
│                                           │
│  EC2 │ S3 │ CloudWatch │ SNS │ Cost       │
│                              Explorer │ IAM│
└───────────────────────────────────────────┘
```

The React frontend provides the user interface, Flask provides the REST API and application logic, and Boto3 communicates with AWS services.

---

## 🎯 Project Objective

The main objective is to build a centralized dashboard that reduces the need to navigate between separate AWS Console pages for common operational tasks.

The dashboard combines:

* ☁️ AWS resource management
* 📊 Infrastructure monitoring
* 🚨 CloudWatch alarms
* 📧 SNS email notifications
* 💰 AWS cost visibility
* 📝 Activity tracking
* 🔌 REST API integration

---

## 🏗️ Architecture

```text
                         👤 USER
                           │
                           ▼
                  ┌─────────────────┐
                  │ ⚛️ React        │
                  │    Frontend     │
                  │    Dashboard    │
                  └────────┬────────┘
                           │
                      REST API / JSON
                           │
                           ▼
                  ┌─────────────────┐
                  │ 🐍 Flask        │
                  │    Backend      │
                  │    REST API     │
                  └────────┬────────┘
                           │
                         Boto3
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
       ┌──────┐         ┌──────┐      ┌───────────┐
       │ ☁️ EC2│         │ 🪣 S3 │      │ 📊 CloudWatch│
       └──────┘         └──────┘      └─────┬─────┘
                                             │
                                             ▼
                                          ┌─────┐
                                          │ 📢 SNS │
                                          └──┬──┘
                                             │
                                             ▼
                                       📧 Email Alert

                           ┌──────────────────┐
                           │ 💰 Cost Explorer │
                           └──────────────────┘

                           ┌──────────────────┐
                           │ 🔐 IAM           │
                           │   Authorization  │
                           └──────────────────┘
```

The architecture separates the presentation layer, application/API layer, and AWS service integration layer.

---

## ☁️ AWS Services Used

| AWS Service              | Purpose                                    |
| ------------------------ | ------------------------------------------ |
| ☁️ **Amazon EC2**        | Compute resource management and monitoring |
| 🪣 **Amazon S3**         | Bucket and object management               |
| 📊 **Amazon CloudWatch** | CPU metrics and alarm monitoring           |
| 📢 **Amazon SNS**        | Email notifications                        |
| 💰 **AWS Cost Explorer** | AWS cost visibility                        |
| 🔐 **AWS IAM**           | Authorization and AWS permissions          |

### 🌍 AWS Region

```text
Region: ap-south-1
Name: Asia Pacific (Mumbai)
```

---

## 🚀 Application Features

### 📊 1. Dashboard

The main dashboard provides an overview of:

* EC2 totals
* Running and stopped instances
* S3 information
* AWS Cost — Month to Date
* Alert status
* Recent activity
* Quick navigation

---

### 🖥️ 2. EC2 Management

The application allows users to:

* View EC2 instances
* Search instances
* View instance details
* View instance type
* View availability zone
* ▶️ Start EC2 instances
* ⏹️ Stop EC2 instances

#### Workflow

```text
React Dashboard
      ↓
Flask /api/ec2/*
      ↓
Boto3 EC2 Client
      ↓
Amazon EC2
```

---

### 🪣 3. S3 Management

The application provides:

* List S3 buckets
* Search buckets
* Create buckets
* Delete buckets
* View bucket details
* View objects
* Upload files
* Delete objects

#### Workflow

```text
React Dashboard
      ↓
Flask /api/s3/*
      ↓
Boto3 S3 Client
      ↓
Amazon S3
```

---

### 📈 4. CloudWatch Monitoring

The monitoring module provides:

* EC2 CPU utilization
* CPU history
* Monitoring charts
* Automatic monitoring refresh
* CloudWatch alarm status

```text
EC2 Instance
      ↓
CloudWatch Metrics
      ↓
Flask + Boto3
      ↓
React Monitoring Dashboard
      ↓
📈 CPU Chart
```

---

### 🚨 5. CloudWatch Alarm → SNS Email

The project includes an end-to-end monitoring workflow:

```text
🖥️ EC2 CPU Load
        ↓
📈 CPU Utilization ≥ 80%
        ↓
🚨 CloudWatch Alarm
        ↓
🔴 IN ALARM
        ↓
📢 SNS Topic
        ↓
📧 Email Notification
        ↓
🖥️ Dashboard Alert Status
```

### Alarm Configuration

* **Metric:** CPUUtilization
* **Statistic:** Average
* **Period:** 5 minutes
* **Threshold:** 80%
* **Evaluation Periods:** 1

The workflow was tested by generating CPU load on the EC2 instance and confirming receipt of the SNS email notification.

---

### 💰 6. AWS Cost Explorer

The dashboard retrieves current billing-period cost information through AWS Cost Explorer.

```text
React Dashboard
      ↓
Flask /api/cost
      ↓
Boto3 Cost Explorer
      ↓
AWS Billing Data
      ↓
💰 AWS Cost — Month to Date
```

---

### 📝 7. Activity Tracking

The application provides activity information for important dashboard operations.

```http
GET /api/activity-logs
```

This provides operational visibility within the dashboard.

---

## 🔌 REST API

### ❤️ Health

```http
GET /api/health
```

### 🖥️ EC2

```http
GET  /api/ec2/instances
POST /api/ec2/<instance_id>/start
POST /api/ec2/<instance_id>/stop
GET  /api/ec2/<instance_id>/details
```

### 🪣 S3

```http
GET    /api/s3/buckets
GET    /api/s3/buckets/<bucket_name>/objects
GET    /api/s3/buckets/<bucket_name>/details
POST   /api/s3/buckets
POST   /api/s3/buckets/<bucket_name>/upload
DELETE /api/s3/buckets/<bucket_name>/objects/<object_key>
DELETE /api/s3/buckets/<bucket_name>
```

### 📊 CloudWatch & 🚨 Alerts

```http
GET /api/cloudwatch/ec2/<instance_id>/cpu
GET /api/alerts
```

### 💰 Cost

```http
GET /api/cost
```

### 📝 Activity

```http
GET /api/activity-logs
```

---

## 🛠️ Technology Stack

| Layer             | Technology     |
| ----------------- | -------------- |
| ⚛️ Frontend       | React.js       |
| 📜 Language       | JavaScript     |
| ⚡ Build Tool      | Vite           |
| 📊 Charts         | Recharts       |
| 🎨 Icons          | Lucide React   |
| 🐍 Backend        | Python         |
| 🌐 API Framework  | Flask          |
| 🔗 CORS           | Flask-CORS     |
| ☁️ AWS SDK        | Boto3          |
| ☁️ Cloud          | AWS            |
| 📦 Source Control | Git / GitHub   |
| 🔄 CI/CD          | GitHub Actions |

---

## 📁 Project Structure

```text
cloud-resource-dashboard/
│
├── 📂 frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
├── 📂 backend/
│   ├── app.py
│   ├── requirements.txt
│   └── README.md
│
├── 📂 architecture/
│   └── architecture.png
│
├── 📂 screenshots/
│   ├── 01-dashboard.png
│   ├── 02-ec2-management.png
│   ├── 03-s3-management.png
│   ├── 04-s3-details-upload.png
│   ├── 05-monitoring-cpu.png
│   ├── 06-cloudwatch-alarm.png
│   ├── 07-sns-email-alert.png
│   ├── 08-aws-cost.png
│   ├── 09-aws-console-configuration.png
│   └── 10-github-actions.png
│
├── 📄 .gitignore
└── 📄 README.md
```

---

## 💻 Local Development

### 🐍 Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

### Windows PowerShell

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
python app.py
```

Backend URL:

```text
http://127.0.0.1:5000
```

---

### ⚛️ Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## ❤️ Backend Health Check

After starting the Flask backend, open:

```text
http://127.0.0.1:5000/api/health
```

Expected response:

```json
{
  "status": "success",
  "message": "Cloud Resource Dashboard API is running"
}
```

---

## 🔐 Security

The project follows basic AWS security practices.

### 🔑 IAM

AWS operations are controlled using IAM permissions.

### 🔒 Credentials

AWS credentials should **never be hard-coded** in source code.

Development can use:

* AWS CLI credentials
* Environment configuration

Production should preferably use:

* IAM Roles
* Short-lived credentials
* Least-privilege permissions

### 🌐 CORS

CORS should be restricted to trusted frontend origins in a production deployment.

### 🛡️ Sensitive Configuration

Sensitive configuration should remain outside source control.

---

## ⚠️ Failure Handling

The application includes error handling between AWS operations, the Flask backend, and the React frontend.

```text
☁️ AWS Operation
       ↓
❌ Failure
       ↓
🐍 Flask Error Handling
       ↓
📦 JSON Error Response
       ↓
⚛️ React Error State
       ↓
🔔 User Notification
```

Examples include:

* EC2 operation failures
* S3 upload failures
* CloudWatch retrieval failures
* Cost Explorer failures

The frontend displays appropriate error states instead of allowing the complete dashboard to fail.

---

## 🔄 Auto Refresh

The dashboard refreshes relevant monitoring and operational information approximately every **30 seconds**.

This provides near-real-time visibility without requiring users to manually reload the page.

---

## 🧪 Testing & Validation

### 🖥️ EC2

* Retrieve instances
* Start instances
* Stop instances
* Inspect instance details

### 🪣 S3

* List buckets
* Create buckets
* Upload objects
* Inspect resources
* Delete objects/resources

### 📊 CloudWatch

* Retrieve CPU metrics
* Display monitoring information
* Check alarm information

### 📢 SNS

* Trigger a high-CPU condition
* Confirm CloudWatch alarm transition
* Confirm SNS email notification

### 💰 Cost Explorer

* Retrieve billing-period information
* Display returned cost

### ⚛️ Frontend

* Dashboard cards
* Tables
* Charts
* Loading states
* Error states

### 🐍 Backend

* Health endpoint
* AWS resource API responses

---

## 📸 Screenshots & Evidence

The repository should contain screenshots demonstrating the working project.

| Screenshot                            | Purpose                              |
| ------------------------------------- | ------------------------------------ |
| 📊 `01-dashboard.png`                 | Main React dashboard                 |
| 🖥️ `02-ec2-management.png`           | EC2 instances and actions            |
| 🪣 `03-s3-management.png`             | S3 buckets and controls              |
| 📤 `04-s3-details-upload.png`         | S3 details and object upload         |
| 📈 `05-monitoring-cpu.png`            | CloudWatch CPU monitoring            |
| 🚨 `06-cloudwatch-alarm.png`          | CloudWatch alarm configuration/state |
| 📧 `07-sns-email-alert.png`           | SNS email notification               |
| 💰 `08-aws-cost.png`                  | AWS Cost Explorer information        |
| ☁️ `09-aws-console-configuration.png` | AWS configuration                    |
| 🔄 `10-github-actions.png`            | CI/CD workflow                       |

---

## 🖼️ Architecture Diagram

Store the architecture diagram at:

```text
architecture/architecture.png
```

The diagram should show:

```text
👤 User
   ↓
⚛️ React Frontend
   ↓
🐍 Flask REST API
   ↓
🔧 Boto3
   ↓
☁️ AWS Services
```

---

## 🔄 CI/CD

GitHub Actions is used as the project's CI/CD automation layer.

```text
👨‍💻 Developer
      ↓
🐙 GitHub Repository
      ↓
⚙️ GitHub Actions
      │
      ├── 📦 Install Dependencies
      ├── 🧪 Run Tests
      ├── ✅ Validate Backend
      └── 🏗️ Build Frontend
      ↓
🚀 Deployment / Release
```

---

## 🎤 Project Demonstration

During the project demonstration, explain the following:

### 1️⃣ Problem

Explain why managing compute, storage, monitoring, alerts, and cost through separate AWS services can require additional operational effort.

### 2️⃣ Architecture

Explain:

```text
⚛️ React → 🐍 Flask → 🔧 Boto3 → ☁️ AWS
```

### 3️⃣ Dashboard

Show the main dashboard and explain the resource cards.

### 4️⃣ EC2

Show EC2 instances and demonstrate lifecycle operations.

### 5️⃣ S3

Show buckets, objects, upload and deletion operations.

### 6️⃣ CloudWatch

Show CPU monitoring and explain the monitoring chart.

### 7️⃣ CloudWatch → SNS

Explain how high CPU utilization triggers the CloudWatch alarm and SNS email notification.

### 8️⃣ AWS Cost

Show the Cost Explorer information displayed in the dashboard.

### 9️⃣ Security

Explain IAM permissions, credentials, CORS and least-privilege access.

### 🔟 Failure Handling

Explain how AWS failures are converted into backend error responses and displayed as frontend error states.

---

## 🚀 Production Improvements

| Area                | Possible Improvement                       |
| ------------------- | ------------------------------------------ |
| 🔐 Authentication   | Amazon Cognito and session management      |
| 👥 Authorization    | Role-based access control                  |
| 🚢 Deployment       | ECS/Fargate or another managed platform    |
| 🌐 Frontend Hosting | S3 + CloudFront + HTTPS                    |
| 🛡️ Security        | Secrets Manager, WAF, private networking   |
| 📊 Observability    | CloudWatch Logs, dashboards and tracing    |
| 🔎 Audit            | AWS CloudTrail integration                 |
| 📈 Scalability      | Load balancing and Auto Scaling            |
| 🏗️ Infrastructure  | Terraform or AWS CloudFormation            |
| ☁️ AWS Coverage     | RDS, Load Balancer, ECR and ECS monitoring |
| ⚡ Real-Time UX      | WebSockets or event-driven updates         |

---

## 📚 Learning Outcomes

This project demonstrates practical experience with:

* ☁️ AWS resource management using Boto3
* 🌐 REST API development using Flask
* ⚛️ React dashboard development
* 🖥️ EC2 lifecycle management
* 🪣 S3 bucket and object operations
* 📊 CloudWatch metrics and alarms
* 📢 SNS event-driven notifications
* 💰 AWS Cost Explorer
* 🔐 IAM and least-privilege concepts
* ⚠️ Error handling
* 📝 Operational visibility
* 🐙 GitHub source control
* 🔄 GitHub Actions CI/CD
* 🏗️ Cloud architecture design

---

## 📋 Project Submission Checklist

Before submitting the project, verify:

* [ ] 💻 Complete source code
* [ ] 📄 Root `README.md`
* [ ] 📄 Frontend `README.md`
* [ ] 📄 Backend `README.md`
* [ ] 📄 `.gitignore`
* [ ] 🏗️ Architecture diagram
* [ ] 📊 Running application screenshot
* [ ] ☁️ AWS Console configuration screenshot
* [ ] 🖥️ EC2 screenshot
* [ ] 🪣 S3 screenshot
* [ ] 📈 CloudWatch monitoring screenshot
* [ ] 🚨 CloudWatch alarm screenshot
* [ ] 📧 SNS email notification screenshot
* [ ] 💰 AWS Cost screenshot
* [ ] 🔄 GitHub Actions screenshot
* [ ] 🧪 Testing evidence
* [ ] 🔐 Security explanation
* [ ] ⚠️ Failure-handling explanation
* [ ] 🚀 Production improvement discussion

---

## 👨‍💻 Project Information

**Project:** Cloud Resource Management & Monitoring Dashboard

**Architecture:**

```text
⚛️ React Frontend
        ↓
🐍 Flask REST API
        ↓
🔧 Boto3
        ↓
☁️ AWS Services
```

**AWS Region:**

```text
ap-south-1 — Asia Pacific (Mumbai)
```

**Technologies:**

```text
⚛️ React
📜 JavaScript
⚡ Vite
🐍 Python
🌐 Flask
🔧 Boto3
☁️ AWS
🐙 GitHub
🔄 GitHub Actions
```

---

## 📄 License

This project is developed for **educational and project demonstration purposes**.
