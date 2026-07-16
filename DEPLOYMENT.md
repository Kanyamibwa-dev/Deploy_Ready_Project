# Deployment Guide

## Cloud provider and service

**AWS EC2** (a single `t2.micro` instance, part of the AWS Free Tier).

Why: EC2 is the simplest way to get a real Linux server with a public IP that
runs Docker, it's free for 12 months on a new account, and it matches the
"SSH in, pull image, restart container" deploy model asked for in the brief.
No Kubernetes, load balancers, or managed container services are needed for
a project this size.

## 1. Create the EC2 instance

1. Sign in to the [AWS Console](https://console.aws.amazon.com/) and go to **EC2**.
2. Click **Launch Instance**.
3. Name it e.g. `deployready-server`.
4. **AMI**: choose **Ubuntu Server 22.04 LTS** (free tier eligible).
5. **Instance type**: `t2.micro` (free tier eligible).
6. **Key pair**: click **Create new key pair**, name it `deployready-key`,
   type RSA, format `.pem`. Download it and keep it somewhere safe — you
   cannot download it again later. On Mac/Linux run
   `chmod 400 deployready-key.pem` so SSH will accept it.
7. **Network settings / Firewall (security group)** — click **Edit** and set
   exactly these two inbound rules:
   - **SSH (port 22)** — Source: **My IP** (NOT Anywhere/0.0.0.0/0). This
     restricts SSH to your current IP address only.
   - **HTTP (port 80)** — Source: **Anywhere (0.0.0.0/0)**. This is what lets
     the internet reach `/health`.
8. Leave storage at the default 8 GB gp3.
9. Click **Launch instance**. Wait ~1 minute, then find its **Public IPv4
   address** on the instance detail page — you'll need it repeatedly below.

> Note on IAM: this deploy method only needs SSH access to the box, not
> AWS API access, so no IAM user/role is required for the GitHub Actions
> pipeline itself. If you do the Terraform bonus, create a separate IAM
> user scoped to just `ec2:*` on this one instance rather than using your
> root/admin credentials.

## 2. Connect and install Docker

SSH in (replace with your key path and the instance's public IP):

```bash
ssh -i deployready-key.pem ubuntu@<your-server-ip>
```

Once connected, install Docker:

```bash
# Update package lists
sudo apt-get update -y

# Install Docker's official install script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Let the ubuntu user run docker without sudo
sudo usermod -aG docker ubuntu

# Log out and back in for the group change to apply
exit
```

SSH back in, then confirm Docker works:

```bash
ssh -i deployready-key.pem ubuntu@<your-server-ip>
docker --version
```

## 3. First manual deploy (so /health responds immediately)

Before the pipeline can deploy automatically, images need to exist in the
registry at least once. The easiest way is to just push to `main` after
setting up the GitHub secrets below — GitHub Actions will build, push, and
SSH-deploy for you. If you want to sanity-check Docker on the server first,
you can manually pull any public test image, e.g.:

```bash
docker run -d -p 80:80 --name test nginx
curl http://localhost/health   # (won't return {"status":"ok"} yet — just checking connectivity)
docker rm -f test
```

## 4. GitHub repository secrets

In your GitHub repo: **Settings → Secrets and variables → Actions → New
repository secret**. Add:

| Secret name       | Value                                                              |
|-------------------|---------------------------------------------------------------------|
| `SERVER_HOST`     | Your EC2 public IP                                                  |
| `SERVER_USER`     | `ubuntu`                                                             |
| `SERVER_SSH_KEY`  | The full contents of `deployready-key.pem` (private key)            |
| `GHCR_TOKEN`      | A GitHub Personal Access Token with `read:packages` scope, so the server can pull the private image from GHCR |

To create the PAT: GitHub profile → **Settings → Developer settings →
Personal access tokens → Tokens (classic) → Generate new token**, scope
`read:packages` only.

Once these secrets exist, push to `main` and watch the **Actions** tab —
the pipeline will test, build, push to `ghcr.io`, then SSH in and start the
container on port 80.

## 5. Verify

```bash
curl http://<your-server-ip>/health
# {"status":"ok"}
```

## 6. Checking the container / logs (from an SSH session on the server)

**Is it running?**

```bash
docker ps
```

You should see `deployready-app` listed with status `Up`.

**View logs:**

```bash
docker logs deployready-app          # recent logs
docker logs -f deployready-app       # follow logs live
docker logs --tail 100 deployready-app
```

**Restart it manually if needed:**

```bash
docker restart deployready-app
```

## Bonus (not implemented in this submission)

Optional next steps if you want to go further: provisioning the VM and
security group with Terraform instead of the console, adding a CloudWatch
alarm on `/health`, or adding an automatic rollback step in the pipeline
that re-deploys the previous image tag if the post-deploy health check
fails.
