'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ReportCanvas } from '@/components/report-canvas'

export default function CanvasPage() {
  const params = useParams()
  const reportId = params.id as string

  return <ReportCanvas reportId={reportId} />
}

