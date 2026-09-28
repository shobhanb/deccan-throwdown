import logging

from firebase_admin import messaging

from app.settings import notification_settings

from .topics import admin_topic, event_topic

log = logging.getLogger("uvicorn.error")


class NotificationService:
    @staticmethod
    def _enabled() -> bool:
        return notification_settings.notifications_enabled

    @staticmethod
    def send_to_topic(
        topic: str,
        title: str,
        body: str,
        *,
        event_short_name: str,
        route: str,
    ) -> None:
        if not NotificationService._enabled():
            log.info("Notifications disabled; skipped topic %s", topic)
            return
        try:
            # Data-only payload: web clients show one notification themselves.
            # A `notification` block would also auto-display in the service worker.
            messaging.send(
                messaging.Message(
                    data={
                        "title": title,
                        "body": body,
                        "event_short_name": event_short_name,
                        "route": route,
                    },
                    topic=topic,
                ),
            )
            log.info("FCM sent to topic %s: %s", topic, title)
        except Exception:
            log.exception("FCM send failed for topic %s", topic)

    @staticmethod
    def subscribe_token(token: str, topic: str) -> None:
        if not NotificationService._enabled():
            return
        try:
            messaging.subscribe_to_topic([token], topic)
        except Exception:
            log.exception("FCM subscribe failed for topic %s", topic)

    @staticmethod
    def unsubscribe_token(token: str, topic: str) -> None:
        if not NotificationService._enabled():
            return
        try:
            messaging.unsubscribe_from_topic([token], topic)
        except Exception:
            log.exception("FCM unsubscribe failed for topic %s", topic)

    @staticmethod
    def send_new_team_registration(
        event_short_name: str,
        team_name: str,
        category: str,
    ) -> None:
        NotificationService.send_to_topic(
            admin_topic(),
            f"New {category} Team Registration!",
            f"New team in category {category} for {event_short_name}: {team_name}",
            event_short_name=event_short_name,
            route="/admin/teams",
        )

    @staticmethod
    def send_team_verified(
        event_short_name: str,
        team_name: str,
        category: str,
    ) -> None:
        NotificationService.send_to_topic(
            event_topic(event_short_name),
            f"New {category} Team on the Roster!",
            f"New team in category {category} for {event_short_name}: {team_name}",
            event_short_name=event_short_name,
            route=f"/teams/{event_short_name}",
        )

    @staticmethod
    def send_wod_leaderboard_complete(event_short_name: str, wod_number: int) -> None:
        NotificationService.send_to_topic(
            event_topic(event_short_name),
            f"WOD {wod_number} results are final",
            "Leaderboard updated",
            event_short_name=event_short_name,
            route=f"/leaderboard/{event_short_name}",
        )

    @staticmethod
    def send_custom_event_notification(
        event_short_name: str,
        title: str,
        body: str,
        route: str,
    ) -> None:
        NotificationService.send_to_topic(
            event_topic(event_short_name),
            title,
            body,
            event_short_name=event_short_name,
            route=route,
        )
