import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../common/database/prisma.service'
import { CreateUserDto, LoginDto } from './dto/auth.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { email, username, password, firstName, lastName } = createUserDto

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    })

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already registered')
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username already taken')
      }
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastSeenAt: true,
      },
    })

    // Generate JWT token
    const token = await this.generateToken(user.id)

    return {
      user,
      token,
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active')
    }

    // Update last seen
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    })

    // Generate JWT token
    const token = await this.generateToken(user.id)

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword,
      token,
    }
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { 
        id: userId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastSeenAt: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not found or inactive')
    }

    return user
  }

  async getUserProfile(userId: string) {
    return this.validateUser(userId)
  }

  async updateProfile(userId: string, updateData: Partial<CreateUserDto>) {
    const { password, ...otherData } = updateData

    const updatePayload: any = { ...otherData }

    // Hash new password if provided
    if (password) {
      const saltRounds = 12
      updatePayload.password = await bcrypt.hash(password, saltRounds)
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updatePayload,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastSeenAt: true,
      },
    })

    return user
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect')
    }

    // Hash new password
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    })

    return { message: 'Password changed successfully' }
  }

  async generateToken(userId: string): Promise<string> {
    const payload = { sub: userId }
    return this.jwtService.signAsync(payload)
  }

  async verifyToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token)
      return payload
    } catch (error) {
      throw new UnauthorizedException('Invalid token')
    }
  }

  async refreshToken(userId: string) {
    const user = await this.validateUser(userId)
    const token = await this.generateToken(user.id)
    
    return {
      user,
      token,
    }
  }

  // Password reset functionality
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Don't reveal if email exists or not
      return { message: 'If the email exists, a reset link has been sent' }
    }

    // Generate reset token
    const resetToken = this.generateResetToken()
    const resetExpires = new Date(Date.now() + 3600000) // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    })

    // TODO: Send email with reset link
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken)

    return { message: 'If the email exists, a reset link has been sent' }
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    })

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token')
    }

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    })

    return { message: 'Password reset successfully' }
  }

  private generateResetToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }
}