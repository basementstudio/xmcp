import { Controller, Post, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { xmcpHandler, XmcpController, XmcpEndpoint, withAuth, createXmcpMiddleware } from '@xmcp/adapter';
import { AuthService } from './auth.service';

@Controller('mcp')
export class AppController {
  constructor(private readonly authService: AuthService) {}
  
  // Method 1: Direct handler usage
  @Post()
  async handleMcpRequest(@Req() req: Request, @Res() res: Response) {
    return xmcpHandler(req as any, res as any);
  }

  // Method 2: Using the controller class
  @Get()
  async handleMcpGet(@Req() req: Request, @Res() res: Response) {
    return XmcpController.handleMcpRequest(req as any, res as any);
  }

  // Method 3: Using the decorator
  @Post('endpoint')
  @XmcpEndpoint()
  async handleMcpWithDecorator(@Req() req: Request, @Res() res: Response) {
    // This method will be replaced by the decorator
    return;
  }

  // Method 4: With authentication
  @Post('auth')
  async handleMcpWithAuth(@Req() req: Request, @Res() res: Response) {
    const authenticatedHandler = withAuth(xmcpHandler, {
      required: true,
      verifyToken: async (req: any, token: string) => {
        return this.authService.verifyToken(req, token);
      },
      requiredScopes: ['read'],
    });
    
    return authenticatedHandler(req as any, res as any);
  }

  // Method 5: With middleware
  @Post('middleware')
  async handleMcpWithMiddleware(@Req() req: Request, @Res() res: Response) {
    // Apply XMCP middleware
    const xmcpMiddleware = createXmcpMiddleware();
    
    // In a real application, you'd apply this middleware in your app module
    // For this example, we'll just call the handler directly
    return xmcpHandler(req as any, res as any);
  }
}
