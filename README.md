# NyayGuru API - Production Grade Legal Chatbot

NyayGuru API (also known as LawGPT) is a legal AI chatbot that provides information about various legal topics in multiple languages. This project uses a Retrieval-Augmented Generation (RAG) architecture to deliver accurate and contextually relevant legal information.

## Features

- **Legal Category Support**: Specialized in Indian legal topics including Criminal Law, Cyber Law, Property Law, and more
- **Multilingual Responses**: Supports English, Hindi, and Marathi
- **Lawyer Support**: Connect with verified lawyers for consultation and representation
- **Secure Authentication**: JWT-based authentication system with rate limiting
- **Containerized Deployment**: Docker and Docker Compose configuration for production
- **Production Monitoring**: Prometheus and Grafana integration for real-time metrics
- **Reverse Proxy**: NGINX configuration with SSL/TLS support
- **High Performance**: Redis caching and optimized vector retrieval
- **Scalable Architecture**: Stateless API design for horizontal scaling

## Tech Stack

- **Backend**: FastAPI, Python 3.11+
- **Frontend**: React, Vite
- **Database**: SQLAlchemy with SQLite (can be configured for other databases)
- **Vector Database**: FAISS for embedding storage and retrieval
- **AI Models**: Llama3 (via GROQ API), Google AI for embeddings
- **Monitoring**: Prometheus, Grafana
- **Caching**: Redis
- **Reverse Proxy**: NGINX with SSL/TLS

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- API keys for language models (GROQ, Google)

### Backend Setup

1. Clone the repository
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create `.env` file in the project root with the following variables:
   ```
   # API Keys
   GOOGLE_API_KEY=your_google_api_key
   GROQ_API_KEY=your_groq_api_key

   # Security
   SECRET_KEY=your_secret_key_for_jwt
   DATABASE_URL=sqlite:///./app.db  # Or your database URL
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd lawgpt-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file in the frontend directory with:
   ```
   VITE_API_URL=http://localhost:8000
   ```

### Running the Application

1. Start the backend:
   ```bash
   python dev.py
   ```
2. In a separate terminal, start the frontend:
   ```bash
   cd lawgpt-frontend
   npm run dev
   ```
3. Access the application at http://localhost:5173

You can also use the npm scripts from the root directory:
```bash
# Start backend only
npm run dev

# Start frontend only
npm run dev:frontend

# Build frontend
npm run build:frontend
```

## Production Deployment

### Prerequisites

- Docker and Docker Compose installed
- SSL/TLS certificates for your domain
- API keys for language models (GROQ, Google)

### Environment Setup

1. Create `.env` file in the project root with the following variables:

```
# API Keys
GOOGLE_API_KEY=your_google_api_key
GROQ_API_KEY=your_groq_api_key

# Security
SECRET_KEY=your_secret_key_for_jwt
DATABASE_URL=sqlite:///./app.db  # Or your database URL

# Optional Settings
ENABLE_CACHE=True
ENABLE_MONITORING=True

# Monitoring credentials
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=secure_password
```

### SSL/TLS Setup

1. Create SSL directory: `mkdir -p nginx/ssl`
2. Place your SSL certificates in the directory:
   - `nginx/ssl/cert.pem` - Certificate file
   - `nginx/ssl/key.pem` - Private key file

### Deployment

1. Build and start the containers:

```bash
docker-compose up -d
```

2. Initialize the database (first time only):

```bash
docker-compose exec api alembic upgrade head
```

3. Create admin user:

```bash
docker-compose exec api python -m app.scripts.create_admin
```

### Scaling for Production

For a high-traffic production environment:

1. Use a managed Kubernetes service (EKS, GKE, AKS)
2. Set up auto-scaling based on CPU/memory usage
3. Use a managed database service instead of SQLite
4. Implement a CDN for static assets
5. Use distributed tracing with OpenTelemetry

## Monitoring

- **Prometheus**: Available at `https://your-domain.com:9090`
- **Grafana**: Available at `https://your-domain.com:3000`
  - Default credentials: Set in your .env file
  - Import the provided dashboards from the `grafana/dashboards` directory

## Maintenance

### Backup and Restore

1. Vector store backup:

```bash
docker-compose exec api python -m app.scripts.backup_vector_store
```

2. Database backup:

```bash
docker-compose exec api python -m app.scripts.backup_database
```

3. Restore from backups:

```bash
docker-compose exec api python -m app.scripts.restore_vector_store
docker-compose exec api python -m app.scripts.restore_database
```

### Updating Models

To update the embedded legal documents:

1. Add your PDF files to the `LEGAL-DATA` directory
2. Run the ingestion script:

```bash
docker-compose exec api python -m app.ingestion
```

## Security Considerations

- Regularly update dependencies with `pip-audit`
- Rotate API keys and JWT secrets periodically
- Use least privilege principle for service accounts
- Enable firewall rules to restrict access to internal services
- Run security scans with tools like OWASP ZAP

## Performance Optimization

- Tune NGINX worker processes based on available CPU cores
- Configure Redis cache eviction policies
- Optimize vector chunk size for your specific use case
- Use async workers with gunicorn for production WSGI serving

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For support or inquiries, please reach out to the development team.

## Setting Up Google OAuth

To enable Google login functionality in NyayGuru:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the Application type
6. Add "http://localhost:5173" (or your frontend URL) to the Authorized JavaScript origins
7. Add "http://localhost:8000/api/auth/google-callback" to the Authorized redirect URIs
8. Click "Create" to generate your Client ID and Client Secret
9. Create a .env file in the frontend directory with:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   ```
10. Restart the application

This will enable users to sign in with their Google accounts. 