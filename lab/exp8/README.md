# Lab Experiment 8
## Chef – Configuration Management

## What is Chef?

Chef is an **infrastructure automation platform** that treats infrastructure as code using a **Ruby-based DSL (Domain Specific Language)**. Instead of manually configuring servers, you write *recipes* and *cookbooks* that describe the desired state of your systems, and Chef ensures that state is always maintained.

> **Key Difference from Ansible:** Chef requires an agent installed on each managed node and a central Chef Server, but this trade-off brings more powerful dependency management and better scalability for large enterprise environments.

### Benefits of Chef

- **Pull-based Architecture** – Nodes check in regularly (every ~30 min), ensuring compliance without active intervention
- **Idempotency** – Recipes can be run multiple times with the same safe outcome
- **Powerful Ruby DSL** – More expressive than YAML for complex conditional logic
- **Infrastructure as Code** – All configs are version-controlled and testable
- **Large Community** – 4000+ community cookbooks available on Chef Supermarket
- **Test Kitchen** – Built-in testing framework for validating cookbooks before deployment
- **Continuous Compliance** – Built-in auditing capabilities

---

## How Chef Works

```
┌────────────────────┐           ┌──────────────────────┐
│   WORKSTATION      │──────────▶│    CHEF SERVER       │
│  • Cookbooks       │  Upload   │  • Cookbooks         │
│  • Roles           │  (knife)  │  • Node Data         │
│  • Environments    │           │  • Auth Keys         │
│  • Data Bags       │           │  • Search Indexes    │
└────────────────────┘           └──────────────────────┘
                                          │
                                          │ Pull (every 30 min)
                                          ▼
                                 ┌──────────────────────┐
                                 │   MANAGED NODES      │
                                 │  Chef Client (Agent) │
                                 │  Chef Client (Agent) │
                                 └──────────────────────┘
```

The workflow is:
1. A DevOps engineer writes cookbooks on the **Workstation**
2. Cookbooks are uploaded to the **Chef Server** using the `knife` CLI tool
3. **Chef Clients** (agents) on managed nodes periodically pull the latest configuration
4. Each node applies the configuration and reports back its status

---

## Key Concepts

| Concept | Description |
|---|---|
| **Chef Server** | Central repository for cookbooks, policies, and node data |
| **Chef Workstation** | Development machine where cookbooks are created and tested |
| **Chef Node** | Any managed machine with the Chef Client agent installed |
| **Cookbook** | A collection of recipes, attributes, templates, and files |
| **Recipe** | A Ruby file containing resource declarations (the actual instructions) |
| **Resource** | Building blocks like `package`, `service`, `file`, `template` |
| **Run List** | An ordered list of recipes applied to a specific node |
| **Knife** | CLI tool used to interact with the Chef Server |
| **Ohai** | System profiling tool that collects node attributes (OS, IP, hostname, etc.) |

---

## Part A: Chef Solo (No Server Required)

Chef Solo (now called **Local Mode**) allows you to run Chef directly on a machine without needing a central Chef Server. It is ideal for learning, testing, and small deployments.

### Architecture

```
┌────────────────────────────────────┐        ┌─────────────────────┐
│   CONTROL NODE (Your Machine)      │──ssh──▶│   MANAGED NODES     │
│  • Cookbooks                       │        │  Chef Client        │
│  • Recipes                         │        │  (Local Mode)       │
│  • Attributes                      │        │                     │
│  • Templates                       │        │                     │
└────────────────────────────────────┘        └─────────────────────┘
           No central server needed
```

### Step 1: Install Chef Workstation

```bash
# Download Chef Workstation for Ubuntu/Debian
wget https://packages.chef.io/files/stable/chef-workstation/24.10.1144/ubuntu/22.04/chef-workstation_24.10.1144-1_amd64.deb
sudo dpkg -i chef-workstation_24.10.1144-1_amd64.deb

# Verify installation
chef --version
# Expected: Chef Workstation version: 24.10.1144
```

### Step 2: Setup Lab Environment (Docker Containers)

```bash
# Create Docker network
docker network create chef-lab

# Create SSH key pair
ssh-keygen -t rsa -b 4096 -f ~/.ssh/chef-key -N ""

# Build Chef-ready Docker image
cat > Dockerfile.chef << 'EOF'
FROM ubuntu:22.04
RUN apt-get update && \
    apt-get install -y python3 openssh-server sudo curl systemd && \
    apt-get clean
RUN mkdir -p /var/run/sshd && \
    echo 'root:chef' | chpasswd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
RUN mkdir -p /root/.ssh && chmod 700 /root/.ssh
COPY ~/.ssh/chef-key.pub /root/.ssh/authorized_keys
RUN chmod 600 /root/.ssh/authorized_keys
EXPOSE 22
CMD ["/usr/sbin/sshd", "-D"]
EOF

# Build image and create 4 test nodes
docker build -f Dockerfile.chef -t chef-node .
for i in {1..4}; do
  docker run -d --name node${i} --network chef-lab -p 222${i}:22 chef-node
  echo "Node${i} created with SSH on port 222${i}"
done

# Copy SSH keys to nodes
for i in {1..4}; do
  docker exec node${i} mkdir -p /root/.ssh
  docker cp ~/.ssh/chef-key.pub node${i}:/root/.ssh/authorized_keys
  docker exec node${i} chmod 600 /root/.ssh/authorized_keys
done
```

### Step 3: Create First Cookbook

```bash
mkdir -p ~/chef-repo/cookbooks
cd ~/chef-repo

# Generate cookbook scaffold
chef generate cookbook cookbooks/basics
```

Edit `cookbooks/basics/metadata.rb`:

```ruby
name 'basics'
maintainer 'DevOps Lab'
maintainer_email 'lab@example.com'
license 'Apache-2.0'
description 'Installs/Configures basic system settings'
version '0.1.0'
chef_version '>= 16.0'
depends 'apt'
```

### Step 4: Create Recipes

**`recipes/default.rb`** – Entry point that includes all sub-recipes:

```ruby
include_recipe 'basics::packages'
include_recipe 'basics::files'
include_recipe 'basics::services'
```

**`recipes/packages.rb`** – Installs essential packages:

```ruby
apt_update 'update' do
  action :update
  frequency 86400
end

%w(vim htop wget curl git net-tools).each do |pkg|
  package pkg do
    action :install
  end
end
```

**`recipes/files.rb`** – Creates directories and files with node-specific content:

```ruby
directory '/opt/chef-demo' do
  owner 'root'
  group 'root'
  mode '0755'
  action :create
end

file '/opt/chef-demo/README.md' do
  content <<~EOH
    # Chef Managed System
    Hostname: #{node['hostname']}
    IP Address: #{node['ipaddress']}
    OS: #{node['platform']} #{node['platform_version']}
  EOH
  mode '0644'
  action :create
end
```

**`recipes/services.rb`** – Manages system services:

```ruby
service 'ssh' do
  action [:enable, :start]
end
```

### Step 5: Create Templates and Static Files

```bash
# Create service template
cat > cookbooks/basics/templates/demo.service.erb << 'EOF'
[Unit]
Description=Chef Demo Service
After=network.target

[Service]
Type=simple
ExecStart=/bin/bash -c 'while true; do echo "Chef Demo Service: $(date)" >> /var/log/demo.log; sleep 60; done'
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

# Create static welcome file
cat > cookbooks/basics/files/welcome.txt << 'EOF'
=====================================
Welcome to Chef Managed System
=====================================
This system is configured using Chef.
All changes should be made through cookbooks.
=====================================
EOF
```

### Step 6: Create Node Configuration

```bash
# nodes.json – defines run lists per node
cat > nodes.json << 'EOF'
{
  "node1": { "run_list": ["recipe[basics]"] },
  "node2": { "run_list": ["recipe[basics]"] },
  "node3": { "run_list": ["recipe[basics]"] },
  "node4": { "run_list": ["recipe[basics]"] }
}
EOF
```

### Step 7: Run Chef Solo

```bash
cat > ~/chef-repo/run-chef.sh << 'EOF'
#!/bin/bash
for i in {1..4}; do
  echo "====================================="
  echo "Configuring node${i}"
  echo "====================================="
  ssh -i ~/.ssh/chef-key -o StrictHostKeyChecking=no root@localhost -p 222${i} "mkdir -p /opt/chef/"
  scp -i ~/.ssh/chef-key -P 222${i} -r ~/chef-repo/cookbooks root@localhost:/opt/chef/
  ssh -i ~/.ssh/chef-key -p 222${i} root@localhost \
    "cd /opt/chef && chef-client --local-mode --runlist 'recipe[basics]'"
  echo "Node${i} configured successfully"
done
EOF
chmod +x ~/chef-repo/run-chef.sh
./run-chef.sh

# Verify on all nodes
for i in {1..4}; do
  echo "=== Node${i} ==="
  ssh -i ~/.ssh/chef-key -p 222${i} root@localhost "cat /opt/chef-demo/README.md"
done
```

---

## Part B: Chef Server (Full Enterprise Setup)

The Chef Server model adds a central server that stores all cookbook versions, node data, authentication keys, and search indexes. Nodes pull configurations automatically on a schedule.

### Step 1: Setup Chef Server

```bash
# Pull and run Chef Server in Docker
docker pull chef/chef-server:latest
docker run -d \
  --name chef-server \
  --network chef-lab \
  -p 443:443 \
  -v chef-server-data:/var/opt/opscode \
  chef/chef-server:latest

# Wait 2-3 minutes, then create admin user and org
docker exec chef-server chef-server-ctl user-create \
  admin "Admin" "User" admin@example.com 'admin123' \
  --filename /tmp/admin.pem

docker exec chef-server chef-server-ctl org-create \
  devops "DevOps Lab" --association admin \
  --filename /tmp/devops-validator.pem

# Copy keys to workstation
docker cp chef-server:/tmp/admin.pem ~/chef-repo/.chef/
docker cp chef-server:/tmp/devops-validator.pem ~/chef-repo/.chef/
```

### Step 2: Configure Knife

```bash
cat > ~/chef-repo/.chef/knife.rb << 'EOF'
current_dir = File.dirname(__FILE__)
log_level :info
log_location STDOUT
node_name "admin"
client_key "#{current_dir}/admin.pem"
validation_client_name "devops-validator"
validation_key "#{current_dir}/devops-validator.pem"
chef_server_url "https://chef-server/organizations/devops"
cookbook_path ["#{current_dir}/../cookbooks"]
ssl_verify_mode :verify_none
EOF

# Test connection
knife ssl check
knife client list
```

### Step 3: Create and Upload Webapp Cookbook

```bash
chef generate cookbook cookbooks/webapp
knife cookbook upload webapp
```

### Step 4: Bootstrap Nodes

Bootstrapping installs the Chef Client on the node and registers it with the Chef Server.

```bash
for i in {1..4}; do
  knife bootstrap localhost \
    --ssh-user root \
    --ssh-port 222${i} \
    --ssh-identity-file ~/.ssh/chef-key \
    --node-name node${i} \
    --run-list 'recipe[webapp]'
done
```

### Step 5: Verify Configuration

```bash
knife node list
knife node show node1
knife search node "platform:ubuntu"

# Trigger manual Chef run on a node
knife ssh "name:node1" "chef-client" \
  --ssh-user root \
  --ssh-identity-file ~/.ssh/chef-key \
  --attribute ipaddress
```

---

## Chef Solo vs Chef Server

| Aspect | Chef Solo (Part A) | Chef Server (Part B) |
|---|---|---|
| Complexity | Low | High |
| Setup Time | ~15 minutes | ~45 minutes |
| Server Required | No | Yes |
| Scalability | Limited | Full support |
| Node Management | Manual per node | Centralized |
| Search Capabilities | No | Yes |
| Role-Based Config | No | Yes |
| Best For | Learning, small setups | Production, enterprises |

---

## Chef vs Ansible

| Feature | Chef | Ansible |
|---|---|---|
| Architecture | Pull-based (agent) | Push-based (agentless) |
| Language | Ruby DSL | YAML |
| Learning Curve | Steep | Gentle |
| Setup Complexity | High | Low |
| Idempotency | Yes | Yes |
| Real-time Changes | Delayed (pull interval) | Immediate (push) |
| Scaling | Excellent (5000+ nodes) | Good (up to ~2000 nodes) |
| Community | Mature, 4000+ cookbooks | Largest, 3000+ collections |
| Best Use Case | Large enterprises | Small to medium, cloud |

### Why Chef Solo Never Became Dominant

Chef Solo lacked what modern DevOps needed:
- No infrastructure orchestration
- No central visibility or API/UI
- No node discovery or inventory management
- Manual copying of configs to each machine

Ansible addressed all of these without requiring agents, hitting the sweet spot between simplicity and power.

### Simple Analogy

| Tool | Analogy |
|---|---|
| **Chef (with server)** | A manager giving instructions via a central HR system |
| **Chef Solo** | Giving each worker a USB stick with their individual instructions |
| **Ansible** | A remote control system managing all workers live from one place |

---
