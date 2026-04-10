export default function MetricsBadge({ runData }) {
  const scoreBefore = runData?.match_score_before
  const scoreAfter = runData?.match_score_after
  const jobTitle = runData?.job_title
  const companyName = runData?.company_name

  const latencies = runData?.step_latencies || {}
  const totalMs = Object.values(latencies).reduce((acc, v) => {
    return acc + (typeof v === 'object' && v?.latency_ms ? v.latency_ms : 0)
  }, 0)

  const improvement =
    scoreBefore != null && scoreAfter != null
      ? (scoreAfter - scoreBefore).toFixed(1)
      : null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      {(jobTitle || companyName) && (
        <div className="mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Applying for</p>
          <p className="text-base font-bold text-slate-900 mt-0.5">
            {jobTitle || '—'}
            {companyName && <span className="font-normal text-slate-600"> at {companyName}</span>}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Match Score Badge */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4">
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-2">
            Match Score
          </p>
          {scoreBefore != null ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-700">{scoreBefore}%</span>
                {scoreAfter != null && (
                  <>
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="text-2xl font-bold text-blue-700">{scoreAfter}%</span>
                  </>
                )}
              </div>
              {improvement != null && (
                <p className={`text-sm font-semibold mt-1 ${
                  parseFloat(improvement) > 0 ? 'text-green-600' : 'text-slate-500'
                }`}>
                  {parseFloat(improvement) > 0 ? `↑ +${improvement}%` : `${improvement}%`} improvement
                </p>
              )}
              {scoreAfter == null && (
                <p className="text-xs text-slate-500 mt-1">tailoring in progress...</p>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Analyzing...</p>
          )}
        </div>

        {/* Total Time Badge */}
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 p-4">
          <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-2">
            Total Time
          </p>
          {totalMs > 0 ? (
            <div>
              <p className="text-2xl font-bold text-purple-700">
                {totalMs < 1000
                  ? `${totalMs}ms`
                  : `${(totalMs / 1000).toFixed(1)}s`}
              </p>
              <p className="text-xs text-slate-500 mt-1">across all steps</p>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Running...</p>
          )}
        </div>
      </div>
    </div>
  )
}
