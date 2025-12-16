'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ReportGraphWorkspace } from '@/components/report-graph-workspace'

export default function ReportPage() {
  const params = useParams()
  const reportId = params.id as string

  return <ReportGraphWorkspace reportId={reportId} />
}
