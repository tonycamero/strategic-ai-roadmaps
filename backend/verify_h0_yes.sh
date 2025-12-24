#!/bin/bash
# Pre-seed session
curl -s -X POST -H 'Content-Type: application/json' -d '{"sessionId":"test-h0-v2","message":""}' http://localhost:3001/api/public/trustagent/homepage/chat > /dev/null
# Send YES
echo "Sending H0_YES..."
curl -s -X POST -H 'Content-Type: application/json' -d '{"sessionId":"test-h0-v2","message":"H0_YES"}' http://localhost:3001/api/public/trustagent/homepage/chat
