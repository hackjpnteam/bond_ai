#!/bin/bash

# Load environment variables from .env.local
export $(grep -v '^#' .env.local | grep OPENAI_API_KEY | xargs)

# Start Next.js development server directly
npx next dev --turbopack
