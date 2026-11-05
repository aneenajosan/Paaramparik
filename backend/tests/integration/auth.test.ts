import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/database';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('Auth & Protected Endpoints - Integration Tests', () => {
  const testUser = {
    id: 'user_123',
    email: 'tester@livingculturemap.org',
    password: 'hashedpassword123',
    name: 'Cultural Explorer',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user successfully', async () => {
      jest.spyOn(prisma.user as any, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user as any, 'create').mockResolvedValue(testUser);

      const res = await request(app).post('/api/auth/register').send({
        email: 'newuser@livingculturemap.org',
        password: 'Password123!',
        name: 'Cultural Explorer',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('returns 400 when email is invalid', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'not-an-email',
        password: 'Password123!',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('authenticates user and returns JWT token', async () => {
      const hashedPassword = await bcrypt.hash('Secret123!', 10);
      jest.spyOn(prisma.user as any, 'findUnique').mockResolvedValue({
        ...testUser,
        password: hashedPassword,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'tester@livingculturemap.org',
        password: 'Secret123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('returns 401 when password does not match', async () => {
      const hashedPassword = await bcrypt.hash('Secret123!', 10);
      jest.spyOn(prisma.user as any, 'findUnique').mockResolvedValue({
        ...testUser,
        password: hashedPassword,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'tester@livingculturemap.org',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Protected Endpoint: GET /api/auth/me', () => {
    it('returns 401 Unauthorized when no Authorization header is provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Authentication token required');
    });

    it('returns 401 Unauthorized when malformed token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid');
    });

    it('returns 200 when valid JWT is provided', async () => {
      const hashedPassword = await bcrypt.hash('Secret123!', 10);
      jest.spyOn(prisma.user as any, 'findUnique').mockResolvedValue({
        ...testUser,
        password: hashedPassword,
      });

      // Login first to get real token
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'tester@livingculturemap.org',
        password: 'Secret123!',
      });

      const token = loginRes.body.data.token;

      // Access protected endpoint
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
    });
  });
});
