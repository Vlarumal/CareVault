import request from 'supertest';
import app from '../index';
// import { createTestToken } from './testUtils';

describe('Authentication middleware', () => {
  test('missing token returns 401 with code MISSING_TOKEN', async () => {
    const response = await request(app)
      .patch('/api/entries/some-entry-id')
      .send({});
    expect(response.status).toBe(401);
    expect(response.body.code).toBe('MISSING_TOKEN');
  });

  test('invalid token returns 401', async () => {
    const response = await request(app)
      .patch('/api/entries/some-entry-id')
      .set('Authorization', 'Bearer invalidtoken')
      .send({});
    expect(response.status).toBe(401);
  });

  // test('valid token without entries:write permission returns 403', async () => {
  //   const token = createTestToken({ permissions: ['entries:read'] });
  //   const response = await request(app)
  //     .patch('/api/entries/some-entry-id')
  //     .set('Authorization', `Bearer ${token}`)
  //     .send({});
  //   expect(response.status).toBe(403);
  //   expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
  // });

//   test('expired token returns 401', async () => {
//     const token = createTestToken({ exp: Math.floor(Date.now()/1000) - 60 });
//     const response = await request(app)
//       .patch('/api/entries/some-entry-id')
//       .set('Authorization', `Bearer ${token}`)
//       .send({});
//     expect(response.status).toBe(401);
//   });
});