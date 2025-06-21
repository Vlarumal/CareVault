import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../utils/errorHandler';
import { OperationalError, ProgrammerError } from '../utils/errors';
import { AxiosError } from 'axios';

describe('errorHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockNext: NextFunction = jest.fn();
  let originalEnv: string | undefined;

  beforeAll(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      originalUrl: '/test',
      headers: {},
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('in development environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    test('handles OperationalError with details', () => {
      const error = new OperationalError('Operational error', 400, { field: 'invalid' });
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Operational error',
        details: { field: 'invalid' }
      });
    });

    test('handles ProgrammerError with details', () => {
      const error = new ProgrammerError('Programmer error', 500);
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Programmer error',
        type: 'ProgrammerError'
      });
    });

    test('handles Axios errors with details', () => {
      const axiosError: AxiosError = {
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed',
        config: {
          method: 'GET',
          url: 'https://api.example.com',
          headers: { Authorization: 'Bearer token' },
          data: { query: 'test' }
        },
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          data: { error: 'Server error' },
          config: {}
        },
      } as unknown as AxiosError;

      errorHandler(axiosError, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'External API request failed',
        details: {
          message: 'Request failed',
          severity: 'high',
          context: {
            request: {
              method: 'GET',
              url: 'https://api.example.com',
              headers: { Authorization: 'Bearer token' },
              data: { query: 'test' }
            },
            response: {
              status: 500,
              headers: {},
              data: { error: 'Server error' }
            }
          }
        }
      });
    });

    test('handles generic errors with details', () => {
      const error = new Error('Generic error');
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Generic error',
        stack: expect.any(String)
      });
    });
  });

  describe('in production environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    test('handles OperationalError with details', () => {
      const error = new OperationalError('Operational error', 400, { field: 'invalid' });
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Operational error',
        details: { field: 'invalid' }
      });
    });

    test('handles ProgrammerError with generic message', () => {
      const error = new ProgrammerError('Programmer error', 500);
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });

    test('handles Axios errors with generic message', () => {
      const axiosError: AxiosError = {
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed',
        config: {
          method: 'GET',
          url: 'https://api.example.com',
          headers: { Authorization: 'Bearer token' },
          data: { query: 'test' }
        },
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          data: { error: 'Server error' },
          config: {}
        },
      } as unknown as AxiosError;

      errorHandler(axiosError, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'External API request failed'
      });
    });

    test('handles generic errors with generic message', () => {
      const error = new Error('Generic error');
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });
  });
});