# Direct Development Server Launch Protocol
# Advanced Troubleshooting & Resolution Framework
# Version: 2.1.0 - Syntax Corrected

[CmdletBinding()]
param(
    [Parameter()]
    [switch]$DiagnoseIssues,
    
    [Parameter()]
    [switch]$CleanStart,
    
    [Parameter()]
    [switch]$StepByStep,
    
    [Parameter()]
    [switch]$DirectLaunch
)

# Configuration Constants
$ProjectRoot = "C:\Users\Dave\OneDrive\Claude\3D-Print-Quoting-Website"
$BackendPath = Join-Path $ProjectRoot "backend"
$FrontendPath = Join-Path $ProjectRoot "frontend"

# Diagnostic Functions
function Write-DiagnosticHeader {
    param([string]$Section)
    Write-Host "`n====== $Section ======" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "➤ $Message" -ForegroundColor Yellow
}

# System Diagnostic Protocol
function Invoke-SystemDiagnostics {
    Write-DiagnosticHeader "System Diagnostic Analysis"
    
    # Check running processes
    $PythonProcesses = Get-Process | Where-Object {$_.ProcessName -eq "python"}
    $NodeProcesses = Get-Process | Where-Object {$_.ProcessName -eq "node"}
    
    Write-Info "Python processes detected: $($PythonProcesses.Count)"
    Write-Info "Node.js processes detected: $($NodeProcesses.Count)"
    
    # Port availability check
    $Port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    $Port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    
    if ($Port3000) {
        Write-Success "Port 3000 is bound to process $($Port3000.OwningProcess)"
    } else {
        Write-Error "Port 3000 is not bound"
    }
    
    if ($Port5000) {
        Write-Success "Port 5000 is bound to process $($Port5000.OwningProcess)"
    } else {
        Write-Error "Port 5000 is not bound"
    }
    
    # Environment verification
    Write-DiagnosticHeader "Environment Verification"
    
    $BackendVenv = Test-Path (Join-Path $BackendPath "venv\Scripts\python.exe")
    $FrontendModules = Test-Path (Join-Path $FrontendPath "node_modules")
    
    if ($BackendVenv) {
        Write-Success "Backend virtual environment exists"
    } else {
        Write-Error "Backend virtual environment missing"
    }
    
    if ($FrontendModules) {
        Write-Success "Frontend node_modules exists"
    } else {
        Write-Error "Frontend node_modules missing"
    }
}

# Process Cleanup Protocol
function Stop-DevelopmentProcesses {
    Write-DiagnosticHeader "Process Cleanup Protocol"
    
    # Stop existing development processes
    Get-Process | Where-Object {$_.ProcessName -eq "python"} | ForEach-Object {
        try {
            $_.CloseMainWindow()
            if (!$_.HasExited) {
                $_.Kill()
            }
            Write-Success "Terminated Python process $($_.Id)"
        } catch {
            Write-Info "Could not terminate process $($_.Id)"
        }
    }
    
    Get-Process | Where-Object {$_.ProcessName -eq "node"} | ForEach-Object {
        try {
            $_.CloseMainWindow()
            if (!$_.HasExited) {
                $_.Kill()
            }
            Write-Success "Terminated Node process $($_.Id)"
        } catch {
            Write-Info "Could not terminate process $($_.Id)"
        }
    }
    
    Start-Sleep -Seconds 3
    Write-Success "Process cleanup completed"
}

# Simple Backend Launch
function Start-BackendSimple {
    Write-DiagnosticHeader "Backend Simple Launch"
    
    Set-Location $BackendPath
    
    # Create simple batch launcher
    $BackendBatch = @"
@echo off
cd /d "$BackendPath"
call venv\Scripts\activate.bat
echo Starting Flask backend server...
python main.py
pause
"@
    
    $BackendBatch | Out-File -FilePath "$ProjectRoot\launch-backend.bat" -Encoding ASCII
    
    # Launch backend
    Start-Process -FilePath "$ProjectRoot\launch-backend.bat" -WindowStyle Normal
    
    Write-Success "Backend launched in separate window"
}

# Simple Frontend Launch
function Start-FrontendSimple {
    Write-DiagnosticHeader "Frontend Simple Launch"
    
    Set-Location $FrontendPath
    
    # Create simple batch launcher
    $FrontendBatch = @"
@echo off
cd /d "$FrontendPath"
echo Starting React frontend server...
npm start
pause
"@
    
    $FrontendBatch | Out-File -FilePath "$ProjectRoot\launch-frontend.bat" -Encoding ASCII
    
    # Launch frontend
    Start-Process -FilePath "$ProjectRoot\launch-frontend.bat" -WindowStyle Normal
    
    Write-Success "Frontend launched in separate window"
}

# Manual Step Launch Protocol
function Invoke-ManualLaunchSteps {
    Write-DiagnosticHeader "Manual Launch Instructions"
    
    Write-Host @"

STEP-BY-STEP MANUAL LAUNCH PROTOCOL:

1. Backend Server Launch:
   - Open Command Prompt as Administrator
   - Navigate to: $BackendPath
   - Run: venv\Scripts\activate.bat
   - Run: python main.py
   - Wait for "Running on http://127.0.0.1:5000" message

2. Frontend Server Launch:
   - Open NEW Command Prompt
   - Navigate to: $FrontendPath  
   - Run: npm start
   - Wait for "On Your Network" message
   - Browser should auto-open to http://localhost:3000

3. Verification:
   - Backend API: http://localhost:5000
   - Frontend App: http://localhost:3000
   - Test file upload functionality

TROUBLESHOOTING TIPS:
- If port 3000 is busy: killall node (or restart computer)
- If Python errors: ensure venv is activated
- If npm errors: rm -rf node_modules && npm install

"@ -ForegroundColor White
}

# Automated Alternative Launch
function Invoke-AlternativeLaunch {
    Write-DiagnosticHeader "Alternative Launch Strategy"
    
    # Clean existing processes first
    Stop-DevelopmentProcesses
    
    # Validate environments
    Write-Info "Validating backend environment..."
    if (!(Test-Path (Join-Path $BackendPath "venv\Scripts\python.exe"))) {
        Write-Error "Backend environment not ready. Run setup first."
        return
    }
    
    Write-Info "Validating frontend environment..."
    if (!(Test-Path (Join-Path $FrontendPath "node_modules"))) {
        Write-Error "Frontend environment not ready. Run npm install first."
        return
    }
    
    # Launch using simple batch files
    Start-BackendSimple
    Start-Sleep -Seconds 5
    Start-FrontendSimple
    
    Write-DiagnosticHeader "Launch Complete"
    Write-Host "Servers launching in separate windows..." -ForegroundColor Green
    Write-Host "Backend: Check window for Flask startup messages" -ForegroundColor Yellow
    Write-Host "Frontend: Check window for React startup messages" -ForegroundColor Yellow
    Write-Host "`nExpected URLs:" -ForegroundColor Cyan
    Write-Host "- Backend API: http://localhost:5000" -ForegroundColor White
    Write-Host "- Frontend App: http://localhost:3000" -ForegroundColor White
}

# Emergency Manual Setup
function Invoke-EmergencySetup {
    Write-DiagnosticHeader "Emergency Environment Setup"
    
    Write-Info "Setting up backend environment..."
    Set-Location $BackendPath
    if (!(Test-Path "venv")) {
        python -m venv venv
    }
    & ".\venv\Scripts\Activate.ps1"
    pip install -r requirements.txt
    
    Write-Info "Setting up frontend environment..."
    Set-Location $FrontendPath
    if (!(Test-Path "node_modules")) {
        npm install
    }
    
    Write-Success "Emergency setup completed"
}

# Main Execution Logic
function Invoke-TroubleshootingProtocol {
    $Banner = @'
╔══════════════════════════════════════════════════════════════╗
║           3D Print MVP - Troubleshooting Protocol           ║
║                    Version 2.1.0                            ║
╚══════════════════════════════════════════════════════════════╝
'@
    Write-Host $Banner -ForegroundColor Magenta
    
    switch ($true) {
        $DiagnoseIssues {
            Invoke-SystemDiagnostics
            Write-Host "`nNEXT STEPS:" -ForegroundColor Cyan
            Write-Host "If environment issues detected, run: .\fix-environment.ps1 -EmergencySetup" -ForegroundColor Yellow
            Write-Host "Then run: .\fix-environment.ps1 -CleanStart" -ForegroundColor Yellow
            break
        }
        
        $CleanStart {
            Invoke-AlternativeLaunch
            break
        }
        
        $StepByStep {
            Invoke-ManualLaunchSteps
            break
        }
        
        $DirectLaunch {
            Invoke-EmergencySetup
            Invoke-AlternativeLaunch
            break
        }
        
        default {
            Write-Host @'

TROUBLESHOOTING OPTIONS:

    -DiagnoseIssues    Analyze current system state
    -CleanStart        Clean restart with batch launchers
    -StepByStep        Show manual launch instructions
    -DirectLaunch      Emergency setup + launch

QUICK RESOLUTION:
    
    Option 1 (Recommended):
    .\fix-environment.ps1 -CleanStart
    
    Option 2 (If Option 1 fails):
    .\fix-environment.ps1 -StepByStep
    
    Option 3 (Emergency):
    .\fix-environment.ps1 -DirectLaunch

'@ -ForegroundColor Cyan
            break
        }
    }
    
    # Hidden emergency option
    if ($args -contains "-EmergencySetup") {
        Invoke-EmergencySetup
    }
}

# Execute main function
Invoke-TroubleshootingProtocol
