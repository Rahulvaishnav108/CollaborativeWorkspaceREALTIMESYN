import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateUserDto {
  @ApiProperty({ 
    example: 'user@example.com', 
    description: 'User email address' 
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string

  @ApiProperty({ 
    example: 'johndoe', 
    description: 'Unique username',
    minLength: 3,
    maxLength: 20
  })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(20, { message: 'Username must not exceed 20 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and hyphens'
  })
  username: string

  @ApiProperty({ 
    example: 'SecurePassword123!', 
    description: 'User password',
    minLength: 8
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  password: string

  @ApiProperty({ 
    example: 'John', 
    description: 'User first name',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName?: string

  @ApiProperty({ 
    example: 'Doe', 
    description: 'User last name',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName?: string
}

export class LoginDto {
  @ApiProperty({ 
    example: 'user@example.com', 
    description: 'User email address' 
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string

  @ApiProperty({ 
    example: 'SecurePassword123!', 
    description: 'User password' 
  })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string
}

export class ChangePasswordDto {
  @ApiProperty({ 
    example: 'CurrentPassword123!', 
    description: 'Current password' 
  })
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  currentPassword: string

  @ApiProperty({ 
    example: 'NewSecurePassword123!', 
    description: 'New password' 
  })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  newPassword: string
}

export class RequestPasswordResetDto {
  @ApiProperty({ 
    example: 'user@example.com', 
    description: 'Email address to send reset link to' 
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string
}

export class ResetPasswordDto {
  @ApiProperty({ 
    example: 'reset-token-123', 
    description: 'Password reset token' 
  })
  @IsString()
  @MinLength(1, { message: 'Reset token is required' })
  token: string

  @ApiProperty({ 
    example: 'NewSecurePassword123!', 
    description: 'New password' 
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  newPassword: string
}

export class UpdateProfileDto {
  @ApiProperty({ 
    example: 'John', 
    description: 'User first name',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName?: string

  @ApiProperty({ 
    example: 'Doe', 
    description: 'User last name',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName?: string

  @ApiProperty({ 
    example: 'Software engineer passionate about collaboration tools', 
    description: 'User bio',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio must not exceed 500 characters' })
  bio?: string

  @ApiProperty({ 
    example: 'https://example.com/avatar.jpg', 
    description: 'User avatar URL',
    required: false 
  })
  @IsOptional()
  @IsString()
  avatar?: string
}