# Deployment Guide

## Cloud Provider and Service

I deployed this application using **Render Web Service**.

I chose Render because it supports Docker deployments, integrates easily with GitHub, and provides a simple way to deploy containerised applications without managing the infrastructure manually.

The main focus of this project was implementing a DevOps workflow using:

- Docker for containerisation
- GitHub Actions for CI/CD automation
- GitHub Container Registry for storing Docker images
- Render for cloud deployment

---

# Deployment Setup

## 1. Preparing the Application

The application was containerised using Docker.

The project contains:

- `Dockerfile` - builds the application container
- `docker-compose.yml` - runs the application locally
- `.env.example` - provides required environment variables

The Docker container:

- Uses the Node.js 20 Alpine image
- Installs the required Node.js dependencies
- Runs the API inside the container
- Accepts the application port through the `PORT` environment variable
- Runs using a non-root user for better security

---

## 2. Deploying to Render

The deployment steps were:

1. Push the project repository to GitHub.
2. Create a new Web Service on Render.
3. Connect the GitHub repository.
4. Select Docker as the deployment environment.
5. Render detects the `Dockerfile` from the repository root.
6. Configure the required environment variables.
7. Deploy the application.

After deployment, Render builds the Docker image and starts the application container.

---

# Environment Variables

The application uses environment variables for configuration.

Example:

```env
PORT=3000
```

The application reads the `PORT` value from the environment when starting.

A `.env.example` file is included in the repository as a template.

Sensitive information such as tokens and credentials are stored using GitHub repository secrets and are not committed to the repository.

---

# CI/CD Deployment Process

I created a GitHub Actions workflow located at:

```
.github/workflows/deploy.yml
```

The pipeline runs automatically whenever changes are pushed to the `main` branch.

The workflow performs these steps:

1. Checkout the repository code.
2. Install application dependencies.
3. Run automated tests.
4. Login to GitHub Container Registry.
5. Generate Docker image metadata.
6. Build the Docker image.
7. Push the Docker image to GitHub Container Registry.
8. Trigger a new deployment on Render.

If the tests fail, the pipeline stops and the deployment process does not continue.

---

# Verifying the Deployment

After deployment, I tested the application using the public Render URL.

Health check endpoint:

```
https://your-render-url.onrender.com/health
```

Expected response:

```json
{
  "status": "ok"
}
```

This confirms that the application is running successfully on Render.

---

# Checking Application Status and Logs

Render provides monitoring through its dashboard.

## Checking if the application is running

To check the application status:

1. Open the Render dashboard.
2. Select the deployed service.
3. Check the service status.

A successful deployment shows:

```
Live
```

---

## Viewing Application Logs

To view logs:

1. Open the Render service.
2. Navigate to the **Logs** section.
3. Review application startup messages, requests, and errors.

The logs help identify issues during deployment or while the application is running.

---

# Deployment Architecture

The final deployment flow is:

```
Developer
    |
    | git push
    ↓
GitHub Repository
    |
    ↓
GitHub Actions

    - Run tests
    - Build Docker image
    - Push image to GHCR
    - Trigger Render deployment

    |
    ↓

Render Cloud Platform

    |
    ↓

Running Node.js API
```

---

# Future Improvements

Some improvements I would add in the future:

- Add application monitoring and alerts
- Add automatic rollback after failed deployments
- Add more automated tests
- Use Infrastructure as Code tools such as Terraform
- Add Docker image security scanning