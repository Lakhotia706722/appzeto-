#!/bin/bash
#
# Health Check Script for TaskFlow Pro
# Can be used with monitoring systems like Nagios, Zabbix, etc.
# Exit codes: 0 = OK, 1 = Warning, 2 = Critical
#

set -e

API_URL="${API_URL:-http://localhost:5000}"
TIMEOUT="${TIMEOUT:-5}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

EXIT_CODE=0

echo "🏥 TaskFlow Pro Health Check"
echo "=============================="
echo ""

# Check API health
echo "📡 Checking API..."
if timeout $TIMEOUT curl -sf "$API_URL/health?detailed=true" > /tmp/health.json; then
  echo -e "${GREEN}✅ API is responding${NC}"
  
  # Parse health data
  STATUS=$(cat /tmp/health.json | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  
  if [ "$STATUS" = "ok" ]; then
    echo -e "${GREEN}✅ Status: $STATUS${NC}"
  else
    echo -e "${YELLOW}⚠️  Status: $STATUS${NC}"
    EXIT_CODE=1
  fi
  
  # Check MongoDB
  MONGO=$(cat /tmp/health.json | grep -o '"mongodb":"[^"]*"' | cut -d'"' -f4)
  if [ "$MONGO" = "connected" ]; then
    echo -e "${GREEN}✅ MongoDB: $MONGO${NC}"
  else
    echo -e "${RED}❌ MongoDB: $MONGO${NC}"
    EXIT_CODE=2
  fi
  
  # Check Redis
  REDIS=$(cat /tmp/health.json | grep -o '"redis":"[^"]*"' | cut -d'"' -f4)
  if [ "$REDIS" = "connected" ] || [ "$REDIS" = "not_configured" ]; then
    echo -e "${GREEN}✅ Redis: $REDIS${NC}"
  else
    echo -e "${RED}❌ Redis: $REDIS${NC}"
    EXIT_CODE=1
  fi
  
  # Show uptime
  UPTIME=$(cat /tmp/health.json | grep -o '"uptime":[0-9.]*' | cut -d':' -f2)
  UPTIME_HOURS=$(echo "scale=2; $UPTIME / 3600" | bc)
  echo "⏱️  Uptime: ${UPTIME_HOURS}h"
  
  # Show memory
  MEMORY=$(cat /tmp/health.json | grep -o '"memory":{[^}]*}')
  echo "💾 Memory: $MEMORY"
  
  rm /tmp/health.json
else
  echo -e "${RED}❌ API is not responding${NC}"
  EXIT_CODE=2
fi

echo ""

# Check Docker containers (if running in Docker)
if command -v docker &> /dev/null; then
  echo "🐳 Checking Docker containers..."
  
  if docker ps | grep -q "taskflow"; then
    RUNNING=$(docker ps --filter "name=taskflow" --format "{{.Names}}" | wc -l)
    echo -e "${GREEN}✅ $RUNNING TaskFlow containers running${NC}"
    
    # Check for unhealthy containers
    UNHEALTHY=$(docker ps --filter "name=taskflow" --filter "health=unhealthy" --format "{{.Names}}" | wc -l)
    if [ $UNHEALTHY -gt 0 ]; then
      echo -e "${RED}❌ $UNHEALTHY unhealthy containers${NC}"
      docker ps --filter "name=taskflow" --filter "health=unhealthy" --format "{{.Names}}: {{.Status}}"
      EXIT_CODE=2
    fi
  else
    echo -e "${YELLOW}⚠️  No TaskFlow containers found${NC}"
    EXIT_CODE=1
  fi
  
  echo ""
fi

# Check disk space
echo "💿 Checking disk space..."
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')

if [ $DISK_USAGE -lt 80 ]; then
  echo -e "${GREEN}✅ Disk usage: ${DISK_USAGE}%${NC}"
elif [ $DISK_USAGE -lt 90 ]; then
  echo -e "${YELLOW}⚠️  Disk usage: ${DISK_USAGE}%${NC}"
  EXIT_CODE=1
else
  echo -e "${RED}❌ Disk usage: ${DISK_USAGE}% (Critical)${NC}"
  EXIT_CODE=2
fi

echo ""

# Summary
echo "=============================="
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed${NC}"
elif [ $EXIT_CODE -eq 1 ]; then
  echo -e "${YELLOW}⚠️  Warning: Some checks failed${NC}"
else
  echo -e "${RED}❌ Critical: System unhealthy${NC}"
fi

exit $EXIT_CODE
