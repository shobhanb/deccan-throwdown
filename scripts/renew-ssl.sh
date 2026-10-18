#!/bin/bash
set -euo pipefail

# Renew the Let's Encrypt certificate and reload Nginx only when a new
# certificate was installed. `certbot renew` exits 0 both when it renews and
# when the certificate is not yet due, so this script uses a deploy hook
# (which Certbot runs only after a successful renewal) to decide.
#
# Nginx is reloaded with `nginx -s reload`, which keeps existing connections
# open. The container is not restarted.
#
# Let's Encrypt certificates last 90 days. Certbot renews only in the last
# 30 days, so running this twice a day is a check, not a renewal.

# =============================================================================
# CRONTAB SETUP
# =============================================================================
# Run from the project root twice a day. A random delay spreads the attempt
# out so it does not line up with every other Let's Encrypt client.
#
# 1. Open crontab for editing:
#      crontab -e
#
# 2. Add this line (bash is required so $RANDOM works; cron's shell is sh):
#
#      17 3,15 * * * /bin/bash -c 'sleep $((RANDOM % 3600)); /root/deccan-throwdown/scripts/renew-ssl.sh'
#
#    That starts a check at 03:17 and 15:17, then waits 0–60 minutes.
#    Replace /root/deccan-throwdown with the directory on the server.
#
# 3. Make the script executable:
#      chmod +x /root/deccan-throwdown/scripts/renew-ssl.sh
#
# Cron uses the server's local timezone (`timedatectl` or `date` to check).
# DigitalOcean droplets usually default to UTC.
#
# The script skips EVENT_BLACKOUT_START through EVENT_BLACKOUT_END below so
# nothing is renewed and Nginx is not reloaded during the competition.
# Dates are inclusive and follow the server clock. The 2026 event is
# Sat 28–Sun 29 Nov in India (IST, UTC+5:30). The window starts on Friday
# so a UTC server does not renew early Saturday morning in India.
# Update both dates when the event dates change.
#
# Run the job for at least a week before the blackout. Renewal is attempted
# for 30 days before expiry, so a certificate that is due will already have
# been replaced before the weekend.
#
# To view current crontab entries:
#      crontab -l
# =============================================================================

# Inclusive. Server local dates, YYYY-MM-DD.
EVENT_BLACKOUT_START=2026-11-27
EVENT_BLACKOUT_END=2026-11-29

cd "$(dirname "$0")/.."

today=$(date +%F)
if [[ "$today" > "$EVENT_BLACKOUT_START" || "$today" == "$EVENT_BLACKOUT_START" ]] \
    && [[ "$today" < "$EVENT_BLACKOUT_END" || "$today" == "$EVENT_BLACKOUT_END" ]]; then
    echo "Skipping SSL renewal during the event blackout ($EVENT_BLACKOUT_START through $EVENT_BLACKOUT_END)."
    cert="certbot/conf/live/dt.cfgames.site/fullchain.pem"
    if [[ -f "$cert" ]] && command -v openssl >/dev/null 2>&1; then
        enddate=$(openssl x509 -enddate -noout -in "$cert" | cut -d= -f2)
        if end_epoch=$(date -d "$enddate" +%s 2>/dev/null); then
            :
        elif end_epoch=$(date -j -f "%b %e %T %Y %Z" "$enddate" +%s 2>/dev/null); then
            :
        else
            end_epoch=""
        fi
        now=$(date +%s)
        if [[ -n "$end_epoch" && $((end_epoch - now)) -lt $((14 * 86400)) ]]; then
            echo "WARNING: certificate expires within 14 days ($enddate). The blackout is skipping renewal."
        fi
    fi
    exit 0
fi

# Written by the deploy hook inside the certbot container. The hook runs
# only when a certificate is actually renewed.
stamp="certbot/conf/.renewed"
rm -f "$stamp"

set +e
docker compose run --rm certbot renew \
    --webroot \
    --webroot-path /var/www/certbot \
    --no-random-sleep-on-renew \
    --quiet \
    --deploy-hook "touch /etc/letsencrypt/.renewed"
status=$?
set -e

if [[ -f "$stamp" ]]; then
    rm -f "$stamp"
    echo "Certificate renewed. Reloading Nginx."
    docker compose exec -T nginx nginx -s reload
fi

exit "$status"
