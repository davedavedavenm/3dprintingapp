# 3D Print Quoting System - Quick Setup Guide

## Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn
- PayPal Developer Account (for payment functionality)

## Quick Start

### 1. Backend Setup
```bash
cd backend
pip install flask flask-cors structlog
# OR create virtual environment:
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install flask flask-cors structlog
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

### 3. Environment Configuration
1. Copy `.env.template` to `.env` in both `frontend/` and `backend/` directories
2. Update PayPal credentials in both `.env` files:
   - Get credentials from [PayPal Developer Dashboard](https://developer.paypal.com/)
   - For development, use sandbox credentials

### 4. Start Development Servers

**Backend (Terminal 1):**
```bash
cd backend
python main.py
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm start
```

### 5. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## PayPal Integration Setup

### Required Credentials
1. **PAYPAL_CLIENT_ID** - From your PayPal app
2. **PAYPAL_CLIENT_SECRET** - From your PayPal app  
3. **PAYPAL_WEBHOOK_ID** - From your webhook configuration

### Environment Files

**Backend (.env):**
```
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
PAYPAL_SANDBOX=true
```

**Frontend (.env):**
```
REACT_APP_PAYPAL_CLIENT_ID=your_sandbox_client_id
REACT_APP_PAYPAL_ENVIRONMENT=sandbox
```

## Testing the Application

1. **Upload STL File**
   - Drag and drop an STL file on the upload page
   - Or use the file picker

2. **Configure Quote**
   - Select material (PLA, ABS, PETG, etc.)
   - Set infill percentage
   - Choose layer height
   - Adjust quantity

3. **Review Quote**
   - View detailed pricing breakdown
   - Check estimated delivery time

4. **Process Payment**
   - Fill in customer information
   - Click PayPal button
   - Complete payment in sandbox

5. **Order Confirmation**
   - View order details
   - Download receipt
   - Track order status

## Troubleshooting

### Backend Issues
- **"Module not found"**: Install missing Python packages
- **"PayPal credentials not configured"**: Check .env file
- **"CORS error"**: Ensure CORS_ORIGINS includes frontend URL

### Frontend Issues  
- **"PayPal button not loading"**: Check console for API errors
- **"Network error"**: Ensure backend is running on port 5000
- **"TypeScript errors"**: Run `npm run type-check` to identify issues

### PayPal Issues
- **"Invalid client ID"**: Verify sandbox vs live credentials
- **"Authentication failed"**: Check client secret is correct
- **"Webhook errors"**: Verify webhook URL and signature setup

## Production Deployment

### Before Going Live
1. Get PayPal live credentials (not sandbox)
2. Set up SSL certificate
3. Configure production domain
4. Update webhook URLs to production endpoints
5. Set `PAYPAL_SANDBOX=false`

### Security Checklist
- [ ] Environment variables secured
- [ ] PayPal webhook signature verification enabled
- [ ] HTTPS enforced for all payment endpoints
- [ ] Rate limiting configured
- [ ] Error logging implemented

## Development Features

### Backend Features
- ✅ RESTful API with Flask
- ✅ PayPal Smart Checkout integration  
- ✅ File upload handling
- ✅ Quote calculation engine
- ✅ Error handling and logging
- ✅ CORS configuration

### Frontend Features
- ✅ React with TypeScript
- ✅ Material-UI design system
- ✅ Redux state management
- ✅ PayPal payment integration
- ✅ Real-time quote calculations
- ✅ Responsive design
- ✅ Error boundaries

### API Endpoints
- `GET /health` - Health check
- `POST /api/v1/upload` - File upload
- `POST /api/v1/quote/calculate` - Quote calculation
- `POST /api/v1/payment/create-order` - Create PayPal order
- `POST /api/v1/payment/capture-order` - Capture payment
- `GET /api/v1/payment/order/{id}` - Order status

## Support Resources

- [PayPal Developer Docs](https://developer.paypal.com/docs/)
- [Material-UI Documentation](https://mui.com/)
- [React Documentation](https://reactjs.org/)
- [Flask Documentation](https://flask.palletsprojects.com/)

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

## Next Steps

1. **Complete PayPal Setup** - Configure sandbox credentials
2. **Test Payment Flow** - End-to-end testing
3. **Customize Branding** - Update colors, logos, text
4. **Add Features** - Email notifications, PDF receipts
5. **Deploy to Production** - Set up hosting and domain

---

For detailed PayPal setup instructions, see: `implementation_plan/PAYPAL_SETUP_GUIDE.md`
