#!/bin/bash

# AI Compliance Platform - Setup Script
# This script sets up the development environment for the AI Compliance Platform

set -e

echo "🚀 Setting up AI Compliance Platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/data
mkdir -p frontend/build
mkdir -p logs

# Set permissions
chmod +x setup.sh
chmod +x start.sh
chmod +x stop.sh

# Build and start services
echo "🔨 Building Docker containers..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "🌐 Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8000"
    echo "   API Documentation: http://localhost:8000/docs"
    echo ""
    echo "👤 Demo accounts:"
    echo "   Organization Admin: admin / admin123"
    echo "   Regulatory Inspector: inspector / inspector123"
    echo ""
    echo "🛑 To stop the services, run: ./stop.sh"
else
    echo "❌ Failed to start services. Check the logs:"
    docker-compose logs
    exit 1
fi