import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { TelegramDlMatchExcludedChatDto } from './excluded-chat.dto.js';

describe('TelegramDlMatchExcludedChatDto', () => {
  it('accepts peerId when whitelist validation is enabled', async () => {
    const payload = plainToInstance(TelegramDlMatchExcludedChatDto, {
      peerId: '-1001424415743',
    });

    const errors = await validate(payload, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
  });
});
