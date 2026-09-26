# ⚛️ Cloud Resource Management & Monitoring Dashboard — Frontend

A modern React-based frontend for the **Cloud Resource Management & Monitoring Dashboard**.

The application provides a centralized interface for managing AWS resources, monitoring infrastructure, viewing alerts, checking AWS costs, and tracking operational activity.

---

## 📌 Project Overview

The frontend is built using **React.js** and provides the user interface for interacting with the Flask REST API.

The frontend communicates with the backend through REST APIs, while the backend handles AWS service communication using Boto3.

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
🔧 Boto3
        ↓
☁️ AWS Services
```

---

## 🛠️ Technology Stack

* ⚛️ React.js
* 📜 JavaScript
* ⚡ Vite
* 📊 Recharts
* 🎨 Lucide React
* 🎨 CSS
* 🔌 REST API / JSON

---

## 🚀 Features

### 📊 Dashboard

The dashboard provides an overview of important AWS resources and operational information.

Features include:

* 🖥️ View EC2 resource statistics
* 🟢 View running and stopped instance counts
* 🪣 View S3 resource information
* 💰 View AWS cost information
* 🚨 View alert status
* 📝 View recent activity

---

### 🖥️ EC2 Management

The frontend provides an interface for:

* 📋 Viewing EC2 instances
* 🔍 Searching instances
* 📄 Viewing instance details
* ▶️ Starting EC2 instances
* ⏹️ Stopping EC2 instances

---

### 🪣 S3 Management

The frontend provides an interface for:

* 📋 Viewing S3 buckets
* 🔍 Searching buckets
* ➕ Creating buckets
* 🗑️ Deleting buckets
* 📄 Viewing bucket details
* 📦 Viewing objects
* 📤 Uploading files
* 🗑️ Deleting objects

---

### 📈 CloudWatch Monitoring

The monitoring interface provides:

* 📊 EC2 CPU utilization
* 📈 CPU history using charts
* 🔄 Automatic monitoring refresh
* 🚨 CloudWatch alarm status

Charts are implemented using **Recharts**.

---

### 🚨 Alerts

The dashboard provides visibility into:

* 📊 CloudWatch alarm information
* 📢 SNS notification status
* 🔥 High-CPU alert information

The frontend displays alert information returned by the Flask backend.

---

### 💰 AWS Cost

The cost section provides:

* 💵 Current billing-period cost
* 📊 AWS Cost Explorer information

---

### 📝 Activity

The activity section provides:

* 📋 Important dashboard operations
* 👁️ Operational visibility

---

## 🔌 Backend API

The frontend communicates with the Flask backend through REST API endpoints.

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

### 💰 Cost & 📝 Activity

```http
GET /api/cost
GET /api/activity-logs
```

---

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

---

## ⚙️ Installation

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

---

## ▶️ Run Development Server

Start the Vite development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

## 📦 Production Build

Create a production build:

```bash
npm run build
```

The generated production files are placed in the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

---

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

The frontend does not directly communicate with AWS services. AWS operations are handled by the Flask backend.

---

## 🔄 Monitoring Refresh

The dashboard refreshes relevant monitoring and operational information approximately every **30 seconds**.

This provides frequently updated visibility without requiring users to manually reload the page.

---

## ☁️ AWS Region

The application is configured for the AWS Mumbai region:

```text
🌍 Region: ap-south-1
📍 Name: Asia Pacific (Mumbai)
```

---

## 🔗 Related Project

### 🐍 Backend Implementation

```text
../backend
```

The backend is responsible for:

* 🔌 REST APIs
* 🔐 AWS authentication and authorization
* 🔧 Boto3 integration
* ☁️ AWS resource operations
* 📊 Monitoring
* 🚨 Alerts
* 💰 Cost information
* ⚠️ AWS error handling

---

## ⚙️ GitHub Actions

The project uses GitHub Actions for automated validation of the frontend and backend.

For the frontend, the CI workflow:

```text
📦 Install Dependencies
        ↓
🏗️ Build Frontend
        ↓
✅ Build Validation
```

The frontend CI uses:

```bash
npm ci
npm run build
```

GitHub Actions is used for **automated CI checks only**.

No automatic deployment of the frontend is configured through GitHub Actions.

---

## 🧪 Frontend Validation

The frontend can be validated locally using:

### Install dependencies

```bash
npm install
```

### Production build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

A successful production build confirms that the frontend can be compiled successfully.

---

## 👨‍💻 Project

**Cloud Resource Management & Monitoring Dashboard**

### 🛠️ Technologies

```text
⚛️ React
📜 JavaScript
⚡ Vite
📊 Recharts
🎨 Lucide React
🎨 CSS
🔌 REST API
```

### 🌍 AWS Region

```text
ap-south-1 — Asia Pacific (Mumbai)
```

---

## 📄 Purpose

This frontend is developed as part of an educational cloud management and monitoring project demonstrating how a modern React application can provide a centralized interface for AWS resource management and monitoring.
