import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, Workflow, Download, Database, Eye, Save, CheckCircle, XCircle, Building2, ClipboardList, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold mb-6">
              Professional Report Generation Platform for Compliance and Accessibility Teams
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Transform project resources into structured, defensible reports using our visual graph-based canvas. Build reports with precision and maintain full audit trails.
            </p>
            <div className="flex gap-4">
              <Link href="/login">
                <Button size="lg">Get Started</Button>
              </Link>
              <Button size="lg" variant="outline">
                Schedule Demo
              </Button>
            </div>
          </div>
          <div className="bg-muted rounded-lg p-8 border-2">
            <div className="space-y-4">
              <div className="bg-blue-100 border-2 border-blue-500 rounded p-4">
                <div className="font-semibold text-blue-900">
                  Executive Summary
                </div>
              </div>
              <div className="bg-green-100 border-2 border-green-500 rounded p-4 ml-8">
                <div className="font-semibold text-green-900">Key Findings</div>
              </div>
              <div className="bg-purple-100 border-2 border-purple-500 rounded p-4 ml-16">
                <div className="font-semibold text-purple-900">Data Analysis</div>
              </div>
              <div className="bg-pink-100 border-2 border-pink-500 rounded p-4 ml-8">
                <div className="font-semibold text-pink-900">Visualizations</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-4 text-center">
              Visual Report Canvas
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-background p-6 rounded-lg border">
            <div className="mb-4">
              <Database className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">1. Organize Resources</h3>
            <p className="text-muted-foreground">
              Centralize site notes, documentation, images, and data tables in your project resource library for easy access and reference.
            </p>
          </div>
          <div className="bg-background p-6 rounded-lg border">
            <div className="mb-4">
              <Workflow className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              2. Design Report Structure
            </h3>
            <p className="text-muted-foreground">
              Build your report using our visual canvas. Arrange sections, subsections, tables, and diagrams with intuitive drag-and-drop functionality.
            </p>
          </div>
          <div className="bg-background p-6 rounded-lg border">
            <div className="mb-4">
              <Download className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              3. Export Professional Reports
            </h3>
            <p className="text-muted-foreground">
              Generate Word documents, PDFs, and other formats with proper formatting, tables of contents, and complete section hierarchy.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            <Workflow className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Visual Graph Canvas</h3>
            <p className="text-sm text-muted-foreground">
              Professional graph-based editor for building report structure. Intuitive drag, connect, and arrange functionality.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <FileText className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Section-Level AI Generation</h3>
            <p className="text-sm text-muted-foreground">
              Controlled AI content generation. Each section has its own prompt and resource context, eliminating hallucinations.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <Database className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Tables & Visualizations</h3>
            <p className="text-sm text-muted-foreground">
              Native support for structured data tables and diagram generation. Edit inline or generate with AI assistance.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <FileText className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Centralized Resource Library</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive project resource management. Drag and drop resources onto report sections for context.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <Eye className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Live Report Preview</h3>
            <p className="text-sm text-muted-foreground">
              Real-time preview panel displays the linear report structure. Edit content directly in the preview interface.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <Download className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Multi-Format Export</h3>
            <p className="text-sm text-muted-foreground">
              Export to Word, PDF, text, and markdown formats with proper formatting, tables of contents, and section hierarchy.
            </p>
          </div>
        </div>
      </section>

      {/* Why Repogen */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Repogen vs Generic AI Writing Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          <div>
            <h3 className="text-xl font-semibold mb-4 text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Limitations of Traditional Approaches
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Lack of structural consistency across reports</li>
              <li>• AI-generated content with unverified references</li>
              <li>• Manual copy-paste workflows between multiple tools</li>
              <li>• No audit trail or content provenance</li>
              <li>• Generic templates that don't fit specialized workflows</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4 text-green-600 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Repogen Advantages
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Graph-based structure ensures consistency</li>
              <li>• Resource-grounded AI generation (no hallucinations)</li>
              <li>• Visual canvas for professional report design</li>
              <li>• Complete audit trail and versioning</li>
              <li>• Purpose-built for compliance and accessibility teams</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Designed for Professional Teams</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-6 border rounded-lg text-center">
            <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Accessibility Consultants</h3>
            <p className="text-sm text-muted-foreground">
              Generate ADA compliance reports from site assessments and field observations with full documentation.
            </p>
          </div>
          <div className="p-6 border rounded-lg text-center">
            <Building2 className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">AEC & Code Compliance Teams</h3>
            <p className="text-sm text-muted-foreground">
              Create IBC, state code, and building compliance documentation with structured reporting.
            </p>
          </div>
          <div className="p-6 border rounded-lg text-center">
            <ClipboardList className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Internal Audit & Risk Teams</h3>
            <p className="text-sm text-muted-foreground">
              Produce structured audit reports with complete traceability and documentation.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="container mx-auto px-4 py-20 border-t">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Report Generation Process?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join professional compliance and accessibility teams building better reports with Repogen.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg">Get Started</Button>
            </Link>
            <Button size="lg" variant="outline">
              Contact Sales
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
