import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  Post,
  HttpCode,
  HttpStatus 
} from '@nestjs/common'
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery 
} from '@nestjs/swagger'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search for users' })
  @ApiQuery({ 
    name: 'q', 
    description: 'Search query', 
    example: 'john' 
  })
  @ApiQuery({ 
    name: 'limit', 
    description: 'Maximum number of results', 
    required: false,
    example: 10 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of matching users',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          username: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          avatar: { type: 'string' },
          status: { type: 'string' },
        }
      }
    }
  })
  async searchUsers(
    @Query('q') query: string,
    @Query('limit') limit?: number,
    @Request() req
  ) {
    return this.usersService.searchUsers(
      query, 
      req.user.id, 
      limit ? parseInt(limit.toString()) : undefined
    )
  }

  @Get('me/workspaces')
  @ApiOperation({ summary: 'Get current user workspaces' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of user workspaces with roles' 
  })
  async getUserWorkspaces(@Request() req) {
    return this.usersService.getUserWorkspaces(req.user.id)
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get current user statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'User activity statistics',
    schema: {
      type: 'object',
      properties: {
        workspaces: { type: 'number' },
        projects: { type: 'number' },
        tasks: { type: 'number' },
        completedTasks: { type: 'number' },
        documents: { type: 'number' },
      }
    }
  })
  async getUserStats(@Request() req) {
    return this.usersService.getUserStats(req.user.id)
  }

  @Post('me/ping')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user last seen timestamp' })
  @ApiResponse({ 
    status: 200, 
    description: 'Last seen timestamp updated' 
  })
  async ping(@Request() req) {
    return this.usersService.updateLastSeen(req.user.id)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ 
    name: 'id', 
    description: 'User ID' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User information',
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
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id)
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get user by username' })
  @ApiParam({ 
    name: 'username', 
    description: 'Username' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User information' 
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByUsername(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username)
    if (!user) {
      return { message: 'User not found' }
    }
    return user
  }
}