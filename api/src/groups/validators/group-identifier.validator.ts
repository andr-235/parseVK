import { Injectable } from '@nestjs/common';

@Injectable()
export class GroupIdentifierValidator {
  parseVkIdentifier(input: string): string {
    const trimmed = input.trim();

    const patterns = [
      /vk\.com\/club(\d+)/,
      /vk\.com\/public(\d+)/,
      /vk\.com\/([a-zA-Z0-9_]+)/,
      /^club(\d+)$/,
      /^public(\d+)$/,
      /^(\d+)$/,
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return trimmed;
  }

  normalizeIdentifier(identifier: string | number): string | number {
    return typeof identifier === 'string'
      ? this.parseVkIdentifier(identifier)
      : identifier;
  }
}
