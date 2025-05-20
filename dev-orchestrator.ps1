# 3D Print Quoting System - Development Environment Orchestrator
# PowerShell Development Automation Script
# Version: 1.0.1 - Fixed string interpolation syntax

[CmdletBinding()]
param(
    [Parameter()]
    [switch]$Backend,
    
    [Parameter()]
    [switch]$Frontend,
    
    [Parameter()]
    [switch]$All,
    
    [Parameter()]
    [switch]$Setup,
    
    [Parameter()]
    [switch]$Clean,
    
    [Parameter()]
    [switch]$Status
)

# Configuration Constants
$ProjectRoot = "C:\Users\Dave\OneDrive\Claude\3D-Print-Quoting-Website"
$BackendPath = Join-Path $ProjectRoot "backend"
$FrontendPath = Join-Path $ProjectRoot "frontend"

# Color-coded Output Functions
function Write-TaskHeader {
    param([string]$Message)
    Write-Host "🚀 $Message" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Progress {
    param([string]$Message)
    Write-Host "⏳ $Message" -ForegroundColor Yellow
}

# Environment Validation
function Test-Prerequisites {
    Write-TaskHeader "Validating Development Prerequisites"
    
    $Prerequisites = @{
        "Python" = { python --version }
        "Node.js" = { node --version }
        "npm" = { npm --version }
    }
    
    $ValidationResults = @{}
    
    foreach ($Tool in $Prerequisites.Keys) {
        try {
            $Version = Invoke-Expression $Prerequisites[$Tool] 2>$null
            if ($Version) {
                Write-Success "${Tool} - $Version"
                $ValidationResults[$Tool] = $true
            } else {
                Write-Error "${Tool} - Not detected"
                $ValidationResults[$Tool] = $false
            }
        } catch {
            Write-Error "${Tool} - Installation error - $($_.Exception.Message)"
            $ValidationResults[$Tool] = $false
        }
    }
    
    return $ValidationResults
}

# Backend Environment Setup
function Initialize-BackendEnvironment {
    Write-TaskHeader "Backend Environment Configuration"
    
    Set-Location $BackendPath
    
    # Virtual Environment Management
    if (Test-Path "venv") {
        Write-Progress "Virtual environment exists. Checking activation..."
    } else {
        Write-Progress "Creating Python virtual environment..."
        python -m venv venv
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Virtual environment created successfully"
        } else {
            Write-Error "Failed to create virtual environment"
            return $false
        }
    }
    
    # Dependency Installation
    if (Test-Path "requirements.txt") {
        Write-Progress "Installing Python dependencies..."
        
        # Activate venv and install dependencies in one command
        $InstallScript = @"
& ".\venv\Scripts\Activate.ps1"
pip install -r requirements.txt --quiet
"@
        Invoke-Expression $InstallScript
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend dependencies installed successfully"
        } else {
            Write-Error "Failed to install backend dependencies"
            return $false
        }
    } else {
        Write-Error "requirements.txt not found"
        return $false
    }
    
    # Environment Configuration
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.template") {
            Write-Progress "Creating environment configuration from template..."
            Copy-Item ".env.template" ".env"
            Write-Success "Environment file created from template"
        } else {
            Write-Progress "Creating default environment configuration..."
            $EnvContent = @"
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=sqlite:///quote_system.db
PAYPAL_SANDBOX=True
PAYPAL_CLIENT_ID=sandbox_client_id
PAYPAL_CLIENT_SECRET=sandbox_secret
CORS_ORIGINS=http://localhost:3000
"@
            $EnvContent | Out-File -FilePath ".env" -Encoding UTF8
            Write-Success "Default environment file created"
        }
    }
    
    return $true
}

# Frontend Environment Setup
function Initialize-FrontendEnvironment {
    Write-TaskHeader "Frontend Environment Configuration"
    
    Set-Location $FrontendPath
    
    # Dependency Installation
    if (Test-Path "package.json") {
        Write-Progress "Installing Node.js dependencies..."
        npm install --silent
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Frontend dependencies installed successfully"
        } else {
            Write-Error "Failed to install frontend dependencies. Trying with verbose output..."
            npm install
            if ($LASTEXITCODE -ne 0) {
                return $false
            }
        }
    } else {
        Write-Error "package.json not found"
        return $false
    }
    
    # Environment Configuration
    if (-not (Test-Path ".env")) {
        Write-Progress "Creating frontend environment configuration..."
        $FrontendEnv = @"
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_ENVIRONMENT=development
REACT_APP_LOG_LEVEL=debug
BROWSER=none
"@
        $FrontendEnv | Out-File -FilePath ".env" -Encoding UTF8
        Write-Success "Frontend environment file created"
    }
    
    return $true
}

# Development Status Monitoring
function Get-DevelopmentStatus {
    Write-TaskHeader "Development Environment Status"
    
    # Check Backend Status
    try {
        $BackendResponse = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
        Write-Success "Backend - Running on port 5000"
    } catch {
        Write-Error "Backend - Not accessible on port 5000"
    }
    
    # Check Frontend Status
    try {
        $FrontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction SilentlyContinue
        Write-Success "Frontend - Running on port 3000"
    } catch {
        Write-Error "Frontend - Not accessible on port 3000"
    }
    
    # Port Utilization Analysis
    $RelevantPorts = @(5000, 3000)
    foreach ($Port in $RelevantPorts) {
        try {
            $Connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
            if ($Connection) {
                Write-Success "Port $Port - In use (Process ID: $($Connection.OwningProcess))"
            } else {
                Write-Error "Port $Port - Available"
            }
        } catch {
            Write-Error "Port $Port - Unable to check status"
        }
    }
}

# Environment Cleanup
function Clear-DevelopmentEnvironment {
    Write-TaskHeader "Cleaning Development Environment"
    
    # Backend Cleanup
    if (Test-Path $BackendPath) {
        Set-Location $BackendPath
        if (Test-Path "venv") {
            Write-Progress "Removing backend virtual environment..."
            Remove-Item "venv" -Recurse -Force -ErrorAction SilentlyContinue
            Write-Success "Backend virtual environment removed"
        }
    }
    
    # Frontend Cleanup
    if (Test-Path $FrontendPath) {
        Set-Location $FrontendPath
        if (Test-Path "node_modules") {
            Write-Progress "Removing frontend node modules..."
            Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
            Write-Success "Frontend node modules removed"
        }
        if (Test-Path "build") {
            Write-Progress "Removing frontend build directory..."
            Remove-Item "build" -Recurse -Force -ErrorAction SilentlyContinue
            Write-Success "Frontend build directory removed"
        }
    }
}

# Main Execution Logic
function Invoke-DevelopmentOrchestrator {
    $Banner = @'
╔══════════════════════════════════════════════════════════════╗
║                3D Print Quoting System                      ║
║              Development Environment Manager                 ║
║                      Version 1.0.1                          ║
╚══════════════════════════════════════════════════════════════╝
'@
    Write-Host $Banner -ForegroundColor Magenta
    
    # Validate Prerequisites
    $Prerequisites = Test-Prerequisites
    if ($Prerequisites.Values -contains $false) {
        Write-Error "Prerequisites validation failed. Please install missing components."
        return
    }
    
    # Process Command Line Arguments
    switch ($true) {
        $Clean {
            Clear-DevelopmentEnvironment
            break
        }
        
        $Status {
            Get-DevelopmentStatus
            break
        }
        
        $Setup {
            $BackendSetup = Initialize-BackendEnvironment
            $FrontendSetup = Initialize-FrontendEnvironment
            
            if ($BackendSetup -and $FrontendSetup) {
                Write-Success "Development environment setup completed successfully!"
                Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
                Write-Host "   • Run: .\dev-orchestrator.ps1 -All (to start both servers)" -ForegroundColor White
                Write-Host "   • Access Frontend: http://localhost:3000" -ForegroundColor White
                Write-Host "   • Access Backend API: http://localhost:5000" -ForegroundColor White
            } else {
                Write-Error "Development environment setup encountered errors"
            }
            break
        }
        
        $Backend {
            Write-TaskHeader "Launching Backend Development Server"
            Set-Location $BackendPath
            Write-Progress "Activating virtual environment and starting Flask server..."
            & ".\venv\Scripts\Activate.ps1"
            python main.py
            break
        }
        
        $Frontend {
            Write-TaskHeader "Launching Frontend Development Server"
            Set-Location $FrontendPath
            Write-Progress "Starting React development server..."
            npm start
            break
        }
        
        $All {
            Write-Progress "Launching backend and frontend servers concurrently..."
            
            # Create simple batch files for parallel execution
            $BackendBatch = @"
@echo off
cd "$BackendPath"
call venv\Scripts\activate.bat
python main.py
"@
            $BackendBatch | Out-File -FilePath "$ProjectRoot\start-backend.bat" -Encoding ASCII
            
            $FrontendBatch = @"
@echo off
cd "$FrontendPath"
npm start
"@
            $FrontendBatch | Out-File -FilePath "$ProjectRoot\start-frontend.bat" -Encoding ASCII
            
            # Launch servers
            Start-Process -FilePath "$ProjectRoot\start-backend.bat" -WindowStyle Normal
            Start-Sleep -Seconds 2
            Start-Process -FilePath "$ProjectRoot\start-frontend.bat" -WindowStyle Normal
            
            Write-Success "Development servers launched in separate windows"
            Write-Host "`n📊 Access Points:" -ForegroundColor Cyan
            Write-Host "   • Frontend Application: http://localhost:3000" -ForegroundColor White
            Write-Host "   • Backend API: http://localhost:5000" -ForegroundColor White
            Write-Host "   • API Documentation: http://localhost:5000/docs" -ForegroundColor White
            
            break
        }
        
        default {
            $HelpText = @'
Usage: .\dev-orchestrator.ps1 [OPTIONS]

Options:
    -Setup      Initialize development environment
    -Backend    Start backend server only
    -Frontend   Start frontend server only
    -All        Start both servers concurrently
    -Status     Check development environment status
    -Clean      Clean development environment

Examples:
    .\dev-orchestrator.ps1 -Setup
    .\dev-orchestrator.ps1 -All
    .\dev-orchestrator.ps1 -Status
'@
            Write-Host $HelpText -ForegroundColor Yellow
            break
        }
    }
}

# Script Entry Point
Invoke-DevelopmentOrchestrator
