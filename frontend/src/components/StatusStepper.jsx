const STEPS = [
  { key: 'parse_resume', label: 'Parse Resume', description: 'Extract text from PDF' },
  { key: 'scrape_job', label: 'Scrape Job Posting', description: 'Fetch & parse job requirements' },
  { key: 'research_company', label: 'Research Company', description: 'Mission, culture, news & tech stack' },
  { key: 'analyze_fit', label: 'Analyze Fit', description: 'Match score & gap analysis' },
  { key: 'tailor_resume', label: 'Tailor Resume', description: 'Rewrite bullets to match role' },
  { key: 'write_cover_letter', label: 'Write Cover Letter', description: 'Personalized to company & role' },
  { key: 'interview_prep', label: 'Interview Prep', description: '10 questions with answer frameworks' },
]

function StepIcon({ status }) {
  if (status === 'complete') {
    return (
      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  if (status === 'running') {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    )
  }
  // pending
  return (
    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center flex-shrink-0" />
  )
}

export default function StatusStepper({ runData }) {
  const stepLatencies = runData?.step_latencies || {}
  const overallStatus = runData?.status || 'pending'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
          Agent Pipeline
        </h2>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          overallStatus === 'complete' ? 'bg-green-100 text-green-700' :
          overallStatus === 'error' ? 'bg-red-100 text-red-700' :
          overallStatus === 'running' ? 'bg-blue-100 text-blue-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {overallStatus}
        </span>
      </div>

      <ol className="space-y-1">
        {STEPS.map((step, idx) => {
          const stepData = stepLatencies[step.key] || { status: 'pending', latency_ms: null }
          const { status, latency_ms } = stepData
          const isLast = idx === STEPS.length - 1

          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <StepIcon status={status} />
                {!isLast && (
                  <div className={`w-0.5 flex-1 mt-1 ${
                    status === 'complete' ? 'bg-green-300' : 'bg-slate-200'
                  }`} style={{ minHeight: '1.25rem' }} />
                )}
              </div>

              <div className="pb-4 min-w-0">
                <p className={`text-sm font-medium leading-tight ${
                  status === 'running' ? 'text-blue-700' :
                  status === 'complete' ? 'text-slate-800' :
                  status === 'error' ? 'text-red-700' :
                  'text-slate-400'
                }`}>
                  {step.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                {latency_ms != null && (
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    {latency_ms < 1000
                      ? `${latency_ms}ms`
                      : `${(latency_ms / 1000).toFixed(1)}s`}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {overallStatus === 'error' && runData?.error_message && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-xs font-semibold text-red-700 mb-1">Error</p>
          <p className="text-xs text-red-600 font-mono break-all whitespace-pre-wrap">
            {runData.error_message}
          </p>
        </div>
      )}
    </div>
  )
}
