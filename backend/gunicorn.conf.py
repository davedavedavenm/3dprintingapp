import multiprocessing

# Gunicorn configuration for 3D Print Quoting System
bind = "0.0.0.0:5000"
workers = 2  # Reduced for Raspberry Pi
threads = 2
worker_class = "sync"
timeout = 120
keepalive = 5
