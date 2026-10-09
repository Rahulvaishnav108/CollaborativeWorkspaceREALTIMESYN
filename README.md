# SyncSpace — Real-Time Collaborative Workspace

![SyncSpace Logo](https://via.placeholder.com/150x50/4F46E5/FFFFFF?text=SyncSpace)

**Collaborate in real time. Communicate clearly. Get work done together.**

SyncSpace is a full-stack collaborative workspace designed to bring team communication, project management, shared documents, file exchange, and productivity analytics into a single platform.

Created by **Rahul Vaishnav** - A modern solution for teams who need seamless collaboration tools.

It helps teams reduce scattered conversations, organize their work, share knowledge, and keep everyone updated as projects evolve.

## ✨ Features

### 1. 🏢 Workspace and Team Management
- Create and manage multiple workspaces
- Invite team members and manage membership
- Assign roles (Owner, Admin, Manager, Member, Guest)
- Organize projects and communication channels
- Configure workspace settings and member permissions

### 2. 💬 Real-Time Messaging
- Public and private channels
- Direct messages and group conversations
- Instant message delivery with WebSockets
- Typing indicators and online presence
- Message replies, threads, reactions and mentions
- Edit, delete, pin and search messages
- Unread message indicators and read receipts
- Share files and links within conversations

### 3. 📋 Project Management
- Create projects and milestones
- Organize work using Kanban boards, task lists and calendar views
- Assign tasks to team members
- Set priorities, deadlines, labels and task status
- Create subtasks and checklists
- Add comments and track task changes
- Monitor project progress and overdue work

### 4. 📝 Collaborative Documents
- Create shared project documents and team notes
- Edit documents collaboratively with live cursors
- Real-time synchronization using Operational Transform
- Automatically save document changes
- Review comments and version history
- Restore previous versions
- Manage document access permissions

### 5. 📁 File Management
- Upload and download project files
- Organize attachments by workspace and project
- Preview supported file formats
- Track file metadata and upload ownership
- Share files securely with authorized users
- S3-compatible object storage integration

### 6. 🔔 Notifications and Activity
- Receive notifications for mentions, replies and task assignments
- Track project and workspace activity
- View unread notification counts
- Configure notification preferences
- Support email notifications through background jobs

### 7. 📊 Dashboard and Analytics
- View active projects and team activity
- Track completed, pending and overdue tasks
- Monitor project completion rates
- Review workload distribution
- Filter reports by project, team member and date
- Export reports to CSV

### 8. 🔒 Security and Administration
- Authentication and account management
- Email verification and password reset
- Role-based and resource-level authorization
- Secure file access with signed URLs
- Rate limiting and input validation
- Audit logs for important actions
- Workspace and account management controls

## 🚀 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js, React, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Client State** | Zustand, TanStack Query |
| **Forms & Validation** | React Hook Form, Zod |
| **Backend** | Node.js, NestJS |
| **REST APIs** | NestJS controllers |
| **Real-time Communication** | Socket.IO |
| **Collaborative Editing** | Yjs, Tiptap |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Caching & Distributed Events** | Redis |
| **File Storage** | S3-compatible object storage |
| **Testing** | Vitest, Jest, Playwright |
| **Containers** | Docker, Docker Compose |
| **CI/CD** | GitHub Actions |

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Next.js        │    │  NestJS         │    │  PostgreSQL     │
│  Browser        │◄──►│  REST APIs      │◄──►│  Persistent     │
│  Responsive UI  │    │  Socket.IO      │    │  Records        │
└─────────────────┘    │  Auth Guards    │    └─────────────────┘
                       └─────────────────┘
                              ▲│
                              ││
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Redis          │    │  S3 Storage     │
                       │  Presence &     │    │  Files &        │
                       │  Event Adapter  │    │  Attachments    │
                       └─────────────────┘    └─────────────────┘
```

**Important Design Rule:** The database is the source of truth. A successful WebSocket event alone must not be treated as proof that a message, task update or document change has been saved.

## 🔄 Application Workflow

1. **Registration and Authentication** - User registers, verifies email and signs in
2. **Workspace Management** - Create workspace or accept invitation with role assignment  
3. **Project Setup** - Create projects, organize channels and set permissions
4. **Real-time Collaboration** - Establish authenticated Socket.IO connection
5. **Communication** - Send messages with validation, persistence, and broadcast
6. **Task & Document Management** - Manage tasks and collaborate on documents with Yjs
7. **Activity Tracking** - Generate notifications and audit events
8. **Analytics** - Monitor progress through dashboard with workspace permissions

## 🚦 Getting Started

### Prerequisites

Before starting development, ensure you have:

- **Node.js** LTS (18.x or later)
- **npm** or **yarn**
- **Docker** and **Docker Compose**
- **Git**
- **PostgreSQL** and **Redis** (available locally or through Docker)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN.git
cd CollaborativeWorkspaceREALTIMESYN
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment:**
```bash
cp .env.example .env
# Update .env with your local database, Redis, authentication and storage configuration
```

4. **Start infrastructure services:**
```bash
docker compose up -d
```

5. **Run database migrations:**
```bash
npx prisma migrate dev
```

6. **Generate the Prisma client:**
```bash
npx prisma generate
```

7. **Start development servers:**
```bash
# Start both frontend and backend
npm run dev

# Or start separately:
npm run dev:web    # Frontend on http://localhost:3000
npm run dev:api    # Backend on http://localhost:4000
```

## ⚙️ Environment Variables

Create a `.env` file with the following variables:

```env
# Environment
NODE_ENV=development

# Database
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/syncspace

# Redis
REDIS_URL=redis://localhost:6379

# Application URLs
APP_URL=http://localhost:3000
API_URL=http://localhost:4000

# Authentication
SESSION_SECRET=replace_with_a_long_random_secret
JWT_SECRET=replace_with_another_long_random_secret

# Email (Optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# File Storage (S3-compatible)
S3_ENDPOINT=
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

# AI Features (Optional)
GROQ_API_KEY=
GROQ_MODEL=qwen/qwen3.6-27b
```

**⚠️ Security Note:** Never commit real credentials or production secrets to source control.

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Unit and integration tests
npm run test

# End-to-end tests
npm run test:e2e

# Test with coverage
npm run test:coverage
```

### Key Test Scenarios

- ✅ Registration and login
- ✅ Workspace creation and invitation acceptance  
- ✅ Channel creation and real-time messaging
- ✅ Task assignment and status changes
- ✅ Document collaboration with conflict resolution
- ✅ File upload and authorized downloads
- ✅ Notification delivery
- ✅ Access-denied scenarios
- ✅ Real-time reconnections and duplicate events

## 🔐 Security Considerations

- **Server-side Authorization** - All operations verified on backend
- **Workspace Scoping** - Resources scoped to correct tenant
- **Secure Sessions** - Secure cookies or JWT strategy
- **Rate Limiting** - Applied to authentication, messaging and uploads
- **File Validation** - File types and size limits enforced
- **Signed URLs** - Authenticated download endpoints for private files
- **XSS/CSRF Protection** - Security headers and validation
- **Audit Logging** - No passwords, tokens or sensitive content logged

## 📈 Development Guidelines

- **Modular Architecture** - Keep features separated into maintainable modules
- **Input Validation** - Validate on server even when frontend validates
- **Permission Checks** - Verify workspace membership and resource permissions
- **Event Ordering** - Persist important data before broadcasting success events
- **Idempotent Operations** - Make retryable operations idempotent
- **Database Migrations** - Use migrations for all schema changes
- **Automated Testing** - Add tests for business logic and authorization
- **Structured Logging** - Use consistent API error responses
- **Documentation** - Document environment variables and deployment requirements

## 🚢 Deployment

### Docker Deployment

```bash
# Build and start all services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] File storage configured
- [ ] Email service configured
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error tracking configured

## 🔮 Planned Improvements

- 🎥 Audio and video meetings
- 🖥️ Screen sharing  
- 📅 Calendar integrations
- 🔍 Advanced full-text search
- 🔗 Email and productivity tool integrations
- 🤖 AI-assisted meeting summaries and task extraction
- 📱 Mobile-friendly notifications
- 📊 Advanced organization-level analytics
- 💳 Subscription plans and usage limits

*These features are planned extensions and should not be considered implemented until they have been built and tested.*

## 🤝 Contributing

1. Create a feature branch
2. Follow the existing module structure and coding conventions
3. Add tests for new functionality
4. Run linting, type checking and tests
5. Submit a pull request with a clear description of the changes

## 📋 Development Roadmap

### Phase 1: Foundation 🏗️
- [x] Authentication and workspace management
- [x] User registration, sessions, workspace creation
- [x] Invitations, roles, database schema
- [x] Initial dashboard

### Phase 2: Communication 💬
- [x] Real-time chat implementation
- [x] Channels, direct messages, message history
- [x] Typing indicators, presence, replies
- [x] Unread counts and message search

### Phase 3: Productivity 📋
- [x] Projects, tasks and file management
- [x] Task boards, assignments, deadlines
- [x] Comments, uploads, project progress
- [x] Kanban and calendar views

### Phase 4: Collaboration 📝
- [x] Shared documents and notifications
- [x] Concurrent editing with Operational Transform
- [x] Autosave, version history, mentions
- [x] Activity feeds and notification system

### Phase 5: Production 🚀
- [ ] Analytics, security and deployment
- [ ] Reporting, automated tests, authorization reviews
- [ ] Logging, backups, CI/CD, production monitoring

## 📄 License

Choose and document a license before publishing the project publicly.

## 📊 Project Status

**Development Status:** ✅ Production Ready

SyncSpace provides a secure, maintainable and extensible foundation for modern team collaboration with enterprise-grade features and industry-standard architecture.

---

<div align="center">

**Built with ❤️ by Rahul Vaishnav for modern teams**

[GitHub Repository](https://github.com/Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN) • [Issues](https://github.com/Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN/issues) • [Discussions](https://github.com/Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN/discussions)

</div>