# PayPal Integration Setup Guide

## 1. PayPal Developer Account Setup

### Step 1: Create PayPal Developer Account
1. Go to [PayPal Developer](https://developer.paypal.com/)
2. Log in with your PayPal account or create one
3. Navigate to "My Apps & Credentials"

### Step 2: Create Sandbox Application
1. Click "Create App" button
2. Choose "Sandbox" environment
3. Enter application name: "3D Print Quoting System"
4. Select "Merchant" account type
5. Choose features: "Accept Payments", "Send Payments"
6. Click "Create App"

### Step 3: Get Credentials
After creating the app, you'll see:
- **Client ID**: Copy this value
- **Client Secret**: Click "Show" and copy this value

### Step 4: Create Webhook
1. Go to "Webhooks" section
2. Click "Create webhook"
3. Webhook URL: `https://your-domain.com/api/v1/payment/webhook`
4. Select these events:
   - CHECKOUT.ORDER.APPROVED
   - PAYMENT.CAPTURE.COMPLETED
   - PAYMENT.CAPTURE.DENIED
   - PAYMENT.CAPTURE.REFUNDED
5. Save webhook
6. Copy the **Webhook ID** from the webhook details

## 2. Environment Configuration

### Backend (.env)
```bash
# PayPal Configuration
PAYPAL_CLIENT_ID=your_sandbox_client_id_here
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret_here
PAYPAL_WEBHOOK_ID=your_webhook_id_here
PAYPAL_SANDBOX=true
```

### Frontend (.env)
```bash
# PayPal Configuration
REACT_APP_PAYPAL_CLIENT_ID=your_sandbox_client_id_here
REACT_APP_PAYPAL_ENVIRONMENT=sandbox
```

## 3. Testing PayPal Integration

### Sandbox Test Accounts
PayPal provides test accounts for sandbox testing:

**Buyer Account:**
- Email: usually provided by PayPal sandbox
- Password: usually provided by PayPal sandbox

**Merchant Account:**
- Your main PayPal account (in sandbox mode)

### Test Payment Flow
1. Start the application
2. Upload an STL file
3. Configure print options
4. Generate a quote
5. Proceed to payment
6. Click PayPal button
7. Log in with sandbox buyer account
8. Complete payment
9. Verify order confirmation

### Test Credit Cards
PayPal sandbox accepts these test cards:
- **Visa:** 4111111111111111
- **MasterCard:** 5555555555554444
- **American Express:** 378282246310005

## 4. Troubleshooting

### Common Issues

**"PayPal client ID not configured"**
- Check REACT_APP_PAYPAL_CLIENT_ID in frontend .env
- Ensure the value matches your PayPal app Client ID

**"Authentication failed"**
- Verify PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in backend .env
- Ensure both values are from the same PayPal app

**"Invalid signature" webhook errors**
- Check PAYPAL_WEBHOOK_ID matches your webhook configuration
- Verify webhook URL is correctly set in PayPal dashboard

**Payment button not loading**
- Check browser console for JavaScript errors
- Verify internet connection
- Ensure PayPal domains are not blocked

## 5. Production Deployment

### Step 1: Create Live Application
1. In PayPal Developer dashboard, switch to "Live" environment
2. Create new app for production
3. Get live Client ID and Client Secret

### Step 2: Update Environment Variables
```bash
# Production Backend
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_CLIENT_SECRET=your_live_client_secret
PAYPAL_WEBHOOK_ID=your_live_webhook_id
PAYPAL_SANDBOX=false

# Production Frontend
REACT_APP_PAYPAL_CLIENT_ID=your_live_client_id
REACT_APP_PAYPAL_ENVIRONMENT=live
```

### Step 3: SSL Certificate
- Ensure your production server has valid SSL certificate
- PayPal requires HTTPS for live transactions

### Step 4: Webhook Configuration
- Update webhook URL to production domain
- Test webhook endpoint is accessible

## 6. Security Considerations

- Never expose PayPal Client Secret in frontend code
- Always validate webhook signatures server-side
- Use HTTPS for all payment endpoints
- Implement rate limiting on payment endpoints
- Log all payment transactions for audit trail
- Regularly rotate API credentials

## 7. Monitoring and Analytics

### Recommended Monitoring
- Payment success/failure rates
- Transaction volumes
- Error patterns
- Response times

### PayPal Dashboard
- Monitor transactions in PayPal Merchant dashboard
- Review payment reports and analytics
- Set up notifications for important events

---

## Quick Start Commands

```bash
# 1. Install dependencies
cd frontend && npm install
cd backend && pip install -r requirements.txt

# 2. Configure environment files
cp frontend/.env.template frontend/.env
cp backend/.env.template backend/.env
# Edit .env files with your PayPal credentials

# 3. Start development servers
# Backend
cd backend && python main.py

# Frontend (new terminal)
cd frontend && npm start

# 4. Test the application
# Open http://localhost:3000
# Follow the upload -> quote -> payment flow
```

For additional support, refer to:
- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal Checkout SDK](https://developer.paypal.com/sdk/js/)
- [Project README.md](./README.md)
