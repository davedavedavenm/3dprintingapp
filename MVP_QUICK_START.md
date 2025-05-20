# 3D Print Quoting System - MVP Quick Start Guide

## 🚀 Quick Launch Instructions

### Prerequisites
- Node.js 18+ installed
- Docker and Docker Compose installed
- 8GB+ RAM available

### 1. Start the Application

```bash
# Navigate to project directory
cd C:\Users\Dave\OneDrive\Claude\3D-Print-Quoting-Website

# Start all services with Docker Compose
docker-compose up -d --build

# Alternatively, start development servers separately:

# Backend (Terminal 1)
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
python main.py

# Frontend (Terminal 2) 
cd frontend
npm install
npm start
```

### 2. Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Documentation:** http://localhost:5000/docs

### 3. Test the MVP Flow

#### Step 1: Upload STL Files
1. Navigate to Upload page
2. Drag and drop STL files or click to browse
3. Watch real-time upload progress
4. Verify file validation and preview

#### Step 2: Configure Quote
1. Navigate to Quote page (or click "Next" from Upload)
2. Select material from dropdown
3. Configure print settings:
   - Infill percentage (0-100%)
   - Layer height (0.1-0.3mm)
   - Support material toggle
   - Quantity (1-100)
4. Watch real-time price updates

#### Step 3: Review Quote
1. Review comprehensive quote summary
2. Check detailed price breakdown
3. Verify print specifications
4. See delivery estimates

#### Step 4: Save/Export Quote
1. Save quote for later reference
2. Export as JSON (optional)
3. Proceed to payment (PayPal integration)

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

## 📊 MVP Success Indicators

### ✅ Functional Tests
- [ ] File upload completes successfully
- [ ] Material selection works correctly
- [ ] Price calculation updates in real-time
- [ ] Quote summary displays properly
- [ ] Navigation between pages works smoothly
- [ ] Error messages are clear and helpful

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

### Debug Information
- **Browser Console:** F12 → Console tab
- **Network Requests:** F12 → Network tab
- **Backend Logs:** Check terminal output
- **Redux State:** Use Redux DevTools

## 📞 Support & Next Steps

### Ready for Production
Once MVP testing is complete:
1. Complete PayPal payment integration
2. Set up production deployment
3. Configure monitoring and alerts
4. Create user documentation

### Contact Information
- **Technical Issues:** Check GitHub issues
- **Feature Requests:** Create feature branch
- **Documentation:** Update project README

---

**🎉 The MVP is ready for comprehensive testing!**
**🎯 Focus on the core user journey: Upload → Configure → Quote → Review**
