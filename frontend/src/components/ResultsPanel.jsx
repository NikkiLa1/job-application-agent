import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const TABS = [
  { key: 'resume', label: 'Tailored Resume', dataKey: 'result_resume', downloadName: 'tailored_resume.txt' },
  { key: 'cover_letter', label: 'Cover Letter', dataKey: 'result_cover_letter', downloadName: 'cover_letter.txt' },
  { key: 'interview', label: 'Interview Prep', dataKey: 'result_interview_prep', downloadName: null },
]

function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[100, 85, 92, 70, 88, 75].map((w, i) => (
        <div key={i} className={`h-3 bg-slate-200 rounded`} style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

export default function ResultsPanel({ runData }) {
  const [activeTab, setActiveTab] = useState('resume')
  const status = runData?.status || 'pending'

  const activeTabConfig = TABS.find((t) => t.key === activeTab)
  const content = runData?.[activeTabConfig?.dataKey]

  const isRunning = status === 'running' || status === 'pending'
  const isError = status === 'error'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
      {/* Tab Bar */}
      <div className="flex border-b border-slate-200">
        {TABS.map((tab) => {
          const tabContent = runData?.[tab.dataKey]
          const hasContent = Boolean(tabContent)
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative
                ${activeTab === tab.key
                  ? 'text-blue-700 border-b-2 border-blue-600 -mb-px'
                  : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab.label}
              {hasContent && (
                <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-500 align-middle" />
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {isError && !content ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-slate-700 font-semibold mb-1">Agent encountered an error</p>
            <p className="text-sm text-slate-500">Check the pipeline status for details.</p>
          </div>
        ) : content ? (
          <div>
            {activeTabConfig?.downloadName && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => downloadText(content, activeTabConfig.downloadName)}
                  className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-800
                    border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            )}
            <div className="prose prose-sm prose-slate max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            {isRunning ? (
              <>
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium">Agent is working...</p>
                <p className="text-sm text-slate-400 mt-1">Results will appear here as steps complete</p>
                <div className="mt-6 w-full max-w-xs">
                  <Skeleton />
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-500">No content yet</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
