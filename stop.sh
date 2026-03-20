#!/bin/bash

# AI Compliance Platform - Stop Script
# Stop all services

set -e

echo "🛑 Stopping AI Compliance Platform..."

# Stop services
docker-compose down

echo "✅ Services stopped successfully!"
echo ""
echo "🚀 To start again, run: ./start.sh"