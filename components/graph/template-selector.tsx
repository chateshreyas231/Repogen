'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, Building2, CheckSquare, AlertTriangle, BarChart3, Briefcase } from 'lucide-react'
import { reportTemplates, type ReportTemplate } from '@/lib/templates'

interface TemplateSelectorProps {
  onSelectTemplate: (template: ReportTemplate) => void
  onCancel: () => void
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Assessment':
      return <Building2 className="h-5 w-5" />
    case 'Progress':
      return <BarChart3 className="h-5 w-5" />
    case 'Inspection':
      return <CheckSquare className="h-5 w-5" />
    case 'Safety':
      return <AlertTriangle className="h-5 w-5" />
    case 'Technical':
      return <FileText className="h-5 w-5" />
    case 'Summary':
      return <Briefcase className="h-5 w-5" />
    default:
      return <FileText className="h-5 w-5" />
  }
}

export function TemplateSelector({ onSelectTemplate, onCancel }: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = Array.from(new Set(reportTemplates.map((t) => t.category)))
  const filteredTemplates = selectedCategory
    ? reportTemplates.filter((t) => t.category === selectedCategory)
    : reportTemplates

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle>Select Report Template</CardTitle>
          <CardDescription>
            Choose an industry-specific template to start building your report
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {/* Category Filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All Templates
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="flex items-center gap-2"
              >
                {getCategoryIcon(category)}
                {category}
              </Button>
            ))}
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => onSelectTemplate(template)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(template.category)}
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <span className="text-xs px-2 py-1 bg-muted rounded">
                      {template.category}
                    </span>
                  </div>
                  <CardDescription className="mt-2">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    {template.nodes.length} sections
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  )
}

