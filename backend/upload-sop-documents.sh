#!/bin/bash

# Script to upload SOP-01 outputs for Hayes Real Estate
# Usage: ./upload-sop-documents.sh /path/to/your/documents/folder

set -e

# Check if folder path provided
if [ -z "$1" ]; then
  echo "Usage: $0 /path/to/documents/folder"
  echo "Example: $0 ~/Documents/Hayes-SOP-Outputs"
  exit 1
fi

DOCS_FOLDER="$1"
UPLOADS_DIR="./uploads"
TOKEN="your-auth-token-here" # You'll need to login and get a token

# Create uploads directory if it doesn't exist
mkdir -p "$UPLOADS_DIR"

# Document mappings
declare -A docs
docs["output1"]="SOP-01 Output 1 - Strategic Overview.pdf"
docs["output2"]="SOP-01 Output 2 - Workflow Analysis.pdf"
docs["output3"]="SOP-01 Output 3 - AI Opportunity Map.pdf"
docs["output4"]="SOP-01 Output 4 - Discovery Call Prep.pdf"

echo "🚀 Uploading SOP-01 outputs for Hayes Real Estate..."
echo "Source folder: $DOCS_FOLDER"
echo ""

# Upload each document
for key in output1 output2 output3 output4; do
  filename="${docs[$key]}"
  filepath="$DOCS_FOLDER/$filename"
  
  if [ ! -f "$filepath" ]; then
    echo "⚠️  File not found: $filename"
    echo "   Skipping..."
    continue
  fi
  
  echo "📄 Uploading: $filename"
  
  # Extract output number from key
  output_num=$(echo "$key" | sed 's/output/Output-/')
  
  curl -X POST http://localhost:3001/api/documents/upload \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@$filepath" \
    -F "category=sop_output" \
    -F "title=${filename%.pdf}" \
    -F "description=SOP-01 output document for Hayes Real Estate" \
    -F "sopNumber=SOP-01" \
    -F "outputNumber=$output_num" \
    -F "isPublic=true"
  
  echo ""
  echo "✅ Uploaded: $filename"
  echo ""
done

echo "🎉 All documents uploaded successfully!"
echo ""
echo "To view documents, login as roberta@hayesrealestate.com and visit the dashboard."
