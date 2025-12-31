import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';

@Injectable()
export class MetricsSecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger('MetricsSecurity');

  use(req: Request, res: Response, next: NextFunction) {
    const clientIp = req.ip || req.socket?.remoteAddress;

    // Блокируем доступ если IP не определён
    if (!clientIp) {
      this.logger.warn('Доступ к метрикам заблокирован: IP не определён');
      return res.status(403).json({
        error: 'Access denied',
        message: 'Metrics endpoint is only accessible from internal network',
      });
    }

    // Разрешаем доступ только из внутренней Docker сети
    const allowedNetworks = [
      '127.0.0.1',
      '::1',
      '::ffff:127.0.0.1',
      // Docker internal networks
      /^172\./, // 172.x.x.x
      /^192\.168\./, // 192.168.x.x
    ];

    const isAllowed = allowedNetworks.some((network) => {
      if (typeof network === 'string') {
        return clientIp === network;
      }
      return network.test(clientIp);
    });

    if (!isAllowed) {
      this.logger.warn(`Доступ к метрикам заблокирован для IP: ${clientIp}`);
      return res.status(403).json({
        error: 'Access denied',
        message: 'Metrics endpoint is only accessible from internal network',
      });
    }

    next();
  }
}
