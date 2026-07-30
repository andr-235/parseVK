from app.modules.telegram_service.schemas import TelegramJobState, TelegramJobStatus


def test_legacy_uppercase_job_status_is_normalized() -> None:
    state = TelegramJobState.model_validate(
        {
            "id": "3f8c55d5-6420-4547-b1b3-52664ce3ca29",
            "status": "PENDING",
            "createdAt": "2026-07-31T00:00:00Z",
        }
    )

    assert state.status is TelegramJobStatus.PENDING
    assert state.model_dump(mode="json", by_alias=True)["status"] == "pending"
