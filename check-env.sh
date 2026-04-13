#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================================================"
echo "🔍 WatchWicket ScoreBox - Environment Check"
echo "========================================================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo ""
    echo "Please create a .env file in the project root with:"
    echo "  VITE_SUPABASE_URL=https://jwkobz.supabase.co"
    echo "  VITE_SUPABASE_ANON_KEY=your_actual_key_here"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ .env file found${NC}"
echo ""

# Check VITE_SUPABASE_URL
if grep -q "VITE_SUPABASE_URL" .env; then
    URL=$(grep "VITE_SUPABASE_URL" .env | cut -d '=' -f2- | tr -d ' ')
    echo "📍 VITE_SUPABASE_URL: $URL"

    if [[ "$URL" == *"jwkobz"* ]]; then
        echo -e "${GREEN}   ✓ Correctly set to jwkobz project${NC}"
    elif [[ "$URL" == *"knqkqw"* ]]; then
        echo -e "${RED}   ❌ ERROR: Still pointing to knqkqw!${NC}"
        echo -e "${YELLOW}   FIX: Change to https://jwkobz.supabase.co${NC}"
    elif [[ "$URL" == *"pwvyktaerjmgdujwkobz"* ]]; then
        echo -e "${RED}   ❌ ERROR: Still pointing to old pwvyktaerjmgdujwkobz!${NC}"
        echo -e "${YELLOW}   FIX: Change to https://jwkobz.supabase.co${NC}"
    else
        echo -e "${YELLOW}   ⚠️  WARNING: Not the expected jwkobz URL${NC}"
    fi
else
    echo -e "${RED}❌ VITE_SUPABASE_URL not found in .env${NC}"
fi

echo ""

# Check VITE_SUPABASE_ANON_KEY
if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
    KEY=$(grep "VITE_SUPABASE_ANON_KEY" .env | cut -d '=' -f2- | tr -d ' ')

    if [[ "$KEY" == "YOUR_JWKOBZ_ANON_KEY_HERE_REPLACE_THIS" ]]; then
        echo -e "${RED}❌ VITE_SUPABASE_ANON_KEY: Not yet configured!${NC}"
        echo -e "${YELLOW}   FIX: Replace with your actual jwkobz anon key${NC}"
        echo -e "${YELLOW}   Get it from: https://supabase.com/dashboard/project/jwkobz/settings/api${NC}"
    elif [[ ${#KEY} -lt 50 ]]; then
        echo -e "${RED}❌ VITE_SUPABASE_ANON_KEY: Too short (invalid key)${NC}"
    else
        # Check if it starts with eyJ (JWT token)
        if [[ "$KEY" == eyJ* ]]; then
            echo -e "${GREEN}✓ VITE_SUPABASE_ANON_KEY: Configured (valid JWT format)${NC}"
            echo "   Length: ${#KEY} characters"

            # Try to decode the JWT to check project ref
            if command -v jq &> /dev/null && command -v base64 &> /dev/null; then
                # Extract and decode payload
                PAYLOAD=$(echo "$KEY" | cut -d '.' -f2)
                # Add padding if needed
                PADDED=$(printf '%s' "$PAYLOAD" | awk '{ padding = (4 - length % 4) % 4; for(i=0; i<padding; i++) printf "=" } { print }')
                DECODED=$(echo "$PADDED" | base64 -d 2>/dev/null | jq -r '.ref' 2>/dev/null)

                if [ "$DECODED" == "jwkobz" ]; then
                    echo -e "${GREEN}   ✓ JWT confirms jwkobz project${NC}"
                elif [ ! -z "$DECODED" ]; then
                    echo -e "${YELLOW}   ⚠️  JWT shows project: $DECODED (not jwkobz!)${NC}"
                fi
            fi
        else
            echo -e "${YELLOW}⚠️  VITE_SUPABASE_ANON_KEY: Doesn't look like a JWT token${NC}"
        fi
    fi
else
    echo -e "${RED}❌ VITE_SUPABASE_ANON_KEY not found in .env${NC}"
fi

echo ""
echo "========================================================================"
echo "📝 Next Steps:"
echo "========================================================================"

if grep -q "YOUR_JWKOBZ_ANON_KEY_HERE_REPLACE_THIS" .env; then
    echo "1. Get your jwkobz anon key from:"
    echo "   https://supabase.com/dashboard/project/jwkobz/settings/api"
    echo ""
    echo "2. Update .env file with your actual key"
    echo ""
    echo "3. Restart dev server: npm run dev"
    echo ""
elif [[ "$URL" == *"knqkqw"* ]] || [[ "$URL" == *"pwvyktaerjmgdujwkobz"* ]]; then
    echo "1. Fix VITE_SUPABASE_URL in .env:"
    echo "   VITE_SUPABASE_URL=https://jwkobz.supabase.co"
    echo ""
    echo "2. Restart dev server: npm run dev"
    echo ""
else
    echo -e "${GREEN}✓ Configuration looks good!${NC}"
    echo ""
    echo "If you haven't yet:"
    echo "1. Restart dev server: npm run dev"
    echo "2. Check purple banner shows 'jwkobz'"
    echo "3. Run JWKOBZ_MIGRATION.sql in Supabase"
    echo "4. Test: window.testMatchCreation() in browser console"
fi

echo "========================================================================"
