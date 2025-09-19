import { Body, Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/strategy/jwt-auth.guard';
import { RolesGuard } from './auth/strategy/roles.guard';
import { Roles } from './custom.decorator';
import { Role } from './users/enums/role.enum';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private authService: AuthService,
  ) {}
  @Get('/')
  getWelcome(@Res() res) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Prosafe - Incident Tracking & Declaring App</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }
            
            .container {
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 3rem 2rem;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                border: 1px solid rgba(255, 255, 255, 0.18);
                max-width: 500px;
                width: 90%;
            }
            
            .logo {
                font-size: 3rem;
                font-weight: bold;
                margin-bottom: 1rem;
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .subtitle {
                font-size: 1.2rem;
                margin-bottom: 2rem;
                opacity: 0.9;
            }
            
            .description {
                font-size: 1rem;
                margin-bottom: 2rem;
                opacity: 0.8;
                line-height: 1.6;
            }
            
            .api-button {
                display: inline-block;
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
                color: white;
                text-decoration: none;
                padding: 1rem 2rem;
                border-radius: 50px;
                font-weight: bold;
                font-size: 1.1rem;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px 0 rgba(31, 38, 135, 0.4);
            }
            
            .api-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px 0 rgba(31, 38, 135, 0.6);
                color: white;
                text-decoration: none;
            }
            
            .features {
                margin-top: 2rem;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                text-align: left;
            }
            
            .feature {
                background: rgba(255, 255, 255, 0.1);
                padding: 1rem;
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .feature-title {
                font-weight: bold;
                margin-bottom: 0.5rem;
                color: #4ecdc4;
            }
            
            .feature-desc {
                font-size: 0.9rem;
                opacity: 0.8;
            }
            
            @media (max-width: 768px) {
                .container {
                    padding: 2rem 1rem;
                }
                
                .logo {
                    font-size: 2rem;
                }
                
                .features {
                    grid-template-columns: 1fr;
                    text-align: center;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🛡️ PROSAFE</div>
            <div class="subtitle">Incident Tracking & Declaring App</div>
            <div class="description">
                Professional safety management system for tracking, declaring, and managing workplace incidents with comprehensive reporting and analytics.
            </div>
            
            <a href="/api" class="api-button">
                🚀 Explore API Documentation
            </a>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-title">📊 Real-time Tracking</div>
                    <div class="feature-desc">Monitor incidents as they happen with live updates</div>
                </div>
                <div class="feature">
                    <div class="feature-title">📝 Easy Reporting</div>
                    <div class="feature-desc">Simple and intuitive incident declaration process</div>
                </div>
                <div class="feature">
                    <div class="feature-title">📈 Analytics</div>
                    <div class="feature-desc">Comprehensive insights and trend analysis</div>
                </div>
                <div class="feature">
                    <div class="feature-title">🔒 Secure</div>
                    <div class="feature-desc">Enterprise-grade security and data protection</div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  // Add this new endpoint
  @Get('/test-connection')
  testConnection(): { message: string } {
    console.log('Backend received a test connection request!'); // Log on backend
    return { message: 'Backend connection successful!' };
  }

  @Get('/health-check')
  healthCheck(): string {
    return this.appService.healthCheck();
  }

  @Get('/echo')
  getEcho(@Req() req, @Res() res, @Body() body) {
    res.status(200).json(body);
  }

  @Get('/premium-echo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.premium)
  getPremiumEcho(@Req() req, @Res() res, @Body() body) {
    res.status(200).json(body);
  }
}
