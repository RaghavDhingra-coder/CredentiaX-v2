#!/bin/bash

echo "Testing Certificate Routes..."
echo ""

echo "1. Testing /api/v1/certificates/test (should work):"
curl -s http://localhost:3001/api/v1/certificates/test
echo ""
echo ""

echo "2. Testing /api/v1/health (should work):"
curl -s http://localhost:3001/api/v1/health
echo ""
echo ""

echo "Done!"
