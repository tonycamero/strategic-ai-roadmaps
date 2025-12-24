#!/bin/bash
echo "--- H0 Opening ---"
curl -s -X POST -H 'Content-Type: application/json' -d '{"sessionId":"test-h0","message":""}' http://localhost:3001/api/public/trustagent/homepage/chat
echo -e "\n\n--- H0_YES Selection ---"
curl -s -X POST -H 'Content-Type: application/json' -d '{"sessionId":"test-h0","message":"H0_YES"}' http://localhost:3001/api/public/trustagent/homepage/chat
echo -e "\n\n--- H0_NO Session Init ---"
curl -s -X POST -H 'Content-Type: application/json' -d '{"sessionId":"test-h0-no","message":""}' http://localhost:3001/api/public/trustagent/homepage/chat
echo -e "\n\n--- H0_NO Selection ---"
curl -s -X POST -H 'Content-Type: application/json' -d '{"sessionId":"test-h0-no","message":"H0_NO"}' http://localhost:3001/api/public/trustagent/homepage/chat
echo ""
