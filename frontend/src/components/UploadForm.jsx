import { useRef, useState } from 'react'

export default function UploadForm({ onSubmit, error }) {
  const [file, setFile] = useState(null)
  const [jobUrl, setJobUrl] = useState('')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') setFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !jobUrl.trim()) return
    setLoading(true)
    await onSubmit(file, jobUrl.trim())
    setLoading(false)
  }

  const canSubmit = file && jobUrl.trim() && !loading

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
      {/* PDF Drop Zone */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Resume (PDF)
        </label>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors
            ${dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'}
            ${file ? 'border-green-400 bg-green-50' : ''}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-green-700">{file.name}</p>
                <p className="text-xs text-green-600">{(file.size / 1024).toFixed(1)} KB — click to change</p>
              </div>
            </div>
          ) : (
            <div>
              <svg className="w-10 h-10 text-slate-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium text-slate-700">Drop your PDF here</p>
              <p className="text-xs text-slate-500 mt-1">or click to browse</p>
            </div>
          )}
        </div>
      </div>

      {/* Job URL Input */}
      <div>
        <label htmlFor="job-url" className="block text-sm font-semibold text-slate-700 mb-2">
          Job Posting URL
        </label>
        <input
          id="job-url"
          type="url"
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
          placeholder="https://jobs.company.com/software-engineer-123"
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm
          hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Starting agent...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Run Agent
          </>
        )}
      </button>

      <p className="text-xs text-center text-slate-400">
        The agent runs 7 steps: parse → research → analyze → tailor → cover letter → interview prep
      </p>
    </form>
  )
}
