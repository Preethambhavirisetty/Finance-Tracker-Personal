# Changelog

All notable changes to the Finance Tracker project will be documented in this file.

## [2.0.0] - 2025-11-15

### Added - Docker Deployment Support
- **Docker Support**: Full Docker containerization for all services
  - Backend Dockerfile with Python 3.11 and Gunicorn
  - Frontend Dockerfile with multi-stage build and Nginx
  - PostgreSQL database with persistent storage
  - Automated backup service

- **Docker Compose**: Complete orchestration setup
  - PostgreSQL database with health checks
  - Backend API service with auto-restart
  - Frontend service with Nginx
  - Automated daily backups
  - Named volumes for persistent storage
  - Custom network for service communication

- **Deployment Tools**:
  - `deploy-ec2.sh`: Automated EC2 deployment script
  - `Makefile`: Common management commands
  - `env.example`: Environment configuration template
  - `.dockerignore` files: Optimized build contexts

- **Documentation**:
  - `DEPLOYMENT.md`: Comprehensive EC2 deployment guide
  - `DOCKER-QUICKSTART.md`: Quick reference guide
  - `docker-compose.override.yml.example`: Development overrides

- **CI/CD**:
  - GitHub Actions workflow for Docker builds and tests

- **Configuration**:
  - Environment-based configuration
  - Build-time arguments for React app
  - CORS configuration
  - Security headers in Nginx

### Changed
- Frontend now uses Nginx for production (instead of React dev server)
- Backend uses Gunicorn instead of Flask dev server
- Database changed from SQLite to PostgreSQL for production
- Multi-stage build for optimized frontend container

### Security
- Added security headers in Nginx configuration
- Non-root user in backend container
- Health checks for all services
- Automated database backups
- Environment variable based secrets

---

## [1.0.0] - Previous

### Features
- User authentication (register, login, logout)
- Multiple profile support
- Income and expense tracking
- Category-based organization
- Transaction history
- Real-time balance calculations
- React frontend with Tailwind CSS
- Flask backend with SQLAlchemy
- SQLite database

---

## Migration Notes

### Migrating from v1.0.0 to v2.0.0

If you're upgrading from the previous version:

1. **Export existing data** (if using SQLite):
   ```bash
   python backend/export_data.py
   ```

2. **Set up Docker environment**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Build and start containers**:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. **Import data** (optional):
   - Create user account via web interface
   - Import data via admin tools (if needed)

### Breaking Changes
- Port 5000 changed to 5001 for backend
- Database migration from SQLite to PostgreSQL
- New environment variable requirements
- CORS configuration required for production

---

## Future Roadmap

### Planned Features
- SSL/TLS support with Let's Encrypt
- Redis caching layer
- Advanced analytics and reporting
- Export to CSV/PDF
- Budget tracking
- Recurring transactions
- Email notifications
- Two-factor authentication
- API rate limiting
- Kubernetes deployment manifests

### Under Consideration
- Mobile app (React Native)
- Multi-currency support
- Bank account integration
- Receipt image uploads
- Machine learning for category suggestions
- GraphQL API
- Real-time notifications via WebSocket

---

**Legend:**
- `Added`: New features
- `Changed`: Changes in existing functionality
- `Deprecated`: Soon-to-be removed features
- `Removed`: Removed features
- `Fixed`: Bug fixes
- `Security`: Security improvements

