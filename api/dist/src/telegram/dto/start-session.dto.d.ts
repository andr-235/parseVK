export declare class StartTelegramSessionDto {
    phoneNumber?: string;
    apiId?: number;
    apiHash?: string;
}
export declare class StartTelegramSessionResponseDto {
    transactionId: string;
    codeLength: number;
    nextType: 'app' | 'sms' | 'call' | 'flash';
    timeoutSec: number | null;
}
