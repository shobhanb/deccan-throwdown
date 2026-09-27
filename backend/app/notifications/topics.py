def event_topic(event_short_name: str) -> str:
    return f"event_{event_short_name}"


def admin_topic() -> str:
    return "admin"
