export enum TelegramChatType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
  SUPERGROUP = 'SUPERGROUP',
  CHANNEL = 'CHANNEL',
}

export enum TelegramMemberStatus {
  CREATOR = 'CREATOR',
  ADMINISTRATOR = 'ADMINISTRATOR',
  MEMBER = 'MEMBER',
  RESTRICTED = 'RESTRICTED',
  LEFT = 'LEFT',
  KICKED = 'KICKED',
}

export type TelegramChatTypeValue =
  (typeof TelegramChatType)[keyof typeof TelegramChatType];
export type TelegramMemberStatusValue =
  (typeof TelegramMemberStatus)[keyof typeof TelegramMemberStatus];
