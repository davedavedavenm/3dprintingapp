@echo off
title 3D Print Backend Server
cd /d "C:\Users\Dave\OneDrive\Claude\3D-Print-Quoting-Website\backend"
call venv\Scripts\activate.bat
echo Backend server starting...
python main.py
pause
