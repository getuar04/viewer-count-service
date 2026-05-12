jest.mock('../../../../../src/infra/config/env', () => ({
  env: {
    jwtSecret: 'test-secret',
    redis: { host: 'localhost', port: 6379 },
    kafka: { broker: 'localhost:9092', groupId: 'test', topic: 'test' },
    port: 3000,
  },
}));

import { authMiddleware } from '../../../../../src/infra/http/middlewares/auth';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

const mockReq = (token?: string) =>
  ({
    headers: {
      authorization: token ? `Bearer ${token}` : undefined,
    },
  }) as unknown as Request;

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('authMiddleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should call next when token is valid', () => {
    (jwt.verify as jest.Mock).mockReturnValue({ userId: '123' });

    authMiddleware(mockReq('valid-token'), mockRes(), mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 401 when no token provided', () => {
    const res = mockRes();
    authMiddleware(mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid token');
    });

    const res = mockRes();
    authMiddleware(mockReq('invalid-token'), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 with correct message when no token', () => {
    const res = mockRes();
    authMiddleware(mockReq(), res, mockNext);

    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('should return 401 with correct message when token invalid', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid');
    });

    const res = mockRes();
    authMiddleware(mockReq('bad-token'), res, mockNext);

    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
  });
});
