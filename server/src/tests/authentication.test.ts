import request from 'supertest';
import app from '../../src/index';
import jwt from 'jsonwebtoken';

jest.mock('../../db/connection', () => {
  const mockQuery = jest.fn();
  return {
    __esModule: true,
    default: {
      query: mockQuery
    },
    mockQuery // Export for test access
  };
});

const { mockQuery } = require('../../db/connection');

describe('Authentication Security', () => {
  const mockUser = {
    id: 'user1',
    email: 'testuser@example.com',
    password: 'hashedPassword',
    name: 'Test User'
  };

  const mockAdmin = {
    id: 'admin1',
    email: 'admin@example.com',
    password: 'adminPassHashed',
    name: 'Admin'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /login returns 200 and JWT for valid credentials', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
    mockQuery.mockResolvedValueOnce({ rows: [{ role: 'user' }] });
    
    const response = await request(app)
      .post('/login')
      .send({ email: 'testuser@example.com', password: 'correctPassword' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    
    const decoded = jwt.decode(response.body.token) as jwt.JwtPayload;
    expect(decoded?.id).toBe('user1');
    expect(decoded?.role).toBe('user');
  });

  test('POST /login returns 401 for invalid password', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
    
    const response = await request(app)
      .post('/login')
      .send({ email: 'testuser@example.com', password: 'wrongPassword' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Invalid credentials',
      details: { email: 'Invalid email or password' }
    });
  });

  test('JWT contains correct role after authentication', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockAdmin] });
    mockQuery.mockResolvedValueOnce({ rows: [{ role: 'admin' }] });
    
    const response = await request(app)
      .post('/login')
      .send({ email: 'admin@example.com', password: 'adminPass' });

    const decoded = jwt.decode(response.body.token) as jwt.JwtPayload;
    expect(decoded?.role).toBe('admin');
  });

  describe('Role-based access control', () => {
    test('Middleware allows admin access to admin route', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockAdmin] });
      mockQuery.mockResolvedValueOnce({ rows: [{ role: 'admin' }] });
      const login = await request(app)
        .post('/login')
        .send({ email: 'admin@example.com', password: 'adminPass' });
      
      const token = login.body.token;
      
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ id: mockAdmin.id, role: 'admin' }] 
      });
      
      const response = await request(app)
        .get('/admin-only-route')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
    });

    test('Middleware blocks user access to admin route', async () => {
      // Mock login
      mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
      mockQuery.mockResolvedValueOnce({ rows: [{ role: 'user' }] });
      const login = await request(app)
        .post('/login')
        .send({ email: 'testuser@example.com', password: 'correctPassword' });
      
      const token = login.body.token;
      
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ id: mockUser.id, role: 'user' }] 
      });
      
      const response = await request(app)
        .get('/admin-only-route')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(403);
    });
  });

  test('Account locks after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
      await request(app)
        .post('/login')
        .send({ email: 'testuser@example.com', password: 'wrongPassword' });
    }
    
    // Sixth attempt with correct credentials
    mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
    mockQuery.mockResolvedValueOnce({ rows: [{ count: 5 }] }); // Lockout check
    
    const response = await request(app)
      .post('/login')
      .send({ email: 'testuser@example.com', password: 'correctPassword' });

    expect(response.status).toBe(429);
    expect(response.body).toEqual({ 
      error: 'Account locked. Too many failed attempts' 
    });
  });
});

describe('Token validation middleware', () => {
  const JWT_SECRET = 'test-secret';
  
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  test('missing token returns 401 with code MISSING_TOKEN', async () => {
    const response = await request(app)
      .get('/api/patients')
      .send();
    expect(response.status).toBe(401);
    expect(response.body.code).toBe('MISSING_TOKEN');
  });

  test('invalid token returns 401', async () => {
    const response = await request(app)
      .get('/api/patients')
      .set('Authorization', 'Bearer invalidtoken')
      .send();
    expect(response.status).toBe(401);
  });

  test('valid token without entries:write permission returns 403', async () => {
    const token = jwt.sign(
      { userId: 'test-user', permissions: ['entries:read'] },
      JWT_SECRET
    );
    const response = await request(app)
      .patch('/api/patients/patient1/entries/entry1')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
  });

  test('expired token returns 401', async () => {
    const token = jwt.sign(
      { userId: 'test-user', exp: Math.floor(Date.now()/1000) - 60 },
      JWT_SECRET
    );
    const response = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(response.status).toBe(401);
  });
});