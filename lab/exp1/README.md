<center>

## **Containerization and DevOps Lab**
## **EXPERIMENT – 01**
</center>

**Aim of the Experiment**

To study, install, configure, and compare Virtual Machines and Containers using VirtualBox, Vagrant, Docker, and WSL on a Windows system.

**Objective**

- To understand the conceptual and practical differences between Virtual Machines and Containers.
- To install and configure a Virtual Machine using VirtualBox and Vagrant on Windows.
- To install and configure Containers using Docker inside WSL.
- To deploy an Ubuntu-based Nginx web server in both environments.
- To compare resource utilization, performance, and operational characteristics of VMs and Containers.

**System Configuration / Requirements**
System Configuration
- Operating System: Windows 11
- Processor: Intel/AMD x64 Processor
- RAM: 8 GB
- Storage: Minimum 20 GB free space

Software Requirements
- Oracle VirtualBox
- Vagrant
- Docker Engine
- Windows Subsystem for Linux (WSL 2)
- Ubuntu (WSL)

**Theory**

**Virtual Machine (VM)**

A Virtual Machine emulates a complete physical computer, including its own operating system kernel, hardware drivers, and user space. Each VM runs on top of a hypervisor.

**Characteristics:**

- Full OS per VM
- Higher resource usage
- Strong isolation
- Slower startup time


**Container**

Containers virtualize at the operating system level. They share the host OS kernel while isolating applications and dependencies in user space.

**Characteristics:**

- Shared kernel
- Lightweight
- Fast startup
- Efficient resource usage

**Advantages and Disadvantages**

**Advantages of Virtual Machines**

- Provides **strong isolation** since each VM runs its own operating system.
- Supports **multiple operating systems** on the same host machine.
- Suitable for **legacy applications** that require a full OS environment.
- Offers better security due to **hardware-level virtualization**.

**Disadvantages of Virtual Machines**

- **High resource consumption** (CPU, RAM, and disk space).
- **Slower startup time** compared to containers.
- Requires more storage for OS images and virtual disks.
- Management and maintenance are more complex.

**Advantages of Containers**

- **Lightweight and fast** as containers share the host OS kernel.
- **Quick startup and shutdown**, ideal for rapid deployment.
- Efficient use of **system resources**.
- Well-suited for **microservices and cloud-native applications**.

**Disadvantages of Containers**

- **Weaker isolation** compared to virtual machines.
- Dependent on the **host operating system kernel**.
- Less suitable for applications requiring a full OS environment.
- Security risks if containers are not properly configured.

**Experiment Setup - Part A: Virtual Machine (Windows)**

**Step 1: Install VirtualBox**

- Download VirtualBox from the official website.
- Run the installer and keep default options.
- Restart the system if prompted.
  
![virtual](virtual.png)

**Step 2: Install Vagrant**

- Download Vagrant for Windows.
- Install using default settings.
- Verify installation:

![vagrant](vagrant.png)

```Code : vagrant --version```

![version](version.png)

**Step 3: Create Ubuntu VM using Vagrant**

- Initialize Vagrant with Ubuntu box:

```Code: vagrant init hashicorp/bionic64```

- Start the VM

```Code: vagrant up```

![vagrant](vm.png)

When you run vagrant init hashicorp/bionic64, Vagrant creates a configuration file called **Vagrantfile** inside the project folder. This file contains all the instructions needed to create a virtual machine. In hashicorp/bionic64, **HashiCorp** is the publisher of the Vagrant box, **bionic** refers to **Ubuntu 18.04 LTS (Bionic Beaver)**, and **64** indicates that it is a 64-bit operating system.

When you run vagrant up, Vagrant reads the **Vagrantfile** and communicates with **VirtualBox** (or another configured provider). If the required Ubuntu image is not already available on the system, Vagrant automatically downloads the box. It then creates a virtual machine, allocates system resources such as **CPU, RAM, and network settings**, and finally boots the **Ubuntu virtual machine**, making it ready for use.

![Virtual](vmbox.png)

- Access the VM:

```Code: vagrant ssh```

**What's happening?**

- Vagrant connects you to the VM using **SSH**
- You enter the Ubuntu terminal **without password**
- You are now **inside the virtual machine**

**Step 4: Install Nginx inside VM**
```
Code:

- sudo apt update
- sudo apt install -y nginx
- sudo systemctl start nginx
```
![Nginx](Nginx.png)

```Code: time systemctl start nginx```

**What this command does (combined explanation)**

**systemctl start nginx**

- This command tells **systemd** (Linux service manager) to **start the Nginx web server service** on the system.
- The time keyword measures **how long the command takes to execute**.

**Starts the Nginx service and measures the time taken to start it.**

**Step 5: Verify Nginx**

```Code: curl localhost```

**Stop and remove vm**
```
Code:

- vagrant halt
- vagrant destroy
```
![remove](rm.png)

**Experiment Setup - Part B: Containers using WSL (Windows)**

**Step 1: Install WSL 2**

```Code: wsl --install```

**Verify installation**

```Code: wsl --version```

![version](wslversion.png)

**Step 2: Install Ubuntu on WSL**

```Code: wsl --install -d Ubuntu```

**Verify installation**

```Code: wsl -l -v```

![Verify](wslverify.png)

**Step 3: Install Docker Engine inside WSL**

```
Code:

- sudo apt update
- sudo apt install -y docker.io
- sudo systemctl start docker
- sudo usermod -aG docker \$USER
- verify installation
```
![Docker](docker.png)

**Step 4: Run Ubuntu Container with Nginx**

```Code: docker pull ubuntu```


![Nginx](ubuntu.png)

**docker run -d -p 8080:80 --name nginx-container nginx**

Docker pull ubuntu: This command **downloads the Ubuntu Linux image** from Docker Hub to your system.

Docker run -d -p 8080:80 -name nginx-container nginx: It **creates and runs an Nginx container in the background** and maps it to **port 8080** on your system.

**Step 5: Verify Nginx in Container**

```Code: curl localhost:8080```

![verifynginx](verifynginx.png)

**Resource Utilization Observation**

**VM Observation Commands**

```Code: free -h```

**What it does:**

- Displays **memory (RAM) usage** of the system

**What it shows:**

Total RAM Used RAM Free RAM Available RAM Swap memory

![Resourse](resource.png)

```Code: htop```

**What it does:**

- Shows **real-time system performance**

**What it displays:**

CPU usage RAM usage Running processes Process IDs, users, load average

![Realtimeperformance](realtime.png)

```Code: systemd-analyze```

![systemboot](systemd.png)

**What it does:**

- Measures **system boot time**

**What it shows:**

- Time taken by:
  - Kernel
  - Userspace
- Total boot time

**Container Observation Commands**

```Code: docker stats```

**What it does:**

- Shows **real-time resource usage** of running containers

**What you'll see:**

CPU usage Memory usage / limit Network I/O Disk I/O

![dockerstats](dockerstats.png)

```Code: free -h```

**What this command does**

- Displays the **system's memory (RAM) usage**
- Shows how much memory is:
  - Total Used Free Available Swap

The -h flag means **human-readable** (MB / GB instead of bytes).

![free](free.png)

**Parameters to Compare: Virtual Machine vs Container**

| **Parameter** | **Virtual Machine** | **Container** |
| --- | --- | --- |
| **Boot Time** | High | Very Low |
| **RAM Usage** | High | Low |
| **CPU Overhead** | Higher | Minimal |
| **Disk Usage** | Larger | Smaller |
| **Isolation** | Strong | Moderate |

**Explanation of Each Parameter**

**Boot Time**

- **Virtual Machine:** Takes more time to start because it boots a full operating system.
- **Container:** Starts almost instantly since it shares the host OS kernel.

**RAM Usage**

- **Virtual Machine:** Requires dedicated memory for its own OS and services.
- **Container:** Uses less memory as it shares system resources with the host.

**CPU Overhead**

- **Virtual Machine:** More CPU usage due to hardware virtualization.
- **Container:** Minimal overhead because applications run directly on the host kernel.

**Disk Usage**

- **Virtual Machine:** Needs large disk space for OS image and virtual disks.
- **Container:** Lightweight images consume less storage.

**Isolation**

- **Virtual Machine:** Strong isolation as each VM runs its own OS.
- **Container:** Moderate isolation since containers share the host OS kernel.

**Conclusion**

Virtual Machines are suitable for full OS isolation and legacy workloads, whereas Containers are ideal for microservices, rapid deployment, and efficient resource utilization.
