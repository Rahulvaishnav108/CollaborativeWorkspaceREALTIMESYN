import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../common/database/prisma.service'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastSeenAt: true,
      },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastSeenAt: true,
      },
    })
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastSeenAt: true,
      },
    })
  }

  async searchUsers(query: string, currentUserId: string, limit = 10) {
    return this.prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
          {
            id: { not: currentUserId },
          },
          {
            status: 'ACTIVE',
          },
        ],
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        status: true,
      },
      take: limit,
    })
  }

  async getUserWorkspaces(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            description: true,
            slug: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    })

    return memberships.map((membership) => ({
      ...membership.workspace,
      role: membership.role,
      joinedAt: membership.createdAt,
    }))
  }

  async updateLastSeen(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
      select: { lastSeenAt: true },
    })
  }

  async getUserStats(userId: string) {
    const [
      workspaceCount,
      projectCount,
      taskCount,
      completedTaskCount,
      documentCount,
    ] = await Promise.all([
      this.prisma.workspaceMember.count({
        where: { userId },
      }),
      this.prisma.project.count({
        where: { createdById: userId },
      }),
      this.prisma.task.count({
        where: { assigneeId: userId },
      }),
      this.prisma.task.count({
        where: {
          assigneeId: userId,
          status: 'DONE',
        },
      }),
      this.prisma.document.count({
        where: { createdById: userId },
      }),
    ])

    return {
      workspaces: workspaceCount,
      projects: projectCount,
      tasks: taskCount,
      completedTasks: completedTaskCount,
      documents: documentCount,
    }
  }
}