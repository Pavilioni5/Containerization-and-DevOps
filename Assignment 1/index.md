---
layout: default
title: Containerized Web App
---


# Docker_WebApp
Containerized Student Records REST API built with Node.js and PostgreSQL using Docker Compose, Macvlan networking, and persistent Docker volumes.

---

## 1. Introduction

Docker is one of the most widely used containerization platforms. It allows developers to build, ship, and run applications efficiently. Docker Compose enables orchestration of multiple containers that together form a complete application stack.

This project implements a containerized **Student Records Web Application** using:

- **Node.js + Express** as the backend API
- **PostgreSQL** as the database
- **Docker multi-stage builds** for optimized container images
- **Docker Compose** for service orchestration
- **Macvlan networking** for assigning LAN IP addresses to containers
- **Named volumes** for persistent database storage

The system demonstrates production-oriented container deployment practices, including network isolation, persistent storage, optimized image building, and container orchestration.

---

## 2. System Architecture

The application follows a **three-tier architecture** consisting of:

- **Client Layer**
- **Backend API Layer**
- **Database Layer**

The client sends HTTP requests to the backend API, which processes the request and interacts with the PostgreSQL database.

### Architecture Diagram

```
Client (Browser / Postman)
        |
        | HTTP Request (Port 3000)
        v
+-------------------------------+
|  Backend Container            |
|  Node.js + Express            |
|  IP Address: 192.168.1.100    |
+-------------------------------+
        |
        | PostgreSQL Query (Port 5432)
        v
+-------------------------------+
|  Database Container           |
|  PostgreSQL 16                |
|  IP Address: 192.168.1.101    |
+-------------------------------+
        |
        v
+-------------------------------+
|  Docker Named Volume          |
|  student_pgdata               |
+-------------------------------+
```

In this architecture:
- Each container runs independently
- Containers communicate over a **Macvlan network**
- Database data persists using a **named Docker volume**

---

## 3. Application Functionality

The backend service provides a REST API for managing student records.

### Implemented Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | `GET` | Checks API and database health |
| `/students` | `POST` | Inserts a new student record |
| `/students` | `GET` | Retrieves all student records |

### Example Student Record

```json
{
  "name": "Aniket",
  "roll_number": "CS01",
  "department": "CSE",
  "year": 3
}
```

The backend automatically creates the `students` table during startup if it does not already exist.

---

## 4. Docker Image Build Optimization

Docker images were optimized using **multi-stage builds** and **minimal base images**.

### 4.1 Multi-Stage Builds

Multi-stage builds allow separation of the **build environment** and the **runtime environment**.

```
Stage 1 — Builder
├── Installs npm dependencies
└── Prepares application files

Stage 2 — Runtime
├── Contains only necessary runtime components
└── Excludes build tools and temporary files
```

**Benefits:**
- Smaller image size
- Reduced attack surface
- Faster deployment

### 4.2 Minimal Base Images

Instead of using full operating system images, lightweight **Alpine-based** images were used.

| Service | Base Image |
|---------|-----------|
| Backend | `node:20-alpine` |
| Database | `postgres:16-alpine` |

### 4.3 Image Size Comparison

| Image | Approximate Size |
|-------|----------------|
| `node:20` (standard) | ~1.1 GB |
| `node:20-alpine` (single-stage) | ~170 MB |
| `node:20-alpine` (multi-stage, this project) | ~60 MB |

| Database Image | Approximate Size |
|---------------|----------------|
| `postgres:16` (standard) | ~425 MB |
| `postgres:16-alpine` (this project) | ~85 MB |

Using Alpine images reduces storage and improves container startup time.

---

## 5. Docker Compose Orchestration

Docker Compose was used to orchestrate the backend and database containers.

The `docker-compose.yml` file defines:

- Services
- Networks
- Volumes
- Environment variables
- Restart policies
- Health checks

### Services

#### Backend Service
- Runs Node.js Express API
- Connected to macvlan network with static IP `192.168.1.100`
- Communicates with database container via environment variables

#### Database Service
- Runs PostgreSQL database
- Stores data in persistent named volume `student_pgdata`
- Exposes port `5432` internally

---

## 6. Container Networking

Networking between containers is implemented using **Macvlan networking**.

Macvlan allows containers to appear as **independent devices on the local network** with their own unique IP addresses.

### Network Creation Command

```bash
docker network create \
  --driver macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 \
  student_macvlan
```

### Assigned Container IPs

| Container | Static IP Address |
|-----------|-----------------|
| Backend (`studentapi`) | `192.168.1.100` |
| Database (`studentdb`) | `192.168.1.101` |

This enables **direct LAN communication** with containers without any port forwarding.

---

## 7. Macvlan vs Ipvlan Comparison

| Feature | Macvlan | Ipvlan |
|---------|---------|--------|
| Network Layer | Layer 2 (Ethernet) | Layer 3 (IP) |
| MAC Address | Unique MAC per container | Shared host MAC |
| Performance | High | High |
| Host Communication | Host cannot directly access container | Host can communicate |
| Use Case | Simulating physical devices on LAN | Cloud and virtualized environments |

### Why Macvlan Was Chosen

Macvlan was chosen because:
- Containers behave like **independent network devices** on the LAN
- Each container receives a **unique MAC address and LAN IP**
- Ideal for **network simulation and isolation** in physical lab environments

### Macvlan Host Isolation Workaround

With Macvlan, the Docker host cannot directly reach containers. Use the following workaround:

```bash
sudo ip link add macvlan0 link eth0 type macvlan mode bridge
sudo ip addr add 192.168.1.99/32 dev macvlan0
sudo ip link set macvlan0 up
sudo ip route add 192.168.1.96/28 dev macvlan0
```

---

## 8. Persistent Storage

To ensure data persistence, a **named Docker volume** was used.

### Volume Name
```
student_pgdata
```

Mounted at: `/var/lib/postgresql/data` inside the database container.

### Benefits

| Benefit | Description |
|---------|-------------|
| Data Survival | Data persists even if containers are stopped or removed |
| Easy Backup | Volume can be backed up independently |
| Isolation | Completely isolated from the container filesystem |

---

## 9. Testing and Verification

The application was tested using `curl` commands from the terminal.

### Health Check

```bash
curl http://192.168.1.100:3000/health
```

**Response:**
```json
{ "status": "ok" }
```

### Insert Student Record

```bash
curl -X POST http://192.168.1.100:3000/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Aniket","roll_number":"CS01","department":"CSE","year":3}'
```

**Response:**
```json
{ "id": 1, "name": "Aniket", "roll_number": "CS01", "department": "CSE", "year": 3 }
```

### Retrieve All Records

```bash
curl http://192.168.1.100:3000/students
```

**Response:**
```json
[
  { "id": 1, "name": "Aniket", "roll_number": "CS01", "department": "CSE", "year": 3 }
]
```

### Persistence Test

```bash
# Stop containers (volumes preserved)
docker compose down

# Restart containers
docker compose up -d

# Verify data still exists
curl http://192.168.1.100:3000/students
```

The system successfully stored and retrieved student records across container restarts.

---

## 10. Conclusion

By using **Docker Compose** and **Macvlan networking**, the backend API and PostgreSQL database were deployed as independent containers with static LAN IP addresses. **Multi-stage builds** and **Alpine-based images** ensured minimal image sizes and efficient resource usage.

**Persistent storage** was implemented using Docker named volumes, ensuring that database data remains intact across container restarts.

---
