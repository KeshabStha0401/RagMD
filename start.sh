#!/bin/bash

# Copying Environment Variables
if [[ -f .env.local ]]; then
    echo "Nil"
else
    echo "# OpenRouter (one key, hundreds of models)" >> .env.local
    echo "VITE_OPENROUTER_API_KEY=your_api_key_here" >> .env.local
    echo "VITE_OPENROUTER_MODEL=openai/gpt-oss-120b:free" >> .env.local
    echo "VITE_OPENROUTER_REFERER=http://localhost:5173" >> .env.local
    echo "VITE_OPENROUTER_TITLE=RAGMD" >> .env.local
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Start the development server
echo "Starting development server..."
npm run dev -- --port 4000 &

# Wait a moment for the server to start
sleep 3

# Get the local URL (assuming default Vite/Next.js port 4000, adjust if needed)
URL="http://localhost:4000"

# Open the URL in the default browser
echo "Opening $URL in browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "$URL"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    start "$URL"
fi

# Keep the script running
wait
