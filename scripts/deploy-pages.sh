#!/bin/bash

echo "========================================"
echo "IP FACTORY - CLOUDFLARE DEPLOYMENT"
echo "========================================"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Error: 'wrangler' is not installed."
    echo "Run: npm install -g wrangler"
    exit 1
fi

echo "Deploying 'sites/' to Cloudflare Pages (Project: aiipworld)..."

# Deploy to Pages
npx wrangler pages deploy sites/ --project-name aiipworld --branch main

echo ""
echo "========================================"
echo "DEPLOYMENT SUCCESSFUL"
echo "========================================"
echo "To bind custom domain:"
echo "1. Go to Cloudflare Dashboard > Pages > aiipworld > Custom Domains"
echo "2. Add 'aiipworld.com'"
echo "3. Update DNS records as instructed."
echo ""
echo "For API (Worker):"
echo "Run: npx wrangler deploy"
echo "========================================"
