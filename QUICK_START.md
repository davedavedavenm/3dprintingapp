# 3D Print Quoting System - Quick Start Guide

## 🚀 Quick Launch Instructions

### Prerequisites
- Node.js 18+ installed
- Python 3.8+ installed
- Docker and Docker Compose installed (optional, for containerized deployment)
- PayPal Developer Account (for payment functionality)
- 8GB+ RAM recommended

### Option 1: Start with Docker Compose (Recommended)

```bash
# Navigate to project directory
cd C:\Users\Dave\OneDrive\Claude\3D-Print-Quoting-Website

# Start all services with Docker Compose
docker-compose up -d --build
```

### Option 2: Start Development Servers Separately

**Backend Setup:**
```bash
# Navigate to backend directory
cd C:\Users\Dave\OneDrive\Claude\3D-Print-Quoting-Website\backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Linux/macOS
venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt

# Start development server
python main.py            # Full version
# OR
python main_simple.py     # Simplified version for quick testing
```

**Frontend Setup:**
```bash
# Navigate to frontend directory
cd C:\Users\Dave\OneDrive\Claude\3D-Print-Quoting-Website\frontend

# Install dependencies
npm install

# Start development server
npm start
```

### Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Documentation:** http://localhost:5000/docs
- **Health Check:** http://localhost:5000/health

## Core Application Workflow

### Step 1: Upload STL Files
1. Navigate to Upload page
2. Drag and drop STL files or click to browse
3. Watch real-time upload progress
4. Verify file validation and preview

### Step 2: Configure Quote
1. Navigate to Quote page (or click "Next" from Upload)
2. Select material from dropdown (PLA, ABS, PETG, TPU)
3. Configure print settings:
   - Infill percentage (0-100%)
   - Layer height (0.1-0.3mm)
   - Support material toggle
   - Quantity (1-100)
4. Watch real-time price updates

### Step 3: Review Quote
1. Review comprehensive quote summary
2. Check detailed price breakdown
3. Verify print specifications
4. See delivery estimates

### Step 4: Complete Payment
1. Proceed to payment page
2. Fill in customer information
3. Click PayPal button
4. Complete PayPal checkout process
5. View order confirmation

## Environment Configuration

### 1. Backend Environment Setup
Copy `.env.template` to `.env` in the backend directory:

```bash
cd backend
cp .env.template .env
```

Edit the `.env` file with appropriate values:

```
# Security
SECRET_KEY=your_secure_secret_key_here

# Application
UPLOAD_FOLDER=uploads
GCODE_FOLDER=temp
MAX_CONTENT_LENGTH=104857600

# PrusaSlicer
PRUSA_SLICER_PATH=/path/to/prusa-slicer

# Pricing Configuration
PLA_RATE=0.025
ABS_RATE=0.028
PETG_RATE=0.035
TPU_RATE=0.045
TIME_RATE=0.15
OVERHEAD_MULTIPLIER=1.35

# PayPal Integration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
PAYPAL_SANDBOX=true
```

### 2. Frontend Environment Setup
Copy `.env.template` to `.env` in the frontend directory:

```bash
cd frontend
cp .env.template .env
```

Edit the `.env` file with appropriate values:

```
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_PAYPAL_CLIENT_ID=your_paypal_client_id
REACT_APP_PAYPAL_ENVIRONMENT=sandbox
```

## 🧪 Testing Scenarios

### Basic Upload Test
- **Test Files:** Use any STL file <100MB
- **Expected:** Successful upload with progress tracking
- **Validation:** File appears in upload queue

### Material Selection Test
- **Action:** Change material type
- **Expected:** Price updates automatically
- **Validation:** Material properties display correctly

### Configuration Updates
- **Action:** Adjust infill, layer height, quantity
- **Expected:** Real-time price recalculation
- **Validation:** Price breakdown updates immediately

### Responsive Design Test
- **Action:** Resize browser window
- **Expected:** Layout adapts smoothly
- **Mobile:** Test on mobile device/simulator

### Error Handling Test
- **Action:** Upload invalid file type
- **Expected:** Clear error message
- **Validation:** System remains stable

### Payment Flow Test
- **Action:** Complete payment process
- **Expected:** PayPal checkout loads and processes payment
- **Validation:** Order confirmation displays after successful payment

## 🔧 Development Commands

### Frontend Development
```bash
cd frontend

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### Backend Development
```bash
cd backend

# Start development server
python main.py

# Run tests
pytest

# Generate API docs
python generate_docs.py

# Database migrations
python manage_db.py migrate
```

### Docker Commands
```bash
# Build all services
docker-compose build

# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Reset database
docker-compose down -v
docker-compose up -d
```

## PayPal Integration Setup

### Required Credentials
1. **PAYPAL_CLIENT_ID** - From your PayPal app
2. **PAYPAL_CLIENT_SECRET** - From your PayPal app  
3. **PAYPAL_WEBHOOK_ID** - From your webhook configuration

### Sandbox Test Accounts
PayPal provides test accounts for sandbox testing:

**Buyer Account:**
- Email: provided by PayPal sandbox
- Password: provided by PayPal sandbox

**Test Credit Cards (Sandbox):**
- **Visa:** 4111111111111111
- **MasterCard:** 5555555555554444
- **American Express:** 378282246310005

For detailed PayPal setup instructions, see: `implementation_plan/PAYPAL_SETUP_GUIDE.md`

## 🐛 Troubleshooting

### Common Issues

**Upload Not Working:**
- Check file size (<100MB)
- Verify file type (.stl, .obj, .ply)
- Check backend server is running

**Quote Not Calculating:**
- Ensure file is uploaded successfully
- Verify material is selected
- Check browser console for errors

**Styling Issues:**
- Clear browser cache
- Check Material-UI theme loading
- Verify CSS compilation

**Backend Errors:**
- Check Python dependencies
- Verify database connection
- Review backend logs

**PayPal Button Not Loading:**
- Check PayPal client ID in frontend .env
- Verify internet connection
- Check browser console for errors

### Debug Information
- **Browser Console:** F12 → Console tab
- **Network Requests:** F12 → Network tab
- **Backend Logs:** Check terminal output
- **Redux State:** Use Redux DevTools

## Project Structure
```
3D-Print-Quoting-Website/
├── backend/
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic services  
│   ├── models/          # Data models
│   ├── utils/           # Utility functions
│   └── main.py          # Application entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── store/       # Redux store
│   │   └── theme/       # UI theme
│   └── public/          # Static assets
├── docker-compose.yml   # Container orchestration
└── docs/               # Documentation
```

## 📊 MVP Success Indicators

### ✅ Functional Tests
- [ ] File upload completes successfully
- [ ] Material selection works correctly
- [ ] Price calculation updates in real-time
- [ ] Quote summary displays properly
- [ ] Navigation between pages works smoothly
- [ ] Error messages are clear and helpful
- [ ] Payment process completes successfully

### ✅ Performance Tests
- [ ] Upload progress shows accurately
- [ ] Quote calculation completes within 3 seconds
- [ ] Page load times under 2 seconds
- [ ] Smooth animations and transitions
- [ ] No console errors

### ✅ User Experience Tests
- [ ] Intuitive navigation flow
- [ ] Clear visual feedback
- [ ] Responsive on mobile devices
- [ ] Accessible with screen readers
- [ ] Professional appearance

## Production Deployment

### Before Going Live
1. Get PayPal live credentials (not sandbox)
2. Set up SSL certificate
3. Configure production domain
4. Update webhook URLs to production endpoints
5. Set `PAYPAL_SANDBOX=false` in backend .env
6. Set `REACT_APP_PAYPAL_ENVIRONMENT=live` in frontend .env

### Security Checklist
- [ ] Environment variables secured
- [ ] PayPal webhook signature verification enabled
- [ ] HTTPS enforced for all payment endpoints
- [ ] Rate limiting configured
- [ ] Error logging implemented

---

## Support Resources

- [PayPal Developer Docs](https://developer.paypal.com/docs/)
- [Material-UI Documentation](https://mui.com/)
- [React Documentation](https://reactjs.org/)
- [Flask Documentation](https://flask.palletsprojects.com/)

**🎉 The 3D Print Quoting System is ready for comprehensive testing!**
**🎯 Focus on the core user journey: Upload → Configure → Quote → Payment → Confirmation**
