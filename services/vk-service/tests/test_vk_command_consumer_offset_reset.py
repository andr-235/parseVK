from app.tasks.vk_commands_consumer import VkExecutionCommandsConsumer


def test_canonical_command_consumer_replays_existing_topic_backlog():
    assert VkExecutionCommandsConsumer.consumer_group == "vk-service-vk-commands"
    assert VkExecutionCommandsConsumer.auto_offset_reset == "earliest"
