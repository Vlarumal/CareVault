import { migrate } from '../../db/migrate';
import pool from '../../db/connection';
import { QueryResult } from 'pg';

jest.mock('../../db/connection', () => ({
  connect: jest.fn(),
}));

describe('Database Migration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use centralized connection pool from connection.ts', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({} as QueryResult),
      release: jest.fn(),
    };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);

    await migrate();

    expect(pool.connect).toHaveBeenCalled();
  });

  it('should run migration without errors', async () => {
    // Mock successful queries
    const mockClient = {
      query: jest.fn().mockResolvedValue({} as QueryResult),
      release: jest.fn(),
    };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);

    await expect(migrate()).resolves.not.toThrow();
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  });

  it('should handle transaction rollback on error', async () => {
    // Mock error during migration
    const mockClient = {
      query: jest
        .fn()
        .mockResolvedValueOnce({} as QueryResult)
        .mockRejectedValue(new Error('Migration failed')),
      release: jest.fn(),
    };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);

    await expect(migrate()).rejects.toThrow('Migration failed');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });
});
