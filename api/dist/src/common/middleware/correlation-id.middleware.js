var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
export const CORRELATION_ID_HEADER = 'x-correlation-id';
let CorrelationIdMiddleware = class CorrelationIdMiddleware {
    use(req, res, next) {
        const correlationId = req.headers[CORRELATION_ID_HEADER]?.toString() || randomUUID();
        req.headers[CORRELATION_ID_HEADER] = correlationId;
        res.setHeader(CORRELATION_ID_HEADER, correlationId);
        next();
    }
};
CorrelationIdMiddleware = __decorate([
    Injectable()
], CorrelationIdMiddleware);
export { CorrelationIdMiddleware };
//# sourceMappingURL=correlation-id.middleware.js.map