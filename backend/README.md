# 🐍 Cloud Resource Management & Monitoring Dashboard — Backend

A Python Flask REST API that provides AWS resource management, monitoring, alerting, cost information, and activity tracking for the Cloud Resource Management & Monitoring Dashboard.

---

## 📌 Project Overview

The backend acts as the application layer between the React frontend and AWS services.

```text
⚛️ React Frontend
        ↓
🌐 Flask REST API
        ↓
🔧 Boto3
        ↓
☁️ AWS Services
```

The Flask backend handles requests from the frontend and uses **Boto3** to communicate with AWS services.

---

## 🛠️ Technology Stack

* 🐍 Python
* 🌐 Flask
* 🔗 Flask-CORS
* 🔧 Boto3
* 🖥️ Amazon EC2
* 🪣 Amazon S3
* 📊 Amazon CloudWatch
* 📢 Amazon SNS
* 💰 AWS Cost Explorer
* 🔐 AWS IAM

---

## ☁️ AWS Services

| AWS Service              | Purpose                                    |
| ------------------------ | ------------------------------------------ |
| 🖥️ **Amazon EC2**       | Compute resource management and monitoring |
| 🪣 **Amazon S3**         | Bucket and object management               |
| 📊 **Amazon CloudWatch** | CPU metrics and alarm monitoring           |
| 📢 **Amazon SNS**        | Email notifications                        |
| 💰 **AWS Cost Explorer** | Cost information                           |
| 🔐 **AWS IAM**           | AWS permissions and authorization          |

---

## 🚀 Features

### 🖥️ EC2 Management

The backend provides APIs to:

* 🔍 Retrieve EC2 instances
* 🔎 Inspect instance information
* ▶️ Start instances
* ⏹️ Stop instances
* 📋 Retrieve instance details
* 🌐 Retrieve instance type and availability zone information

---

### 🪣 S3 Management

The backend provides APIs to:

* 📋 List S3 buckets
* ➕ Create buckets
* 🗑️ Delete buckets
* 📄 View bucket details
* 📦 List objects
* 📤 Upload files
* 🗑️ Delete objects

---

### 📊 CloudWatch Monitoring

The backend retrieves EC2 CPU utilization data from Amazon CloudWatch and provides the monitoring information to the React frontend.

It also provides CloudWatch alarm information for the dashboard.

---

### 🚨 SNS Notifications

CloudWatch alarms can trigger an SNS notification when the configured CPU threshold is reached.

#### 🔄 Alert Workflow

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

The documented alarm configuration uses:

* **CPU threshold:** 80%
* **Period:** 5 minutes
* **Evaluation periods:** 1

---

### 💰 AWS Cost Explorer

The backend provides billing-period cost information through the AWS Cost Explorer API.

#### 🔌 Endpoint

```http
GET /api/cost
```

---

### 📝 Activity Logging

The backend provides activity information to the dashboard through:

```http
GET /api/activity-logs
```

---

## 🔌 REST API

### ❤️ Health

```http
GET /api/health
```

---

### 🖥️ EC2

```http
GET  /api/ec2/instances
POST /api/ec2/<instance_id>/start
POST /api/ec2/<instance_id>/stop
GET  /api/ec2/<instance_id>/details
```

---

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

---

### 📊 CloudWatch & 🚨 Alerts

```http
GET /api/cloudwatch/ec2/<instance_id>/cpu
GET /api/alerts
```

---

### 💰 Cost

```http
GET /api/cost
```

---

### 📝 Activity

```http
GET /api/activity-logs
```

---

## 📁 Project Structure

```text
backend/
│
├── 🐍 app.py
├── 📦 requirements.txt
└── 📄 README.md
```

---

## ⚙️ Installation

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## ▶️ Run Backend

Start the Flask application:

```bash
python app.py
```

Backend URL:

```text
http://127.0.0.1:5000
```

---

## ❤️ Health Check

Open:

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

## ☁️ AWS Configuration

### 🌍 AWS Region

```text
ap-south-1
```

### 📍 Region Name

```text
Asia Pacific (Mumbai)
```

### ☁️ AWS Services Used

```text
🖥️ EC2
🪣 S3
📊 CloudWatch
📢 SNS
💰 Cost Explorer
🔐 IAM
```

---

## 🔐 AWS Credentials & Security

AWS credentials should **never be hard-coded** in the source code.

### 💻 Development

Development can use:

* 🔑 AWS CLI credentials
* ⚙️ Environment configuration

### 🚀 Production

Production should preferably use:

* 🔐 IAM Roles
* 🔄 Short-lived credentials
* 🛡️ Least-privilege IAM permissions

Sensitive configuration should remain outside source control.

CORS should also be restricted to trusted frontend origins in a production environment.

---

## ⚠️ Error Handling

The backend returns appropriate error responses when AWS operations fail.

Examples include:

* 🖥️ EC2 operation failures
* 🪣 S3 upload failures
* 📊 CloudWatch retrieval failures
* 💰 Cost Explorer failures

The React frontend can then display appropriate loading, success, or error states to users.

---

## 🔗 Frontend Integration

The React frontend communicates with the Flask backend using REST APIs.

```text
⚛️ React
    ↓
📡 HTTP Request
    ↓
🌐 Flask API
    ↓
🔧 Boto3
    ↓
☁️ AWS
    ↓
📦 Flask JSON Response
    ↓
📊 React Dashboard
```

This separation keeps the frontend responsible for the user interface while the backend handles API logic and AWS communication.

---

## 🛠️ Development

The backend is designed as the application and API layer of the Cloud Resource Management & Monitoring Dashboard.

Its main responsibilities are:

* Receiving frontend API requests
* Communicating with AWS through Boto3
* Processing AWS responses
* Returning JSON responses
* Handling AWS-related errors
* Providing monitoring and cost information
* Supporting EC2 and S3 operations

---

## 🚀 Future Production Improvements

Possible future production improvements include:

* 🔐 Authentication
* 👥 Role-based access control
* 📝 Centralized logging
* 🔄 Retry mechanisms
* ❤️ Advanced health checks
* 🔒 HTTPS
* 🔑 AWS Secrets Manager
* 📊 CloudWatch Logs
* 🔎 AWS CloudTrail integration
* 🏗️ Infrastructure as Code
* 📦 Containerized deployment
* ⚡ Improved scalability and observability

These are **future production improvements** and are not required for the current local development setup.

---

## 👨‍💻 Project

**Cloud Resource Management & Monitoring Dashboard**

### 🛠️ Technologies

```text
🐍 Python
🌐 Flask
🔗 Flask-CORS
🔧 Boto3
☁️ AWS
```

### 🌍 AWS Region

```text
ap-south-1 — Asia Pacific (Mumbai)
```

---

## 📄 Purpose

This backend is developed as part of an educational cloud management and monitoring project demonstrating integration between a modern web application and AWS services.
