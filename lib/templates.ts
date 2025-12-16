// Industry-specific report templates for AEC and technical sectors

export interface ReportTemplate {
  id: string
  name: string
  description: string
  category: string
  nodes: TemplateNode[]
}

export interface TemplateNode {
  type: string
  title: string
  color?: string
  children?: TemplateNode[]
  data?: any
}

export const reportTemplates: ReportTemplate[] = [
  {
    id: 'structural-integrity',
    name: 'Structural Integrity Report',
    description: 'Condition assessment with visual inspection, checklists, and damage severity',
    category: 'Assessment',
    nodes: [
      {
        type: 'section',
        title: 'Executive Summary',
        color: '#3b82f6',
      },
      {
        type: 'section',
        title: 'Visual Inspection Summary',
        color: '#3b82f6',
        children: [
          {
            type: 'sub_section',
            title: 'Inspection Methodology',
          },
          {
            type: 'checklist',
            title: 'Structural Components Checklist',
          },
          {
            type: 'content',
            title: 'Inspection Findings',
          },
        ],
      },
      {
        type: 'section',
        title: 'Damage Assessment',
        color: '#3b82f6',
        children: [
          {
            type: 'sub_section',
            title: 'Severity Classification',
          },
          {
            type: 'table',
            title: 'Damage Inventory',
          },
          {
            type: 'content',
            title: 'Detailed Analysis',
          },
        ],
      },
      {
        type: 'section',
        title: 'Recommendations',
        color: '#3b82f6',
        children: [
          {
            type: 'content',
            title: 'Proposed Actions',
          },
          {
            type: 'table',
            title: 'Priority Matrix',
          },
        ],
      },
      {
        type: 'section',
        title: 'Appendices',
        color: '#3b82f6',
        children: [
          {
            type: 'reference',
            title: 'Standards and Codes',
          },
          {
            type: 'signature',
            title: 'Approval',
          },
        ],
      },
    ],
  },
  {
    id: 'construction-progress',
    name: 'Construction Progress Report',
    description: 'Work completed, schedule adherence, resources, and cost tracking',
    category: 'Progress',
    nodes: [
      {
        type: 'section',
        title: 'Executive Summary',
        color: '#10b981',
      },
      {
        type: 'section',
        title: 'Work Completed',
        color: '#10b981',
        children: [
          {
            type: 'sub_section',
            title: 'Period Summary',
          },
          {
            type: 'chart',
            title: 'Progress Chart',
            data: { chartType: 'bar' },
          },
          {
            type: 'content',
            title: 'Detailed Activities',
          },
        ],
      },
      {
        type: 'section',
        title: 'Schedule & Resources',
        color: '#10b981',
        children: [
          {
            type: 'table',
            title: 'Schedule Adherence',
          },
          {
            type: 'table',
            title: 'Resource Utilization',
          },
          {
            type: 'chart',
            title: 'Cost Trends',
            data: { chartType: 'line' },
          },
        ],
      },
      {
        type: 'section',
        title: 'Issues & Mitigation',
        color: '#10b981',
        children: [
          {
            type: 'content',
            title: 'Current Issues',
          },
          {
            type: 'table',
            title: 'Mitigation Measures',
          },
        ],
      },
      {
        type: 'section',
        title: 'Next Period Plan',
        color: '#10b981',
      },
    ],
  },
  {
    id: 'site-inspection',
    name: 'Site Inspection Report',
    description: 'Field inspection with location, conditions, checklists, and non-conformances',
    category: 'Inspection',
    nodes: [
      {
        type: 'section',
        title: 'Inspection Details',
        color: '#f97316',
        children: [
          {
            type: 'content',
            title: 'Location and Date',
          },
          {
            type: 'content',
            title: 'Inspector Information',
          },
        ],
      },
      {
        type: 'section',
        title: 'Conditions Observed',
        color: '#f97316',
        children: [
          {
            type: 'checklist',
            title: 'Inspection Checklist',
          },
          {
            type: 'content',
            title: 'Description of Conditions',
          },
        ],
      },
      {
        type: 'section',
        title: 'Non-Conformance Items',
        color: '#f97316',
        children: [
          {
            type: 'table',
            title: 'Non-Conformance Log',
          },
          {
            type: 'content',
            title: 'Detailed Findings',
          },
        ],
      },
      {
        type: 'section',
        title: 'Corrective Actions',
        color: '#f97316',
        children: [
          {
            type: 'content',
            title: 'Recommended Actions',
          },
          {
            type: 'table',
            title: 'Action Plan',
          },
        ],
      },
      {
        type: 'section',
        title: 'Signatures',
        color: '#f97316',
        children: [
          {
            type: 'signature',
            title: 'Inspector Signature',
          },
          {
            type: 'signature',
            title: 'Reviewer Signature',
          },
        ],
      },
    ],
  },
  {
    id: 'safety-incident',
    name: 'Safety Incident Report',
    description: 'Incident description, root cause analysis, and corrective actions',
    category: 'Safety',
    nodes: [
      {
        type: 'section',
        title: 'Incident Overview',
        color: '#ef4444',
        children: [
          {
            type: 'content',
            title: 'Incident Description',
          },
          {
            type: 'table',
            title: 'Incident Details',
          },
        ],
      },
      {
        type: 'section',
        title: 'Root Cause Analysis',
        color: '#ef4444',
        children: [
          {
            type: 'content',
            title: 'Analysis',
          },
          {
            type: 'diagram',
            title: 'Cause Diagram',
          },
        ],
      },
      {
        type: 'section',
        title: 'Corrective & Preventive Actions',
        color: '#ef4444',
        children: [
          {
            type: 'table',
            title: 'Action Items',
          },
          {
            type: 'content',
            title: 'Implementation Plan',
          },
        ],
      },
      {
        type: 'section',
        title: 'Risk Assessment',
        color: '#ef4444',
        children: [
          {
            type: 'table',
            title: 'Risk Severity Matrix',
          },
          {
            type: 'content',
            title: 'Risk Mitigation',
          },
        ],
      },
      {
        type: 'section',
        title: 'Compliance',
        color: '#ef4444',
        children: [
          {
            type: 'reference',
            title: 'Safety Regulations',
          },
          {
            type: 'signature',
            title: 'Approval',
          },
        ],
      },
    ],
  },
  {
    id: 'technical-design',
    name: 'Technical Design Report',
    description: 'Background, methodology, calculations, results, and conclusions',
    category: 'Technical',
    nodes: [
      {
        type: 'section',
        title: 'Background & Objectives',
        color: '#8b5cf6',
      },
      {
        type: 'section',
        title: 'Methodology',
        color: '#8b5cf6',
        children: [
          {
            type: 'content',
            title: 'Approach',
          },
          {
            type: 'diagram',
            title: 'Process Flow',
          },
        ],
      },
      {
        type: 'section',
        title: 'Analysis & Calculations',
        color: '#8b5cf6',
        children: [
          {
            type: 'content',
            title: 'Calculations',
          },
          {
            type: 'table',
            title: 'Results Table',
          },
          {
            type: 'chart',
            title: 'Analysis Charts',
            data: { chartType: 'line' },
          },
        ],
      },
      {
        type: 'section',
        title: 'Results & Discussion',
        color: '#8b5cf6',
        children: [
          {
            type: 'content',
            title: 'Findings',
          },
          {
            type: 'diagram',
            title: 'Visualizations',
          },
        ],
      },
      {
        type: 'section',
        title: 'Conclusions',
        color: '#8b5cf6',
      },
      {
        type: 'section',
        title: 'References',
        color: '#8b5cf6',
        children: [
          {
            type: 'reference',
            title: 'Standards',
          },
          {
            type: 'reference',
            title: 'Technical Literature',
          },
        ],
      },
    ],
  },
  {
    id: 'executive-summary',
    name: 'Executive Summary Report',
    description: 'High-level overview with KPIs, metrics, risks, and decisions',
    category: 'Summary',
    nodes: [
      {
        type: 'section',
        title: 'Overview',
        color: '#6366f1',
      },
      {
        type: 'section',
        title: 'Key Metrics & KPIs',
        color: '#6366f1',
        children: [
          {
            type: 'table',
            title: 'KPI Summary',
          },
          {
            type: 'chart',
            title: 'Performance Charts',
            data: { chartType: 'bar' },
          },
        ],
      },
      {
        type: 'section',
        title: 'Schedule & Cost Overview',
        color: '#6366f1',
        children: [
          {
            type: 'table',
            title: 'Schedule Status',
          },
          {
            type: 'table',
            title: 'Cost Summary',
          },
          {
            type: 'chart',
            title: 'Trend Analysis',
            data: { chartType: 'area' },
          },
        ],
      },
      {
        type: 'section',
        title: 'Major Risks & Decisions',
        color: '#6366f1',
        children: [
          {
            type: 'content',
            title: 'Risk Summary',
          },
          {
            type: 'table',
            title: 'Decision Log',
          },
        ],
      },
      {
        type: 'section',
        title: 'Recommendations',
        color: '#6366f1',
      },
    ],
  },
]

export function getTemplateById(id: string): ReportTemplate | undefined {
  return reportTemplates.find((t) => t.id === id)
}

export function getTemplatesByCategory(category: string): ReportTemplate[] {
  return reportTemplates.filter((t) => t.category === category)
}

