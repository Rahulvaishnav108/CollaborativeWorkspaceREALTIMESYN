import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  Users, 
  FileText, 
  CheckSquare, 
  Upload, 
  Bell, 
  BarChart3, 
  Shield,
  Zap,
  Globe,
  Clock
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <Zap className="h-6 w-6 text-primary" />
          <span className="ml-2 text-2xl font-bold">SyncSpace</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#tech-stack">
            Technology
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#security">
            Security
          </Link>
        </nav>
        <div className="ml-4 flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/register">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Real-Time Collaborative Workspace
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                One workspace. Every conversation. Work together in real time.
              </p>
              <p className="mx-auto max-w-[600px] text-muted-foreground">
                Collaborate in real time, communicate clearly, and get work done together with industry-standard 
                security and enterprise-grade features.
              </p>
            </div>
            <div className="space-x-4">
              <Button size="lg" asChild>
                <Link href="/auth/register">Start Collaborating</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#features">Explore Features</Link>
              </Button>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-1" />
                Real-time sync
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                Enterprise security
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Always available
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <Badge variant="secondary">Core Features</Badge>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Everything you need for team collaboration
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                From real-time messaging to collaborative documents, project management to analytics - 
                SyncSpace provides all the tools modern teams need.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            <Card>
              <CardHeader>
                <MessageCircle className="h-8 w-8 text-primary" />
                <CardTitle>Real-Time Messaging</CardTitle>
                <CardDescription>
                  Instant communication with channels, direct messages, and group conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Public and private channels</li>
                  <li>• Typing indicators & presence</li>
                  <li>• Message threads & reactions</li>
                  <li>• File sharing & search</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary" />
                <CardTitle>Team Management</CardTitle>
                <CardDescription>
                  Organize workspaces with role-based permissions and member management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Multiple workspaces</li>
                  <li>• Role-based access control</li>
                  <li>• Team invitations</li>
                  <li>• Permission management</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-8 w-8 text-primary" />
                <CardTitle>Collaborative Documents</CardTitle>
                <CardDescription>
                  Edit documents together with live cursors and real-time synchronization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Simultaneous editing</li>
                  <li>• Live cursors & presence</li>
                  <li>• Version history</li>
                  <li>• Comments & suggestions</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CheckSquare className="h-8 w-8 text-primary" />
                <CardTitle>Project Management</CardTitle>
                <CardDescription>
                  Organize work with Kanban boards, task lists, and milestone tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Kanban & list views</li>
                  <li>• Task assignments</li>
                  <li>• Priority & deadlines</li>
                  <li>• Progress tracking</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Upload className="h-8 w-8 text-primary" />
                <CardTitle>File Management</CardTitle>
                <CardDescription>
                  Secure file sharing with organized storage and access controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Drag & drop uploads</li>
                  <li>• File preview</li>
                  <li>• Access permissions</li>
                  <li>• S3-compatible storage</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary" />
                <CardTitle>Analytics & Insights</CardTitle>
                <CardDescription>
                  Track team productivity and project progress with detailed analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Team activity tracking</li>
                  <li>• Project progress metrics</li>
                  <li>• Workload distribution</li>
                  <li>• Exportable reports</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section id="tech-stack" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <Badge variant="secondary">Technology Stack</Badge>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Built with industry-leading technologies
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                Modern, scalable architecture using the latest tools and frameworks for optimal performance and reliability.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-2 lg:gap-12">
            <Card>
              <CardHeader>
                <CardTitle>Frontend</CardTitle>
                <CardDescription>Modern React ecosystem with TypeScript</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Badge variant="outline">Next.js</Badge>
                  <Badge variant="outline">React</Badge>
                  <Badge variant="outline">TypeScript</Badge>
                  <Badge variant="outline">Tailwind CSS</Badge>
                  <Badge variant="outline">Zustand</Badge>
                  <Badge variant="outline">TanStack Query</Badge>
                  <Badge variant="outline">React Hook Form</Badge>
                  <Badge variant="outline">Zod</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backend</CardTitle>
                <CardDescription>Scalable Node.js with real-time capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Badge variant="outline">Node.js</Badge>
                  <Badge variant="outline">NestJS</Badge>
                  <Badge variant="outline">Socket.IO</Badge>
                  <Badge variant="outline">PostgreSQL</Badge>
                  <Badge variant="outline">Prisma</Badge>
                  <Badge variant="outline">Redis</Badge>
                  <Badge variant="outline">Yjs</Badge>
                  <Badge variant="outline">Docker</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <Badge variant="secondary">Security & Compliance</Badge>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Enterprise-grade security built in
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                Your data is protected with industry-standard security practices and comprehensive access controls.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-3xl items-start gap-6 py-12 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Data Protection</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• End-to-end encryption for sensitive data</li>
                <li>• Secure file storage with signed URLs</li>
                <li>• Regular security audits and updates</li>
                <li>• GDPR and privacy compliance</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Access Control</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Role-based permissions system</li>
                <li>• Multi-factor authentication</li>
                <li>• Session management and timeouts</li>
                <li>• Audit logs for compliance</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/5">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Ready to transform your team collaboration?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                Join thousands of teams already using SyncSpace to work better together.
              </p>
            </div>
            <div className="space-x-4">
              <Button size="lg" asChild>
                <Link href="/auth/register">Start Free Trial</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2024 SyncSpace. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#terms">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#privacy">
            Privacy Policy
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#contact">
            Contact
          </Link>
        </nav>
      </footer>
    </div>
  )
}