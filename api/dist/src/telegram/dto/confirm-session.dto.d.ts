export declare class ConfirmTelegramSessionDto {
    transactionId: string;
    code: string;
    password?: string;
}
export declare class ConfirmTelegramSessionResponseDto {
    session: string;
    expiresAt: string | null;
    userId: number;
    username: string | null;
    phoneNumber: string | null;
}
