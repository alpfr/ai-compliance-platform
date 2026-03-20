#!/bin/bash

# AI Compliance Platform - Start Script
# Start all services

set -e

echo "🚀 Starting AI Compliance Platform..."

# Start services
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "🌐 Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8000"
    echo "   API Documentation: http://localhost:8000/docs"
    echo ""
    echo "📊 View logs: docker-compose logs -f"
    echo "🛑 Stop services: ./stop.sh"
else
    echo "❌ Failed to start services. Check the logs:"
    docker-compose logs
    exit 1
fi