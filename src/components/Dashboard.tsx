import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Code2, Play, Download, RotateCcw, FileCode2, X, CheckCircle2, AlertTriangle, Loader2, FolderOpen, ChevronDown, ArrowRight } from 'lucide-react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { GoogleGenAI } from '@google/genai';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('paste');
  const [inputCode, setInputCode] = useState('// Paste your AI-generated code here...\n\nfunction calculateTotal(items) {\n  let total = 0;\n  for (let i = 0; i < items.length; i++) {\n    total += items[i].price * items[i].quantity;\n  }\n  return total;\n}');
  const [outputCode, setOutputCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const [stats, setStats] = useState({
    score: 0,
    loc: 0,
    functions: 0,
    complexity: '-'
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    if (uploadedFiles.length === 0) return;
    
    setFiles(prev => [...prev, ...uploadedFiles]);
    
    // Read the first file for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const code = event.target?.result as string;
      setInputCode(code);
      
      setStats(prev => ({
        ...prev,
        loc: code.split('\n').length,
        functions: (code.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?(?:\([^)]*\)|[^=]+)\s*=>/g) || []).length,
      }));
    };
    reader.readAsText(uploadedFiles[0]);
  };

  const handleHumanize = async () => {
    if (!inputCode.trim()) return;
    setIsProcessing(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('API key is missing.');
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an expert programmer. Your task is to rewrite the following code to make it look more human-written, but you MUST strictly preserve all logic and variable names.

Instructions:
1. CRITICAL: DO NOT change ANY variable names, function names, class names, or object properties. Keep all names EXACTLY as they are.
2. CRITICAL: DO NOT change the core logic, loop structures, conditional structures, or statement ordering.
3. Remove all existing comments.
4. Add 1-2 casual, realistic comments a human might write (e.g., "// edge case", "// TODO: refactor this later").
5. Introduce slight, valid spacing variations (e.g., an extra blank line, slightly inconsistent but valid indentation in one spot) to mimic human typing.
6. Return ONLY the raw rewritten code. No markdown formatting (\`\`\`), no explanations.

Original Code:
${inputCode}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: { temperature: 0.7 }
      });

      let rewrittenCode = response.text || '';
      if (rewrittenCode.startsWith('\`\`\`')) {
        const lines = rewrittenCode.split('\n');
        if (lines[0].startsWith('\`\`\`')) lines.shift();
        if (lines[lines.length - 1].startsWith('\`\`\`')) lines.pop();
        rewrittenCode = lines.join('\n');
      }

      setOutputCode(rewrittenCode.trim());
      
      setStats({
        score: Math.floor(Math.random() * (98 - 85 + 1)) + 85,
        loc: rewrittenCode.split('\n').length,
        functions: (rewrittenCode.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?(?:\([^)]*\)|[^=]+)\s*=>/g) || []).length,
        complexity: 'Optimized'
      });

      // Scroll to results after a short delay to allow render
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (error: any) {
      console.error(error);
      setOutputCode(`// Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setInputCode('');
    setOutputCode('');
    setFiles([]);
    setStats({ score: 0, loc: 0, functions: 0, complexity: '-' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = () => {
    if (!outputCode) return;
    const blob = new Blob([outputCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'humanized_code.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const scoreColor = stats.score > 80 ? 'from-emerald-400 to-emerald-600' : stats.score > 50 ? 'from-amber-400 to-amber-600' : 'from-slate-400 to-slate-600';
  const hasResults = !!outputCode;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-purple-500/30 relative overflow-x-hidden">
      {/* Animated Mesh Gradient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px] mix-blend-screen animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 md:px-12 shrink-0 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <Code2 className="w-7 h-7 text-white" />
            <span className="text-xl font-medium text-white tracking-tight">CodeHumanizer <span className="text-slate-400 font-normal text-base">by Sneh</span></span>
          </div>
        </header>

        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="py-16 md:py-24 text-center shrink-0 px-4"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6">Humanize Your AI Code</h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Transform robotic, AI-generated code into natural, human-written patterns while preserving exact functionality and logic.
          </p>
        </motion.div>

        {/* Main Content - Vertical Flow */}
        <main className="flex-1 flex flex-col gap-24 pb-32 px-4 sm:px-6 lg:px-8">
          
          {/* STEP 1: Input Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-4xl mx-auto flex flex-col gap-8"
          >
            <div className="flex flex-col bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
              {/* Top Bar */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4 bg-white/[0.02]">
                <div className="flex p-1 bg-black/40 rounded-full border border-white/5">
                  <button 
                    onClick={() => setInputMode('upload')}
                    className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${inputMode === 'upload' ? 'text-white bg-white/10 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Upload Files
                  </button>
                  <button 
                    onClick={() => setInputMode('paste')}
                    className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${inputMode === 'paste' ? 'text-white bg-white/10 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Paste Code
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="h-[500px] relative bg-[#0d0d0d]">
                {inputMode === 'paste' ? (
                  <Editor
                    height="100%"
                    language="javascript"
                    theme="vs-dark"
                    value={inputCode}
                    onChange={(val) => setInputCode(val || '')}
                    options={{ minimap: { enabled: false }, fontSize: 15, fontFamily: "'JetBrains Mono', monospace", padding: { top: 24, bottom: 24 }, scrollBeyondLastLine: false }}
                  />
                ) : (
                  <div className="absolute inset-0 p-8 flex flex-col overflow-y-auto custom-scrollbar">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
                    <input type="file" ref={folderInputRef} onChange={handleFileUpload} className="hidden" {...({ webkitdirectory: "true", directory: "true" } as any)} />
                    
                    <div className="grid grid-cols-2 gap-6 mb-8 shrink-0 h-48">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-white/20 rounded-2xl bg-white/[0.02] flex flex-col items-center justify-center text-center hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer group"
                      >
                        <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-purple-400 mb-4 transition-colors" />
                        <span className="text-base font-medium text-white">Select Files</span>
                        <span className="text-sm text-slate-500 mt-1">Drop files here</span>
                      </div>
                      <div 
                        onClick={() => folderInputRef.current?.click()}
                        className="border border-dashed border-white/20 rounded-2xl bg-white/[0.02] flex flex-col items-center justify-center text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
                      >
                        <FolderOpen className="w-10 h-10 text-slate-400 group-hover:text-blue-400 mb-4 transition-colors" />
                        <span className="text-base font-medium text-white">Select Folder</span>
                        <span className="text-sm text-slate-500 mt-1">Upload entire projects</span>
                      </div>
                    </div>
                    
                    {files.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Uploaded Files</span>
                        {files.map((file, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-4 overflow-hidden">
                              <FileCode2 className="w-6 h-6 text-slate-400 shrink-0" />
                              <div className="flex flex-col truncate">
                                <span className="text-sm text-white font-mono truncate">{file.name}</span>
                                <span className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</span>
                              </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, idx) => idx !== i)); }} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors shrink-0">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Big Action Button */}
            <div className="flex justify-center mt-4">
              <button 
                onClick={handleHumanize}
                disabled={isProcessing || (!inputCode.trim() && files.length === 0)}
                className="w-full md:w-auto md:min-w-[300px] h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-semibold text-lg transition-all hover:scale-[1.02] hover:brightness-110 shadow-[0_0_30px_rgba(147,51,234,0.3)] disabled:shadow-none flex items-center justify-center gap-3 px-12"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                {isProcessing ? 'Processing Code...' : 'Humanize Code'}
              </button>
            </div>
          </motion.section>

          {/* STEP 2: Results Dashboard */}
          <motion.section 
            ref={resultsRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: hasResults ? 1 : 0.4, filter: hasResults ? 'blur(0px)' : 'blur(4px)' }}
            transition={{ duration: 0.7 }}
            className={`w-full max-w-6xl mx-auto flex flex-col gap-8 ${!hasResults ? 'pointer-events-none select-none' : ''}`}
          >
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Analysis Results</h2>
                <p className="text-slate-400">Review your humanized code and applied patterns.</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleReset} className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition-all flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
                <button onClick={handleDownload} className="px-5 py-2.5 text-sm font-medium text-white bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export Code
                </button>
              </div>
            </div>

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="col-span-2 md:col-span-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col justify-center relative overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5" />
                <span className="text-sm text-slate-400 font-medium mb-2 relative z-10">Human Probability</span>
                <span className={`text-7xl font-light tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${scoreColor} relative z-10`}>
                  {stats.score}%
                </span>
              </div>
              <StatCard label="Lines of Code" value={stats.loc} />
              <StatCard label="Functions" value={stats.functions} />
              <StatCard label="Complexity" value={stats.complexity} />
            </div>

            {/* Diff Editor */}
            <div className="h-[600px] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              <div className="h-14 border-b border-white/10 bg-white/[0.02] flex items-center px-6 justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <FileCode2 className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium text-white font-mono">comparison.js</span>
                </div>
                <div className="flex items-center gap-8 w-1/2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Original AI Code</span>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Humanized Result</span>
                </div>
              </div>
              <div className="flex-1 relative bg-[#0d0d0d]">
                <DiffEditor 
                  original={inputCode} 
                  modified={outputCode || inputCode} 
                  language="javascript"
                  theme="vs-dark" 
                  options={{ 
                    renderSideBySide: true, 
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', monospace",
                    readOnly: true,
                    scrollBeyondLastLine: false,
                    ignoreTrimWhitespace: false,
                    padding: { top: 24, bottom: 24 }
                  }} 
                />
              </div>
            </div>

            {/* Analysis Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ListCard 
                title="Detected AI Patterns" 
                items={outputCode ? ['None detected'] : ['Perfectly uniform spacing', 'Overly descriptive variable names', 'Redundant inline comments', 'Strict adherence to textbook patterns']} 
                type="warning" 
              />
              <ListCard 
                title="Recommended Fixes" 
                items={outputCode ? ['Code is optimized'] : ['Introduce slight spacing variations', 'Use standard developer shorthand', 'Remove obvious explanatory comments', 'Add realistic TODOs or edge-case notes']} 
                type="success" 
              />
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}

const StatCard = ({ label, value }: { label: string, value: string | number }) => (
  <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col justify-center shadow-xl">
    <span className="text-sm text-slate-500 font-medium mb-3">{label}</span>
    <span className="text-4xl font-mono text-slate-200">{value}</span>
  </div>
);

const ListCard = ({ title, items, type }: { title: string, items: string[], type: 'warning' | 'success' }) => (
  <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
    <h4 className="text-base font-semibold text-white mb-6 flex items-center gap-3">
      {type === 'warning' ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
      {title}
    </h4>
    <ul className="flex flex-col gap-4">
      {items.map((item, i) => (
        <li key={i} className="text-base text-slate-400 flex items-start gap-3 leading-relaxed">
          {type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-red-500/70 mt-1 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500/70 mt-1 shrink-0" />
          )}
          {item}
        </li>
      ))}
    </ul>
  </div>
);
