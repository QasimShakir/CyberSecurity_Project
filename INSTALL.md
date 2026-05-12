# The Shelf - Deployment & Installation Manual

## System Requirements
* Docker and Docker Compose
* Node.js v18+ (for local development)
* MongoDB Atlas Cluster (or local MongoDB instance)
* Git

## 1. Environment Setup
1. Clone the repository: `git clone https://github.com/QasimShakir/CyberSecurity_Project.git`
2. Navigate to the directory: `cd CyberSecurity_Project`
3. Copy the environment template: `cp .env.example .env.local`
4. **CRITICAL SECURITY STEP:** Edit `.env.local` and replace the `JWT_SECRET` with a cryptographically secure 64-character random string. Ensure your `MONGODB_URI` is correctly pointed to your database.

## 2. Containerized Deployment (Production/Testing)
The application is fully containerized for consistent deployment.
1. Build and start the containers: `docker compose up --build -d`
2. The application will be available at `http://localhost:3000`.

## 3. Secure Public Access (HTTPS / Hostname Requirement)
To meet secure deployment requirements without triggering browser certificate warnings, utilize a secure tunnel to expose the local container over HTTPS:
1. Ensure the Docker containers are running.
2. Run the Cloudflare Tunnel container:
   `docker run --rm cloudflare/cloudflared:latest tunnel --url http://host.docker.internal:3000`
3. Access The Shelf via the generated `trycloudflare.com` HTTPS URL provided in the terminal output.
