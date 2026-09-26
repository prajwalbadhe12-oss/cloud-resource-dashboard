# ⚛️ Cloud Resource Management & Monitoring Dashboard — Frontend

A modern React-based frontend for the **Cloud Resource Management & Monitoring Dashboard**. The application provides a centralized interface for managing AWS resources, monitoring infrastructure, viewing alerts, checking AWS costs, and tracking operational activity.

## 📌 Project Overview

The frontend is built using **React.js** and provides the user interface for interacting with the Flask REST API.

The frontend communicates with the backend through REST APIs, while the backend handles communication with AWS services.

### 🏗️ Architecture

```text
👤 User / Browser
      ↓
⚛️ React Frontend
      ↓
🔌 REST API / JSON
      ↓
🐍 Flask Backend
      ↓
☁️ AWS Services
```

## 🛠️ Technology Stack

* ⚛️ React.js
* 📜 JavaScript
* ⚡ Vite
* 📊 Recharts
* 🎨 Lucide React
* 🎨 CSS
* 🔌 REST API / JSON

## 🚀 Features

### 📊 Dashboard

* 🖥️ View EC2 resource statistics
* 🟢 View running and stopped instance counts
* 🪣 View S3 resource information
* 💰 View AWS cost information
* 🚨 View alert status
* 📝 View recent activity

### 🖥️ EC2 Management

* 📋 View EC2 instances
* 🔍 Search instances
* 📄 View instance details
* ▶️ Start EC2 instances
* ⏹️ Stop EC2 instances

### 🪣 S3 Management

* 📋 View S3 buckets
* 🔍 Search buckets
* ➕ Create buckets
* 🗑️ Delete buckets
* 📄 View bucket details
* 📦 View objects
* 📤 Upload files
* 🗑️ Delete objects

### 📈 CloudWatch Monitoring

* 📊 Display EC2 CPU utilization
* 📈 View CPU history using charts
* 🔄 Automatically refresh monitoring information
* 🚨 Display CloudWatch alarm status

### 🚨 Alerts

* 📊 Display CloudWatch alarm information
* 📢 Display SNS notification status
* 🔥 Show high-CPU alert information

### 💰 AWS Cost

* 💵 Display current billing-period cost
* 📊 Show AWS Cost Explorer information

### 📝 Activity

* 📋 Display important dashboard operations
* 👁️ Provide operational visibility

## 🔌 Backend API

The frontend communicates with the Flask backend through REST API endpoints.

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
DELETE /api/s3/buckets/<bucket_name>
DELETE /api/s3/buckets/<bucket_name>/objects/<object_key>
```

### 📊 CloudWatch & 🚨 Alerts

```http
GET /api/cloudwatch/ec2/<instance_id>/cpu
GET /api/alerts
```

### 💰 Cost & 📝 Activity

```http
GET /api/cost
GET /api/activity-logs
```

## 📁 Project Structure

```text
frontend/
│
├── 📂 src/
├── 📂 public/
├── 📦 package.json
├── ⚙️ vite.config.js
└── 📄 README.md
```

## ⚙️ Installation

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

## ▶️ Run Development Server

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

## 📦 Production Build

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## 🐍 Backend Requirement

The frontend requires the Flask backend to be running because AWS resource information is retrieved through the backend REST API.

### 🐍 Backend

```text
http://127.0.0.1:5000
```

### ⚛️ Frontend

```text
http://localhost:5173
```

### 🔄 Communication Flow

```text
⚛️ React Frontend
       ↓
🔌 REST API Request
       ↓
🐍 Flask Backend
       ↓
🔧 Boto3
       ↓
☁️ AWS Services
       ↓
📦 JSON Response
       ↓
📊 React Dashboard
```

## 🔄 Monitoring Refresh

The dashboard refreshes relevant monitoring and operational information approximately every **30 seconds**, providing near-real-time visibility without requiring manual page reloads.

## ☁️ AWS Region

```text
🌍 ap-south-1
📍 Asia Pacific (Mumbai)
```

## 🔗 Related Project

### 🐍 Backend Implementation

```text
../backend
```

The backend is responsible for:

* 🔌 REST APIs
* 🔐 AWS authentication/authorization
* 🔧 Boto3 integration
* ☁️ AWS resource operations
* 📊 Monitoring
* 🚨 Alerts
* 💰 Cost information

## 👨‍💻 Project

**Cloud Resource Management & Monitoring Dashboard**

### 🛠️ Technologies

```text
⚛️ React • 📜 JavaScript • ⚡ Vite • 📊 Recharts • 🎨 Lucide React
```
