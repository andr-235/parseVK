var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
let MetricsSecurityMiddleware = class MetricsSecurityMiddleware {
    logger = new Logger('MetricsSecurity');
    use(req, res, next) {
        const clientIp = req.ip || req.socket?.remoteAddress;
        const normalizedIp = clientIp && clientIp.startsWith('::ffff:')
            ? clientIp.replace('::ffff:', '')
            : clientIp;
        if (!normalizedIp) {
            this.logger.warn('Доступ к метрикам заблокирован: IP не определён');
            return res.status(403).json({
                error: 'Access denied',
                message: 'Metrics endpoint is only accessible from internal network',
            });
        }
        const allowedNetworks = [
            '127.0.0.1',
            '::1',
            '::ffff:127.0.0.1',
            /^172\./,
            /^192\.168\./,
        ];
        const isAllowed = allowedNetworks.some((network) => {
            if (typeof network === 'string') {
                return normalizedIp === network;
            }
            return network.test(normalizedIp);
        });
        if (!isAllowed) {
            this.logger.warn(`Доступ к метрикам заблокирован для IP: ${normalizedIp}`);
            return res.status(403).json({
                error: 'Access denied',
                message: 'Metrics endpoint is only accessible from internal network',
            });
        }
        next();
    }
};
MetricsSecurityMiddleware = __decorate([
    Injectable()
], MetricsSecurityMiddleware);
export { MetricsSecurityMiddleware };
//# sourceMappingURL=metrics-security.middleware.js.map