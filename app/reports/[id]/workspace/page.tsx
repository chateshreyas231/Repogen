'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ReportWorkspace } from '@/components/report-workspace'

export default function ReportWorkspacePage() {
  const params = useParams()
  const id = params.id as string

  return <ReportWorkspace reportId={id} />
}

