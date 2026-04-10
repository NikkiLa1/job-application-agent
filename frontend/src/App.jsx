import { useCallback, useEffect, useRef, useState } from 'react'
import MetricsBadge from './components/MetricsBadge.jsx'
import ResultsPanel from './components/ResultsPanel.jsx'
import StatusStepper from './components/StatusStepper.jsx'
import UploadForm from './components/UploadForm.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App() {
  const [view, setView] = useState('upload') // 'upload' | 'results'
  const [runId, setRunId] = useState(null)
  const [runData, setRunData] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const pollRef = useRef(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const fetchRun = useCallback(
    async (id) => {
      try {
        const res = await fetch(`${API_URL}/api/run/${id}`)
        if (!res.ok) return
        const data = await res.json()
        setRunData(data)
        if (data.status === 'complete' || data.status === 'error') {
          stopPolling()
        }
      } catch {
        // Network error — keep polling
      }
    },
    [stopPolling]
  )

  useEffect(() => {
    if (!runId) return
    fetchRun(runId)
    pollRef.current = setInterval(() => fetchRun(runId), 2000)
    return stopPolling
  }, [runId, fetchRun, stopPolling])

  const handleSubmit = async (file, jobUrl) => {
    setSubmitError(null)
    const formData = new FormData()
    formData.append('resume', file)
    formData.append('job_url', jobUrl)

    try {
      const res = await fetch(`${API_URL}/api/run`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Server error ${res.status}`)
      }
      const { run_id } = await res.json()
      setRunId(run_id)
      setView('results')
    } catch (err) {
      setSubmitError(err.message)
    }
  }

  const handleReset = () => {
    stopPolling()
    setView('upload')
    setRunId(null)
    setRunData(null)
    setSubmitError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Job Application Agent</h1>
              <p className="text-xs text-slate-500">AI-powered application tailoring</p>
            </div>
          </div>
          {view === 'results' && (
            <button
              onClick={handleReset}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              New Application
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {view === 'upload' ? (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">
                Land your dream job
              </h2>
              <p className="text-slate-600">
                Upload your resume and a job posting URL. Our AI agent researches the company,
                tailors your resume, writes a cover letter, and preps you for interviews.
              </p>
            </div>
            <UploadForm onSubmit={handleSubmit} error={submitError} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Metrics at the top once available */}
            {runData && (
              <MetricsBadge runData={runData} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Stepper */}
              <div className="lg:col-span-1">
                <StatusStepper runData={runData} />
              </div>

              {/* Right: Results */}
              <div className="lg:col-span-2">
                <ResultsPanel runData={runData} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
