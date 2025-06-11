import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../utils/errorHandler';
import { ValidationError, NotFoundError } from '../utils/errors';
import { AxiosError } from 'axios';

describe('errorHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockNext: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test('handles ValidationError correctly', () => {
    const error = new ValidationError('Validation failed', { field: 'required' });
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      details: { field: 'required' }
    });
  });

  test('handles NotFoundError correctly', () => {
    const error = new NotFoundError('Patient', '123');
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Patient with ID 123 not found'
    });
  });

  test('enriches Axios errors metadata', () => {
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

  test('handles unexpected errors with InternalServerError', () => {
    const error = new Error('Unexpected error');
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal server error'
    });
  });
});