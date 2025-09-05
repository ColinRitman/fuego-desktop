#!/bin/bash

# Monitor GitHub Actions builds for Fuego Wallet
# This script checks build status every 2 minutes and reports results

REPO="colinritman/fuego-desktop"
WORKFLOW_NAME="Build Fuego Wallet with STARK CLI"

echo "🔍 Monitoring GitHub Actions builds for $REPO"
echo "📋 Workflow: $WORKFLOW_NAME"
echo "⏰ Checking every 2 minutes..."
echo ""

while true; do
    echo "🕐 $(date): Checking build status..."
    
    # Get the latest workflow run
    RUN_DATA=$(gh run list --repo $REPO --workflow="$WORKFLOW_NAME" --limit 1 --json status,conclusion,createdAt,headBranch,url)
    
    if [ $? -eq 0 ]; then
        STATUS=$(echo $RUN_DATA | jq -r '.[0].status')
        CONCLUSION=$(echo $RUN_DATA | jq -r '.[0].conclusion')
        BRANCH=$(echo $RUN_DATA | jq -r '.[0].headBranch')
        URL=$(echo $RUN_DATA | jq -r '.[0].url')
        CREATED=$(echo $RUN_DATA | jq -r '.[0].createdAt')
        
        echo "📊 Latest build status:"
        echo "   Status: $STATUS"
        echo "   Conclusion: $CONCLUSION"
        echo "   Branch: $BRANCH"
        echo "   Created: $CREATED"
        echo "   URL: $URL"
        
        if [ "$STATUS" = "completed" ]; then
            if [ "$CONCLUSION" = "success" ]; then
                echo "✅ Build SUCCESS! All platforms are green."
                echo "🎉 Fuego Wallet with STARK CLI is ready for deployment!"
            elif [ "$CONCLUSION" = "failure" ]; then
                echo "❌ Build FAILED! Need to investigate and fix issues."
                echo "🔧 Check the logs at: $URL"
            else
                echo "⚠️  Build completed with conclusion: $CONCLUSION"
            fi
        elif [ "$STATUS" = "in_progress" ]; then
            echo "🔄 Build is currently running..."
        else
            echo "ℹ️  Build status: $STATUS"
        fi
    else
        echo "❌ Failed to get build status. Make sure 'gh' CLI is installed and authenticated."
    fi
    
    echo ""
    echo "⏳ Waiting 2 minutes before next check..."
    sleep 120
done
