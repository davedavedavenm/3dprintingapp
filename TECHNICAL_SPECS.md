# Technical Specifications - 3D Print Quoting Website

## System Architecture Overview

### Core Components Architecture

#### Backend Service Layer
```
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway Layer                        │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │   File Upload   │   Pricing API   │   User Management   │
│  │    Service      │     Service     │     Service     │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                Processing Engine Layer                      │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │   STL Parser    │  Geometry       │   Price         │   │
│  │   Module        │  Analyzer       │   Calculator    │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Data Persistence Layer                   │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │   PostgreSQL    │     Redis       │   File Storage   │
│  │   (Primary DB)  │    (Cache)      │   (STL Files)   │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## STL Processing Engine Specifications

### Geometry Analysis Algorithms

#### Volume Calculation
- **Method**: Mesh triangulation and signed volume computation
- **Accuracy**: ±0.01mm³ tolerance
- **Performance Target**: <500ms for files <50MB

#### Surface Area Analysis
- **Implementation**: Triangle mesh surface integration
- **Complexity Detection**: Overhang angle analysis (>45°)
- **Support Structure Estimation**: Automated support volume calculation

#### Print Time Estimation
```
Total Print Time = (Layer Height × Volume) / Print Speed + 
                  Travel Time + Support Generation Time
```

### File Processing Pipeline
1. **Upload Validation**
   - File type verification (.stl, .obj)
   - Size constraints (max 100MB)
   - Malware scanning integration

2. **Mesh Processing**
   - Topology validation
   - Mesh repair algorithms
   - Optimization for web display

3. **Geometry Analysis**
   - Bounding box calculation
   - Volume and surface area computation
   - Complexity scoring algorithm

## Pricing Algorithm Framework

### Cost Calculation Components

#### Material Costs
```javascript
materialCost = {
  PLA: 0.025, // $/gram
  ABS: 0.028, // $/gram
  PETG: 0.035, // $/gram
  TPU: 0.045  // $/gram
}

filamentWeight = volume * materialDensity * infillPercentage
```

#### Print Time Factors
- **Layer Resolution**: Higher resolution = longer print time
- **Infill Density**: 10-100% variable impact
- **Support Structures**: Additional 15-30% time overhead

#### Operational Overhead
- Machine usage rate: $2.50/hour
- Labor allocation: 15% of total cost
- Profit margin: 25-40% markup

### Dynamic Pricing Engine
- Real-time material cost adjustment
- Queue length impact factors
- Volume discount algorithms
- Rush order premium calculations

## Database Schema Design

### Core Tables
```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- STL Files table
CREATE TABLE stl_files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Geometry Analysis table
CREATE TABLE geometry_analysis (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES stl_files(id),
    volume DECIMAL(12,6),
    surface_area DECIMAL(12,6),
    bounding_box_volume DECIMAL(12,6),
    complexity_score INTEGER,
    analysis_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quotes table
CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    file_id INTEGER REFERENCES stl_files(id),
    material_type VARCHAR(50),
    infill_percentage INTEGER,
    layer_height DECIMAL(4,2),
    estimated_print_time INTEGER, -- minutes
    material_cost DECIMAL(8,2),
    labor_cost DECIMAL(8,2),
    total_price DECIMAL(8,2),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoint Specifications

### File Upload Endpoints
```
POST /api/v1/files/upload
- Multipart form data support
- Real-time progress tracking
- Immediate validation response

GET /api/v1/files/{fileId}/preview
- Generates 3D thumbnail
- Returns STL viewer configuration
- Caching layer integration
```

### Pricing Endpoints
```
POST /api/v1/quotes/calculate
- Accepts print parameters
- Returns detailed cost breakdown
- Saves quote for future reference

GET /api/v1/quotes/{quoteId}
- Retrieves quote details
- Includes download links
- Status tracking information
```

### User Management Endpoints
```
POST /api/v1/auth/register
- User registration
- Email verification workflow
- Password strength validation

GET /api/v1/users/quotes
- Paginated quote history
- Filter and search capabilities
- Export functionality
```

## Security Implementation Guidelines

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- API rate limiting (100 requests/minute)

### File Security Measures
- Virus scanning on upload
- Sandboxed file processing
- Encrypted file storage
- Automatic file cleanup (30-day retention)

### Data Protection
- AES-256 encryption for sensitive data
- HTTPS/TLS 1.3 enforced
- GDPR compliance mechanisms
- Audit logging for all operations

## Performance Optimization Strategies

### Caching Implementation
- Redis cache for frequent queries
- CDN integration for static assets
- Browser caching headers
- Database query optimization

### Scalability Considerations
- Horizontal scaling capability
- Load balancer configuration
- Database connection pooling
- Asynchronous processing queues

### Monitoring & Observability
- Application Performance Monitoring (APM)
- Error tracking and alerting
- Custom metrics dashboard
- Health check endpoints

## Development Environment Setup

### Required Dependencies
```
Backend (Node.js):
- express (4.18+)
- multer (file uploads)
- node-stl (STL parsing)
- sequelize (ORM)
- jest (testing)

Frontend (React):
- react (18+)
- three.js (3D rendering)
- axios (API calls)
- react-dropzone (file upload)
- material-ui (components)
```

### Docker Configuration
```dockerfile
# Multi-stage build for production optimization
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Testing Strategy

### Unit Testing
- STL processing function validation
- Pricing algorithm accuracy tests
- API endpoint response validation

### Integration Testing
- End-to-end file upload workflow
- Database transaction integrity
- Authentication flow verification

### Performance Testing
- Load testing with concurrent users
- File processing benchmarks
- Memory usage profiling

## Deployment Pipeline

### CI/CD Workflow
1. Code commit triggers automated testing
2. Security vulnerability scanning
3. Docker image building and tagging
4. Staging environment deployment
5. Automated acceptance testing
6. Production deployment approval
7. Blue-green deployment execution
8. Post-deployment monitoring

### Infrastructure as Code
- Terraform for cloud resource provisioning
- Kubernetes manifests for container orchestration
- Monitoring stack configuration (Prometheus/Grafana)

## Quality Assurance Protocols

### Code Quality Standards
- ESLint/Prettier for formatting
- SonarQube code analysis
- Test coverage minimum 80%
- Peer review requirements

### Documentation Requirements
- API documentation (OpenAPI/Swagger)
- Component documentation
- Deployment guides
- User manuals

This technical specification provides the foundation for building a robust, scalable 3D print quoting website with enterprise-level quality standards.
