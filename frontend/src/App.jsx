import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle, AlertCircle, BarChart2, Loader2, Search, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logoBase64 } from './logoData';

// Configure Axios base URL
const API_URL = '/api';

function App() {
  const [apiKey, setApiKey] = useState('AIzaSyB1YZym4QU0A3kMIb_SNXIoYI_WFfo2hos');
  const [modelName, setModelName] = useState('models/gemma-3-27b-it');
  const [jdText, setJdText] = useState('');
  const [jdSkills, setJdSkills] = useState(null);

  // Separate loading states
  const [analyzingJD, setAnalyzingJD] = useState(false);
  const [screeningResumes, setScreeningResumes] = useState(false);

  const [error, setError] = useState(null);
  const [resumeFiles, setResumeFiles] = useState([]);
  const [screeningResults, setScreeningResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleParseJD = async () => {
    // API Key is now hardcoded
    // if (!apiKey) {
    //   setError("Please enter your Gemini API Key.");
    //   return;
    // }
    setAnalyzingJD(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/parse-jd`, {
        jd_text: jdText,
        api_key: apiKey.trim(),
        model_name: modelName
      });
      setJdSkills(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || "Failed to parse JD";
      if (errorMessage.includes("429") || errorMessage.includes("quota")) {
        setError("⚠️ Quota exceeded for this model. Please select a different Gemini model (e.g., gemini-1.5-flash) from the dropdown.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setAnalyzingJD(false);
    }
  };

  const handleScreenResumes = async () => {
    if (!resumeFiles.length) return;

    if (!jdSkills) {
      setError("⚠️ Please paste and analyze a Job Description first!");
      return;
    }

    setScreeningResumes(true);
    setScreeningResults(null);

    const formData = new FormData();
    // Append files
    for (let i = 0; i < resumeFiles.length; i++) {
      formData.append('files', resumeFiles[i]);
    }
    // Append other fields
    formData.append('jd_skills_json', JSON.stringify(jdSkills));
    formData.append('api_key', apiKey.trim());
    formData.append('model_name', modelName);

    try {
      const response = await axios.post(`${API_URL}/screen-resumes`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setScreeningResults(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to screen resumes");
    } finally {
      setScreeningResumes(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20 border border-slate-700 bg-slate-900 flex items-center justify-center">
              <img src={logoBase64} alt="SkillRank AI Logo" className="w-full h-full object-cover p-2" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                SKILLRANK AI
              </h1>
              <p className="text-slate-400 text-sm">Intelligent Resume Screening & Ranking</p>
            </div>
          </div>
          {/* <div className="flex gap-4">
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1 ml-1">Gemini Model</label>
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-48 text-slate-300 appearance-none cursor-pointer"
              >
                <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp</option>
                <option value="models/gemma-3-27b-it">gemma-3-27b-it</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1 ml-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-64"
                placeholder="Enter Gemini API Key"
              />
            </div>
          </div> */}
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Input */}
          <div className="lg:col-span-5 space-y-6">

            {/* JD Input Section */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">Job Description</h2>
              </div>
              <textarea
                className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none scrollbar-thin scrollbar-thumb-slate-700 font-mono leading-relaxed"
                placeholder="Paste the Job Description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleParseJD}
                  disabled={analyzingJD || !jdText}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/20 active:scale-95"
                >
                  {analyzingJD ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Analyze JD
                </button>
              </div>
            </section>


            {/* Manual Skills Input */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">Add Missing Skills</h2>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Docker"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.target.value.trim();
                      if (val && jdSkills) {
                        setJdSkills(prev => ({
                          ...prev,
                          [val]: { priority: 'Must-Have', weight: 3 }
                        }));
                        e.target.value = '';
                      }
                    }
                  }}
                />
                <button
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  onClick={(e) => {
                    const input = e.target.previousSibling;
                    const val = input.value.trim();
                    if (val) {
                      // Initialize jdSkills if null
                      const currentSkills = jdSkills || {};
                      setJdSkills({
                        ...currentSkills,
                        [val]: { priority: 'Must-Have', weight: 3 } // Default to Must-Have
                      });
                      input.value = '';
                    }
                  }}
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Added skills default to "Must-Have". You can add more specific missing skills here.</p>
            </section>

            {/* Parsed Skills Preview (Mini) */}
            <AnimatePresence>
              {jdSkills && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6"
                >
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Target Skills Extracted</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(jdSkills).map(([skill, data], idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${data.priority === 'Must-Have'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          }`}
                      >
                        {skill} {data.priority === 'Must-Have' && '★'}
                      </span>
                    ))}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Execution & Results */}
          <div className="lg:col-span-7 space-y-6">

            {/* Resume Upload - Simplified Version */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-semibold text-white">Upload Resumes</h2>
                </div>
                <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">PDF or TXT</span>
              </div>

              {/* Hidden File Input */}
              {/* Simplified Native Upload for Reliability */}
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <label className="block mb-2 text-sm font-medium text-slate-300">
                  Select Resume Files (PDF/TXT)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.txt"
                  className="block w-full text-sm text-slate-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-600 file:text-white
                    file:cursor-pointer hover:file:bg-indigo-700
                  "
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      setResumeFiles(prev => [...prev, ...Array.from(e.target.files)]);
                    }
                  }}
                />
                <p className="mt-2 text-xs text-slate-500">
                  This uses the standard browser file picker, similar to the original app.
                </p>
              </div>

              {/* File Queue Indicator */}
              <div className="flex flex-col items-center gap-3 mb-6 mt-4">
                <p className="font-medium text-slate-300">
                  {resumeFiles.length > 0 ? `${resumeFiles.length} files queued` : "No files selected yet"}
                </p>
                {resumeFiles.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setResumeFiles([]);
                      setScreeningResults(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-all text-sm font-medium"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Clear All Files
                  </button>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleScreenResumes}
                  disabled={screeningResumes || resumeFiles.length === 0}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {screeningResumes ? <Loader2 className="w-5 h-5 animate-spin" /> : "Run AI Screening"}
                </button>
              </div>
            </section>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Results Table */}
            <AnimatePresence>
              {screeningResults && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
                >
                  <div className="p-4 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="font-semibold text-white">Candidates Ranked by Fit</h3>
                    <span className="text-xs text-slate-400">Top 5 Highlighted</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-xs font-semibold">
                        <tr>
                          <th className="px-6 py-4">Rank</th>
                          <th className="px-6 py-4">Candidate</th>
                          <th className="px-6 py-4 text-center">Match Score</th>
                          <th className="px-6 py-4">Key Skills Found</th>
                          <th className="px-6 py-4 text-red-400">Missing</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {screeningResults.map((result, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-800/30 transition-colors ${idx < 5 ? 'bg-indigo-500/5' : ''}`}
                          >
                            <td className="px-6 py-4 font-mono text-slate-500">#{idx + 1}</td>
                            <td className="px-6 py-4 font-medium text-white">{result.filename}</td>
                            <td className="px-6 py-4 text-center">
                              <div className="inline-flex items-center justify-center w-12 h-8 bg-slate-800 rounded border border-slate-700 font-bold text-indigo-400">
                                {result.score}
                              </div>
                            </td>
                            <td className="px-6 py-4 max-w-xs truncate text-slate-300">
                              {Object.entries(result.resume_skills).map(([k, v]) => `${k} (${v}y)`).join(', ')}
                            </td>
                            <td className="px-6 py-4 max-w-xs truncate text-red-400/80">
                              {result.missing_skills?.join(', ') || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
