# 3D Print Quoting System - Technical Implementation Guide

## Project Architecture Overview

### System Components Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend Layer (React)                   │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │   Upload        │   Configuration │   Payment       │   │
│  │   Component     │   Panel         │   Integration   │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│                   Backend Layer (Python)                   │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │   Flask/FastAPI │   File Handler  │   Payment       │   │
│  │   Server        │   Service       │   Processor     │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │ CLI Integration
┌─────────────────────────────────────────────────────────────┐
│                Processing Layer (PrusaSlicer)              │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │   STL Slicing   │   G-code        │   Metadata      │   │
│  │   Engine        │   Generator     │   Extraction    │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Backend Implementation Strategy

### Core Service Architecture
```python
# Primary application structure
app/
├── main.py              # Flask/FastAPI entry point
├── services/
│   ├── slicer_service.py    # PrusaSlicer CLI integration
│   ├── pricing_service.py   # Quote calculation logic
│   ├── payment_service.py   # PayPal integration
│   └── file_service.py      # STL file management
├── models/
│   ├── quote.py             # Quote data model
│   ├── order.py             # Order processing model
│   └── user.py              # User session model
├── routes/
│   ├── upload.py            # File upload endpoints
│   ├── quote.py             # Pricing endpoints
│   └── payment.py           # Payment processing
└── utils/
    ├── gcode_parser.py      # G-code analysis
    ├── validators.py        # Input validation
    └── helpers.py           # Utility functions
```

### PrusaSlicer Integration Protocol
```python
class SlicerService:
    """
    Advanced PrusaSlicer CLI integration service
    Handles STL processing and G-code generation
    """
    
    def __init__(self, slicer_path="/usr/bin/prusa-slicer"):
        self.slicer_path = slicer_path
        self.config_profiles = self._load_profiles()
    
    async def slice_stl(self, stl_path, config_params):
        """
        Execute PrusaSlicer CLI with optimization parameters
        
        Args:
            stl_path (str): Path to uploaded STL file
            config_params (dict): Slicing configuration
            
        Returns:
            SlicingResult: Comprehensive analysis data
        """
        command = self._build_slicer_command(stl_path, config_params)
        result = await self._execute_async_command(command)
        return self._parse_slicing_output(result)
    
    def _build_slicer_command(self, stl_path, params):
        """Construct optimized PrusaSlicer command string"""
        base_cmd = [
            self.slicer_path,
            "--export-gcode",
            "--output-filename-format", "[input_filename_base].gcode",
            "--layer-height", str(params.get('layer_height', 0.2)),
            "--infill", str(params.get('infill', 20)),
            "--filament-type", params.get('material', 'PLA')
        ]
        base_cmd.append(stl_path)
        return base_cmd
```

### G-code Analysis Implementation
```python
class GCodeAnalyzer:
    """
    Comprehensive G-code parsing and analysis service
    Extracts precise timing and material usage data
    """
    
    def analyze_gcode(self, gcode_path):
        """
        Parse G-code file for accurate printing metrics
        
        Returns:
            AnalysisResult: Detailed printing specifications
        """
        with open(gcode_path, 'r') as file:
            gcode_content = file.read()
        
        return {
            'print_time_minutes': self._extract_print_time(gcode_content),
            'filament_used_grams': self._extract_filament_usage(gcode_content),
            'estimated_layers': self._count_layers(gcode_content),
            'complexity_score': self._calculate_complexity(gcode_content)
        }
    
    def _extract_print_time(self, gcode_content):
        """Parse estimated print time from G-code comments"""
        time_pattern = r'; estimated printing time.*?(\d+)h (\d+)m (\d+)s'
        match = re.search(time_pattern, gcode_content)
        if match:
            hours, minutes, seconds = map(int, match.groups())
            return hours * 60 + minutes + seconds / 60
        return 0
    
    def _extract_filament_usage(self, gcode_content):
        """Calculate filament usage from G-code extrusion data"""
        filament_pattern = r'; filament used.*?(\d+\.?\d*)mm'
        match = re.search(filament_pattern, gcode_content)
        if match:
            filament_length_mm = float(match.group(1))
            # Convert to grams based on filament density
            return filament_length_mm * FILAMENT_DENSITY_PLA / 1000
        return 0
```

### Pricing Engine Implementation
```python
class PricingEngine:
    """
    Dynamic pricing calculation with configurable parameters
    Supports multiple material types and business logic
    """
    
    MATERIAL_RATES = {
        'PLA': 0.025,    # $ per gram
        'ABS': 0.028,
        'PETG': 0.035,
        'TPU': 0.045
    }
    
    TIME_RATE = 0.15     # $ per minute
    OVERHEAD_MULTIPLIER = 1.35
    
    def calculate_quote(self, analysis_data, material_type, options):
        """
        Generate comprehensive pricing quote
        
        Args:
            analysis_data: G-code analysis results
            material_type: Selected material
            options: Additional printing options
            
        Returns:
            QuoteBreakdown: Detailed cost analysis
        """
        material_cost = self._calculate_material_cost(
            analysis_data['filament_used_grams'], 
            material_type
        )
        
        time_cost = self._calculate_time_cost(
            analysis_data['print_time_minutes']
        )
        
        complexity_adjustment = self._apply_complexity_modifier(
            analysis_data['complexity_score']
        )
        
        base_total = (material_cost + time_cost) * complexity_adjustment
        final_total = base_total * self.OVERHEAD_MULTIPLIER
        
        return {
            'material_cost': round(material_cost, 2),
            'time_cost': round(time_cost, 2),
            'complexity_adjustment': round(complexity_adjustment, 3),
            'subtotal': round(base_total, 2),
            'total': round(final_total, 2),
            'breakdown': self._generate_detailed_breakdown(
                material_cost, time_cost, complexity_adjustment, final_total
            )
        }
```

## Frontend Implementation Framework

### React Component Architecture
```jsx
// Primary application structure
src/
├── components/
│   ├── STLUpload/
│   │   ├── UploadZone.jsx       # Drag-and-drop interface
│   │   ├── FileValidator.jsx    # Client-side validation
│   │   └── ProgressIndicator.jsx
│   ├── QuoteConfiguration/
│   │   ├── MaterialSelector.jsx
│   │   ├── InfillSlider.jsx
│   │   └── OptionsPanel.jsx
│   ├── QuoteSummary/
│   │   ├── PriceBreakdown.jsx
│   │   ├── PrintDetails.jsx
│   │   └── ActionButtons.jsx
│   └── Payment/
│       ├── PayPalButton.jsx
│       └── OrderConfirmation.jsx
├── services/
│   ├── api.js              # Backend communication
│   ├── paypal.js           # Payment integration
│   └── validation.js       # Form validation
├── hooks/
│   ├── useFileUpload.js    # Upload state management
│   ├── useQuoteCalculation.js
│   └── usePayment.js
└── utils/
    ├── formatters.js       # Data formatting
    └── constants.js        # Application constants
```

### State Management Strategy
```jsx
// Centralized quote management hook
export const useQuoteCalculation = () => {
    const [state, setState] = useState({
        file: null,
        configuration: {
            material: 'PLA',
            infill: 20,
            layer_height: 0.2
        },
        quote: null,
        loading: false,
        error: null
    });
    
    const updateConfiguration = useCallback((updates) => {
        setState(prev => ({
            ...prev,
            configuration: { ...prev.configuration, ...updates }
        }));
        
        // Trigger re-calculation if file exists
        if (state.file) {
            calculateQuote();
        }
    }, [state.file]);
    
    const calculateQuote = useCallback(async () => {
        if (!state.file) return;
        
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            const formData = new FormData();
            formData.append('stl_file', state.file);
            formData.append('config', JSON.stringify(state.configuration));
            
            const response = await api.post('/quote/calculate', formData);
            setState(prev => ({ 
                ...prev, 
                quote: response.data,
                loading: false 
            }));
        } catch (error) {
            setState(prev => ({ 
                ...prev, 
                error: error.message,
                loading: false 
            }));
        }
    }, [state.file, state.configuration]);
    
    return {
        ...state,
        updateConfiguration,
        calculateQuote,
        setFile: (file) => setState(prev => ({ ...prev, file }))
    };
};
```

## PayPal Integration Implementation

### Backend Payment Processing
```python
class PayPalService:
    """
    Secure PayPal payment processing integration
    Handles order creation and payment verification
    """
    
    def __init__(self, client_id, client_secret, sandbox=True):
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = self._get_base_url(sandbox)
        self.access_token = None
    
    async def create_order(self, quote_data, customer_info):
        """
        Create PayPal order for 3D printing quote
        
        Args:
            quote_data: Quote calculation results
            customer_info: Customer details
            
        Returns:
            OrderCreationResult: PayPal order information
        """
        access_token = await self._get_access_token()
        
        order_payload = {
            "intent": "CAPTURE",
            "purchase_units": [{
                "amount": {
                    "currency_code": "USD",
                    "value": str(quote_data['total'])
                },
                "description": f"3D Print Order - {customer_info['email']}"
            }]
        }
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        response = await self._make_request(
            f"{self.base_url}/v2/checkout/orders",
            "POST",
            order_payload,
            headers
        )
        
        return response
```

### Frontend Payment Component
```jsx
const PayPalButton = ({ quote, onSuccess, onError }) => {
    const [sdkReady, setSdkReady] = useState(false);
    
    useEffect(() => {
        const addPayPalScript = () => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.REACT_APP_PAYPAL_CLIENT_ID}&currency=USD`;
            script.async = true;
            script.onload = () => setSdkReady(true);
            document.body.appendChild(script);
        };
        
        if (!window.paypal) {
            addPayPalScript();
        } else {
            setSdkReady(true);
        }
    }, []);
    
    const createOrder = async (data, actions) => {
        try {
            const response = await api.post('/payment/create-order', {
                quote_id: quote.id,
                amount: quote.total
            });
            
            return response.data.order_id;
        } catch (error) {
            onError(error);
            throw error;
        }
    };
    
    const onApprove = async (data, actions) => {
        try {
            const response = await api.post('/payment/capture-order', {
                order_id: data.orderID
            });
            
            onSuccess(response.data);
        } catch (error) {
            onError(error);
        }
    };
    
    if (!sdkReady) {
        return <div>Loading PayPal...</div>;
    }
    
    return (
        <PayPalButtons
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onError}
            style={{
                layout: 'vertical',
                color: 'blue',
                shape: 'pill'
            }}
        />
    );
};
```

## Deployment Configuration

### Docker Implementation
```dockerfile
# Multi-stage build for production optimization
FROM python:3.11-slim as backend-builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install PrusaSlicer
RUN wget https://github.com/prusa3d/PrusaSlicer/releases/download/version_2.6.1/PrusaSlicer-2.6.1+linux-x64-GTK3-202309111016.tar.bz2 \
    && tar -xjf PrusaSlicer-2.6.1+linux-x64-GTK3-202309111016.tar.bz2 \
    && mv PrusaSlicer-2.6.1+linux-x64-GTK3-202309111016 /opt/prusa-slicer

# Set up Python environment
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Frontend build stage
FROM node:18-alpine as frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ .
RUN npm run build

# Production stage
FROM python:3.11-slim as production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy PrusaSlicer
COPY --from=backend-builder /opt/prusa-slicer /opt/prusa-slicer
ENV PATH="/opt/prusa-slicer:${PATH}"

# Set up application
WORKDIR /app
COPY --from=backend-builder /app .
COPY --from=frontend-builder /app/dist ./static
COPY backend/ .

EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "main:app"]
```

### Ubuntu Deployment Script
```bash
#!/bin/bash
# deploy.sh - Automated deployment script

set -e

echo "Starting 3D Print Quoting System deployment..."

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
mkdir -p ~/3d-print-quoting && cd ~/3d-print-quoting

# Download configuration files
curl -O https://raw.githubusercontent.com/your-repo/3d-print-quoting/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/your-repo/3d-print-quoting/main/.env.example

# Set up environment variables
cp .env.example .env
echo "Please edit .env file with your configuration"
nano .env

# Start services
docker-compose up -d

echo "Deployment complete! Application available at http://localhost:5000"
```

## Quality Assurance Protocols

### Testing Framework Implementation
```python
# tests/test_slicer_service.py
import pytest
from unittest.mock import patch, MagicMock
from services.slicer_service import SlicerService

class TestSlicerService:
    """Comprehensive testing for PrusaSlicer integration"""
    
    @pytest.fixture
    def slicer_service(self):
        return SlicerService("/usr/bin/prusa-slicer")
    
    @patch('services.slicer_service.subprocess.run')
    async def test_successful_slicing(self, mock_subprocess, slicer_service):
        """Test successful STL slicing workflow"""
        mock_subprocess.return_value = MagicMock(
            returncode=0,
            stdout="Slicing completed successfully"
        )
        
        result = await slicer_service.slice_stl(
            "test.stl",
            {"material": "PLA", "infill": 20}
        )
        
        assert result.success is True
        assert result.gcode_path is not None
    
    async def test_invalid_stl_handling(self, slicer_service):
        """Test error handling for invalid STL files"""
        with pytest.raises(ValidationError):
            await slicer_service.slice_stl("invalid.stl", {})
```

### Performance Monitoring
```python
# monitoring/performance_tracker.py
import time
import logging
from functools import wraps

def track_performance(operation_name):
    """Decorator for performance monitoring"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                execution_time = time.time() - start_time
                
                logging.info(f"{operation_name} completed in {execution_time:.2f}s")
                return result
            except Exception as e:
                execution_time = time.time() - start_time
                logging.error(f"{operation_name} failed after {execution_time:.2f}s: {str(e)}")
                raise
        return wrapper
    return decorator

# Usage example
@track_performance("STL_SLICING")
async def slice_stl_file(file_path, config):
    # Implementation
    pass
```

This comprehensive technical implementation guide ensures systematic development of the 3D print quoting system with emphasis on reliability, maintainability, and optimal performance characteristics aligned with the client's business requirements.
