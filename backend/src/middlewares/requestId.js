import { randomBytes } from 'crypto';

export function requestId(req, res, next) {
    req.requestId = randomBytes(4).toString('hex');
    res.setHeader('x-request-id', req.requestId);
    return next();
}
