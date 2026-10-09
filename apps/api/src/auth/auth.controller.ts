import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Patch, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus 
} from '@nestjs/common'
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody 
} from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import {
  CreateUserDto,
  LoginDto,
  ChangePasswordDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './dto/auth.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            avatar: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          }
        },
        token: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully logged in',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            avatar: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          }
        },
        token: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Current user profile',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        username: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        avatar: { type: 'string' },
        bio: { type: 'string' },
        status: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        lastSeenAt: { type: 'string' },
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    return this.authService.getUserProfile(req.user.id)
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile updated successfully' 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, updateProfileDto)
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password changed successfully' 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    )
  }

  @Post('refresh-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully' 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user.id)
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ 
    status: 200, 
    description: 'If the email exists, a reset link has been sent' 
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 attempts per 5 minutes
  async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(requestPasswordResetDto.email)
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset successfully' 
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword
    )
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user (client-side token invalidation)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout successful' 
  })
  async logout() {
    // JWT tokens are stateless, so logout is handled client-side
    // This endpoint exists for consistency and potential future token blacklisting
    return { message: 'Logout successful' }
  }
}