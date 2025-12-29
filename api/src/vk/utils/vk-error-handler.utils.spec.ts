/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  createAccessDeniedResponse,
  handleVkApiError,
  safeVkApiCall,
} from './vk-error-handler.utils';

describe('VkErrorHandlerUtils', () => {
  describe('createAccessDeniedResponse', () => {
    it('should return standard access denied response', () => {
      const response = createAccessDeniedResponse();

      expect(response).toEqual({
        count: 0,
        current_level_count: 0,
        can_post: 0,
        show_reply_button: 0,
        groups_can_post: 0,
        items: [],
        profiles: [],
        groups: [],
      });
    });
  });

  describe('handleVkApiError', () => {
    let logger: {
      error: jest.MockedFunction<any>;
      warn: jest.MockedFunction<any>;
    };

    beforeEach(() => {
      logger = {
        error: jest.fn() as any,
        warn: jest.fn() as any,
      };
    });

    it('should log generic error and throw it', () => {
      const error = new Error('Generic error');

      expect(() => {
        handleVkApiError(error, 'test context', logger);
      }).toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        'Unknown error in test context',
        error.stack,
      );
    });

    it('should handle string error', () => {
      const error = 'String error';

      expect(() => {
        handleVkApiError(error, 'test context', logger);
      }).toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        'Unknown error in test context',
        'String error',
      );
    });
  });

  describe('safeVkApiCall', () => {
    let logger: any;

    beforeEach(() => {
      logger = {
        error: jest.fn() as any,
        warn: jest.fn() as any,
      };
    });

    it('should return successful result', async () => {
      const apiCall = jest.fn().mockResolvedValue('success');

      const result = await safeVkApiCall(apiCall, 'test context', logger);

      expect(result).toBe('success');
      expect(apiCall).toHaveBeenCalledTimes(1);
    });

    it('should throw other API errors', async () => {
      const error = new Error('API error');
      const apiCall = jest.fn().mockRejectedValue(error);

      await expect(
        safeVkApiCall(apiCall, 'test context', logger),
      ).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should throw non-API errors', async () => {
      const error = new Error('Generic error');
      const apiCall = jest.fn().mockRejectedValue(error);

      await expect(
        safeVkApiCall(apiCall, 'test context', logger),
      ).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
