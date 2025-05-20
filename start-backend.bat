@echo off
title 3D Print Backend Server
cd /d "C:\Users\Dave\OneDrive\Claude\3D-Print-Quoting-Website\backend"
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo Starting Flask backend server...
python main.py
echo Backend server stopped.
pause
