#!/bin/bash

# Encender el servidor API (primer plano)
# (Usamos el puerto que Fly.io nos asigne)
uvicorn app.pwa_server:app --host 0.0.0.0 --port ${PORT:-9000}
