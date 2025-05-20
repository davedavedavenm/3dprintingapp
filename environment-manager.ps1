# Development Environment Validation & Launch System
# Version: 1.0.0
# Platform: PowerShell 5.1+

[CmdletBinding()]
param(
    [Parameter()]
    [switch]$ValidateEnvironment,
    
    [Parameter()]
    [switch]$LaunchServers,
    
    [Parameter()]
    [switch]$Status
)

# Configuration Constants
$ProjectRoot = "C:\Users\Dave\OneDrive\Claude\3D-Print-Quoting-Website"
$BackendPath = Join-Path $ProjectRoot "backend"
$FrontendPath = Join-Path $ProjectRoot "frontend"

# Status Monitoring Functions
function Write-StatusHeader {
    param([string]$Message)
    Write-Host "`n🚀 $Message" -ForegroundColor Cyan
    Write-Host ("-" * 60) -ForegroundColor DarkCyan
}

function Write-ValidationSuccess {
    param([string]$Component, [string]$Details)
    Write-Host "✅ ${Component}: $Details" -ForegroundColor Green
}

function Write-ValidationError {
    param([string]$Component, [string]$Details)
    Write-Host "❌ ${Component}: $Details" -ForegroundColor Red
}

function Write-InProgress {
    param([string]$Message)
    Write-Host "⏳ $Message" -ForegroundColor Yellow
}

# Environment Validation Framework
function Test-DevelopmentEnvironment {
    Write-StatusHeader "Development Environment Validation"
    
    $ValidationResults = @{}
    
    # Backend Environment Validation
    Write-InProgress "Validating backend environment..."
    $BackendValid = $true
    
    if (Test-Path (Join-Path $BackendPath "venv\Scripts\python.exe")) {
        Write-ValidationSuccess "Backend" "Virtual environment configured"
        $ValidationResults["BackendVenv"] = $true
    } else {
        Write-ValidationError "Backend" "Virtual environment not found"
        $BackendValid = $false
        $ValidationResults["BackendVenv"] = $false
    }
    
    if (Test-Path (Join-Path $BackendPath "requirements.txt")) {
        # Check if dependencies are installed
        $VenvPython = Join-Path $BackendPath "venv\Scripts\python.exe"
        $PipList = & $VenvPython -m pip list --format=freeze 2>$null
        if ($PipList -and $PipList.Count -gt 20) {
            Write-ValidationSuccess "Backend" "Dependencies installed ($($PipList.Count) packages)"
            $ValidationResults["BackendDeps"] = $true
        } else {
            Write-ValidationError "Backend" "Dependencies not properly installed"
            $BackendValid = $false
            $ValidationResults["BackendDeps"] = $false
        }
    }
    
    if (Test-Path (Join-Path $BackendPath "main.py")) {
        Write-ValidationSuccess "Backend" "Entry point available"
        $ValidationResults["BackendEntry"] = $true
    } else {
        Write-ValidationError "Backend" "main.py not found"
        $BackendValid = $false
        $ValidationResults["BackendEntry"] = $false
    }
    
    # Frontend Environment Validation
    Write-InProgress "Validating frontend environment..."
    $FrontendValid = $true
    
    if (Test-Path (Join-Path $FrontendPath "node_modules")) {
        $NodeModulesCount = (Get-ChildItem (Join-Path $FrontendPath "node_modules") -Directory).Count
        Write-ValidationSuccess "Frontend" "Node modules installed ($NodeModulesCount packages)"
        $ValidationResults["FrontendModules"] = $true
    } else {
        Write-ValidationError "Frontend" "Node modules not installed"
        $FrontendValid = $false
        $ValidationResults["FrontendModules"] = $false
    }
    
    if (Test-Path (Join-Path $FrontendPath "package.json")) {
        Write-ValidationSuccess "Frontend" "Package configuration available"
        $ValidationResults["FrontendConfig"] = $true
    } else {
        Write-ValidationError "Frontend" "package.json not found"
        $FrontendValid = $false
        $ValidationResults["FrontendConfig"] = $false
    }
    
    if (Test-Path (Join-Path $FrontendPath "src\App.tsx")) {
        Write-ValidationSuccess "Frontend" "React application entry point found"
        $ValidationResults["FrontendEntry"] = $true
    } else {
        Write-ValidationError "Frontend" "App.tsx not found"
        $FrontendValid = $false
        $ValidationResults["FrontendEntry"] = $false
    }
    
    # Overall Environment Status
    $ValidationResults["BackendReady"] = $BackendValid
    $ValidationResults["FrontendReady"] = $FrontendValid
    $ValidationResults["EnvironmentReady"] = $BackendValid -and $FrontendValid
    
    return $ValidationResults
}

# Server Launch Implementation
function Start-DevelopmentServers {
    Write-StatusHeader "Launching Development Servers"
    
    # Validate environment first
    $ValidationResults = Test-DevelopmentEnvironment
    
    if (-not $ValidationResults["EnvironmentReady"]) {
        Write-ValidationError "Launch" "Environment validation failed. Cannot start servers."
        return $false
    }
    
    # Create launch scripts for both servers
    $BackendScript = @"
@echo off
title 3D Print Backend Server
cd /d "$BackendPath"
call venv\Scripts\activate.bat
echo Backend server starting...
python main.py
pause
"@
    
    $FrontendScript = @"
@echo off
title 3D Print Frontend Server
cd /d "$FrontendPath"
echo Frontend server starting...
npm start
pause
"@
    
    # Write launch scripts
    $BackendBatchPath = Join-Path $ProjectRoot "launch-backend.bat"
    $FrontendBatchPath = Join-Path $ProjectRoot "launch-frontend.bat"
    
    $BackendScript | Out-File -FilePath $BackendBatchPath -Encoding ASCII
    $FrontendScript | Out-File -FilePath $FrontendBatchPath -Encoding ASCII
    
    Write-InProgress "Starting backend server..."
    Start-Process -FilePath $BackendBatchPath -WindowStyle Normal
    
    Write-InProgress "Waiting for backend initialization..."
    Start-Sleep -Seconds 3
    
    Write-InProgress "Starting frontend server..."
    Start-Process -FilePath $FrontendBatchPath -WindowStyle Normal
    
    Write-ValidationSuccess "Launch" "Both servers initiated successfully"
    
    # Provide access information
    Write-StatusHeader "Development Environment Ready"
    Write-Host "🌐 Frontend Application: http://localhost:3000" -ForegroundColor Green
    Write-Host "🔧 Backend API: http://localhost:5000" -ForegroundColor Green
    Write-Host "📖 API Documentation: http://localhost:5000/docs" -ForegroundColor Green
    
    Write-Host "`n⏱️  Please allow 30-60 seconds for full initialization" -ForegroundColor Yellow
    Write-Host "🎯 Test the MVP by navigating to the Upload page" -ForegroundColor Cyan
    
    return $true
}

# Service Status Monitoring
function Get-ServiceStatus {
    Write-StatusHeader "Service Status Monitoring"
    
    $StatusResults = @{}
    
    # Check Backend Service
    try {
        $BackendTest = Invoke-WebRequest -Uri "http://localhost:5000" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-ValidationSuccess "Backend" "Service responding (Status: $($BackendTest.StatusCode))"
        $StatusResults["Backend"] = "Online"
    } catch {
        Write-ValidationError "Backend" "Service not responding"
        $StatusResults["Backend"] = "Offline"
    }
    
    # Check Frontend Service
    try {
        $FrontendTest = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-ValidationSuccess "Frontend" "Service responding (Status: $($FrontendTest.StatusCode))"
        $StatusResults["Frontend"] = "Online"
    } catch {
        Write-ValidationError "Frontend" "Service not responding"
        $StatusResults["Frontend"] = "Offline"
    }
    
    # Port Utilization Check
    $BackendPort = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
    $FrontendPort = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    
    if ($BackendPort) {
        Write-ValidationSuccess "Ports" "Backend port 5000 active (PID: $($BackendPort.OwningProcess))"
    }
    
    if ($FrontendPort) {
        Write-ValidationSuccess "Ports" "Frontend port 3000 active (PID: $($FrontendPort.OwningProcess))"
    }
    
    return $StatusResults
}

# Main Execution Logic
function Invoke-EnvironmentManager {
    $Banner = @'
╔══════════════════════════════════════════════════════════════╗
║              3D Print Quoting System MVP                    ║
║           Development Environment Manager                   ║
║                    Version 1.0.0                            ║
╚══════════════════════════════════════════════════════════════╝
'@
    Write-Host $Banner -ForegroundColor Magenta
    
    # Process Arguments
    switch ($true) {
        $ValidateEnvironment {
            $Results = Test-DevelopmentEnvironment
            
            if ($Results["EnvironmentReady"]) {
                Write-Host "`n🎉 Environment validation successful!" -ForegroundColor Green
                Write-Host "   Ready to launch development servers." -ForegroundColor Green
            } else {
                Write-Host "`n⚠️  Environment validation failed." -ForegroundColor Red
                Write-Host "   Please complete setup before launching." -ForegroundColor Red
            }
            break
        }
        
        $LaunchServers {
            $LaunchResult = Start-DevelopmentServers
            
            if ($LaunchResult) {
                Write-Host "`n✨ Development environment launched successfully!" -ForegroundColor Green
                Write-Host "   Begin testing your 3D Print Quoting MVP!" -ForegroundColor Green
            }
            break
        }
        
        $Status {
            $StatusResults = Get-ServiceStatus
            
            $OverallStatus = ($StatusResults["Backend"] -eq "Online") -and ($StatusResults["Frontend"] -eq "Online")
            
            if ($OverallStatus) {
                Write-Host "`n🟢 All services operational" -ForegroundColor Green
            } else {
                Write-Host "`n🟡 Some services offline" -ForegroundColor Yellow
            }
            break
        }
        
        default {
            $HelpText = @'
Development Environment Manager Usage:

Commands:
    -ValidateEnvironment    Check development environment setup
    -LaunchServers         Start backend and frontend servers
    -Status                Monitor service status

Examples:
    .\environment-manager.ps1 -ValidateEnvironment
    .\environment-manager.ps1 -LaunchServers
    .\environment-manager.ps1 -Status

Workflow:
    1. Validate environment setup
    2. Launch development servers
    3. Access http://localhost:3000
    4. Test MVP functionality
'@
            Write-Host $HelpText -ForegroundColor Cyan
            break
        }
    }
}

# Execute Main Function
Invoke-EnvironmentManager
