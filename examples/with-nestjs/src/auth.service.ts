import { Injectable } from '@nestjs/common';
import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  scopes: string[];
  permissions?: string[];
}

@Injectable()
export class AuthService {
  // Example token verification - replace with your actual authentication logic
  async verifyToken(req: Request, token: string): Promise<AuthUser> {
    // This is a mock implementation
    // In a real application, you would:
    // 1. Validate the JWT token
    // 2. Check against your database
    // 3. Verify token expiration
    // 4. Check user permissions
    
    if (token === 'valid-token') {
      return {
        id: 'user-123',
        email: 'user@example.com',
        scopes: ['read', 'write', 'admin'],
        permissions: ['tools:read', 'tools:write'],
      };
    }
    
    if (token === 'read-only-token') {
      return {
        id: 'user-456',
        email: 'readonly@example.com',
        scopes: ['read'],
        permissions: ['tools:read'],
      };
    }
    
    throw new Error('Invalid or expired token');
  }

  // Helper method to check if user has required scopes
  hasRequiredScopes(user: AuthUser, requiredScopes: string[]): boolean {
    return requiredScopes.every(scope => user.scopes.includes(scope));
  }

  // Helper method to check if user has required permissions
  hasRequiredPermissions(user: AuthUser, requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => 
      user.permissions?.includes(permission)
    );
  }
}
