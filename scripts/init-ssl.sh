#!/bin/bash

# Check if email and domain arguments are provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Error: Both email address and domain are required"
    echo "Usage: $0 your-email@example.com example.com"
    exit 1
fi

# Validate email format using regex
if ! echo "$1" | grep -E "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$" > /dev/null; then
    echo "Error: Invalid email format"
    echo "Usage: $0 your-email@example.com example.com"
    exit 1
fi

# Validate domain format (must contain at least one dot and valid characters)
if ! echo "$2" | grep -E "^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$" > /dev/null; then
    echo "Error: Invalid domain format. Use a valid domain like example.com or subdomain.example.com"
    echo "Usage: $0 your-email@example.com example.com"
    exit 1
fi

# Create required directories
mkdir -p certbot/conf
mkdir -p certbot/www

# Stop any running containers
docker compose down

# Start nginx
docker compose -f docker-compose.initial.yaml up -d nginx

# Request the wildcard certificate using DNS challenge
docker compose -f docker-compose.initial.yaml run --rm certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --email "$1" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d "$2"

# Restart nginx to load the new certificates
docker compose restart nginx

echo "SSL certificate initialization completed for $2!"
echo "Important: You'll need to add DNS TXT records during the certificate request process"
