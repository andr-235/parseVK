var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
import { Catch, HttpException, HttpStatus, Logger, } from '@nestjs/common';
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    logger = new Logger(HttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const { status, message, error } = this.extractExceptionInfo(exception, request);
        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message: Array.isArray(message) ? message : [message],
            ...(error && { error }),
        };
        response.status(status).json(errorResponse);
    }
    extractExceptionInfo(exception, request) {
        if (exception instanceof HttpException) {
            return this.extractHttpExceptionInfo(exception);
        }
        if (exception instanceof Error) {
            this.logger.error(`Необработанная ошибка: ${exception.message}`, exception.stack, `${request.method} ${request.url}`);
            return {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: exception.message,
            };
        }
        const errorString = String(exception);
        this.logger.error(`Необработанная ошибка неизвестного типа: ${errorString}`, undefined, `${request.method} ${request.url}`);
        return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Произошла непредвиденная ошибка',
        };
    }
    extractHttpExceptionInfo(exception) {
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        const defaultMessage = 'Внутренняя ошибка сервера';
        if (typeof exceptionResponse === 'string') {
            return {
                status,
                message: exceptionResponse,
            };
        }
        if (typeof exceptionResponse === 'object') {
            const responseObj = exceptionResponse;
            return {
                status,
                message: responseObj.message ?? defaultMessage,
                error: responseObj.error,
            };
        }
        return {
            status,
            message: defaultMessage,
        };
    }
};
HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    Catch()
], HttpExceptionFilter);
export { HttpExceptionFilter };
//# sourceMappingURL=http-exception.filter.js.map