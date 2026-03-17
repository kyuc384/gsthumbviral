
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AppStatus, SuggestionResponse, ThumbnailConfig } from './types';
import { DEFAULT_CONFIG } from './constants';
import { analyzeScript, generateThumbnailImage, editImageToRemoveText } from './services/geminiService';
import { EditorControls } from './components/EditorControls';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [script, setScript] = useState('');
  const [language, setLanguage] = useState('Vietnamese');
  const [suggestions, setSuggestions] = useState<SuggestionResponse | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // History State
  const [history, setHistory] = useState<{
    past: ThumbnailConfig[];
    present: ThumbnailConfig;
    future: ThumbnailConfig[];
  }>({
    past: [],
    present: DEFAULT_CONFIG,
    future: []
  });

  const config = history.present;
  
  const [error, setError] = useState<string | null>(null);
  const [draggingLine, setDraggingLine] = useState<'line1' | 'line2' | 'line3' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [copyTitleStatus, setCopyTitleStatus] = useState<number | null>(null);
  const [copyPromptStatus, setCopyPromptStatus] = useState<number | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lineRefs = {
    line1: useRef<HTMLDivElement>(null),
    line2: useRef<HTMLDivElement>(null),
    line3: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err.message));
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        setPreviewScale(containerRef.current.offsetWidth / 1280);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      return { past: newPast, present: previous, future: [prev.present, ...prev.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      return { past: [...prev.past, prev.present], present: next, future: newFuture };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) redo(); else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        redo();
      } else if (e.key === 'F11') {
        e.preventDefault(); toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const updateConfig = useCallback((updates: Partial<ThumbnailConfig>, skipHistory = false) => {
    setHistory(prev => {
      const nextPresent = { ...prev.present, ...updates };
      if (skipHistory) return { ...prev, present: nextPresent };
      if (JSON.stringify(prev.present) === JSON.stringify(nextPresent)) return prev;
      return { past: [...prev.past, prev.present].slice(-50), present: nextPresent, future: [] };
    });
  }, []);

  const handleAnalyze = async () => {
    if (!script.trim()) return;
    setStatus(AppStatus.ANALYZING);
    setError(null);
    try {
      const result = await analyzeScript(script, language);
      setSuggestions(result);
      setStatus(AppStatus.READY);
    } catch (err) {
      setError(language === 'Vietnamese' ? 'Phân tích kịch bản thất bại.' : 'Failed to analyze script.');
      setStatus(AppStatus.IDLE);
    }
  };

  const handleGenerateImage = async (prompt: string) => {
    setStatus(AppStatus.GENERATING_IMAGE);
    setError(null);
    try {
      const url = await generateThumbnailImage(prompt);
      updateConfig({ imageUrl: url });
      setStatus(AppStatus.READY);
    } catch (err) {
      setError(language === 'Vietnamese' ? 'Vẽ ảnh thất bại.' : 'Failed to generate image.');
      setStatus(AppStatus.READY);
    }
  };

  const handleRemoveText = async () => {
    if (!config.imageUrl) return;
    setStatus(AppStatus.EDITING_IMAGE);
    setError(null);
    try {
      const url = await editImageToRemoveText(config.imageUrl);
      updateConfig({ imageUrl: url });
      setStatus(AppStatus.READY);
    } catch (err) {
      setError(language === 'Vietnamese' ? 'Xoá chữ thất bại.' : 'Failed to remove text.');
      setStatus(AppStatus.READY);
    }
  };

  const handleCopyText = (text: string, index: number, type: 'title' | 'prompt') => {
    navigator.clipboard.writeText(text);
    if (type === 'title') {
      setCopyTitleStatus(index);
      setTimeout(() => setCopyTitleStatus(null), 2000);
    } else {
      setCopyPromptStatus(index);
      setTimeout(() => setCopyPromptStatus(null), 2000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateConfig({ imageUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const applyTitleSuggestion = (title: string) => {
    updateConfig({ 
      line1Text: title.toUpperCase(), 
      showLine2: false, 
      showLine3: false 
    });
  };

  const handleMouseDown = (e: React.MouseEvent, line: 'line1' | 'line2' | 'line3') => {
    const ref = lineRefs[line].current;
    if (!ref || !containerRef.current) return;
    setDraggingLine(line);
    const rect = ref.getBoundingClientRect();
    setDragOffset({ x: e.clientX - (rect.left + rect.width / 2), y: e.clientY - (rect.top + rect.height / 2) });
    e.stopPropagation();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingLine || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - dragOffset.x - rect.left) / rect.width) * 100;
    const y = ((e.clientY - dragOffset.y - rect.top) / rect.height) * 100;
    const posKey = `${draggingLine}Position` as keyof ThumbnailConfig;
    updateConfig({ [posKey]: { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } }, true);
  }, [draggingLine, dragOffset, updateConfig]);

  const handleMouseUp = useCallback(() => {
    if (draggingLine) { setDraggingLine(null); updateConfig({}); }
  }, [draggingLine, updateConfig]);

  useEffect(() => {
    if (draggingLine) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [draggingLine, handleMouseMove, handleMouseUp]);

  const downloadThumbnail = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 1280; canvas.height = 720;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        ctx.clearRect(0, 0, 1280, 720);
        ctx.drawImage(img, 0, 0, 1280, 720);
        ctx.fillStyle = `rgba(0, 0, 0, ${config.overlayOpacity / 100})`;
        ctx.fillRect(0, 0, 1280, 720);
        ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
        
        const drawLine = (prefix: 'line1' | 'line2' | 'line3') => {
            const text = config[`${prefix}Text` as keyof ThumbnailConfig] as string;
            const pos = config[`${prefix}Position` as keyof ThumbnailConfig] as {x: number, y: number};
            const rotation = config[`${prefix}Rotation` as keyof ThumbnailConfig] as number;
            const fontSize = config[`${prefix}FontSize` as keyof ThumbnailConfig] as number;
            const color = config[`${prefix}Color` as keyof ThumbnailConfig] as string;
            const color2 = config[`${prefix}Color2` as keyof ThumbnailConfig] as string;
            const isGrad = config[`${prefix}IsGradient` as keyof ThumbnailConfig] as boolean;
            const bold = config[`${prefix}Bold` as keyof ThumbnailConfig] as boolean;
            const italic = config[`${prefix}Italic` as keyof ThumbnailConfig] as boolean;
            const align = config[`${prefix}Align` as keyof ThumbnailConfig] as CanvasTextAlign;
            const strokeW = config[`${prefix}StrokeWidth` as keyof ThumbnailConfig] as number;
            const strokeC = config[`${prefix}StrokeColor` as keyof ThumbnailConfig] as string;
            const showBg = config[`${prefix}ShowBg` as keyof ThumbnailConfig] as boolean;
            const bgColor = config[`${prefix}BgColor` as keyof ThumbnailConfig] as string;
            const bgPadX = config[`${prefix}BgPaddingX` as keyof ThumbnailConfig] as number;
            const bgPadY = config[`${prefix}BgPaddingY` as keyof ThumbnailConfig] as number;
            const showShadow = config[`${prefix}ShowShadow` as keyof ThumbnailConfig] as boolean;
            const sBlur = config[`${prefix}ShadowBlur` as keyof ThumbnailConfig] as number;
            const sOffset = config[`${prefix}ShadowOffset` as keyof ThumbnailConfig] as number;
            const sColor = config[`${prefix}ShadowColor` as keyof ThumbnailConfig] as string;

            const tx = (pos.x / 100) * 1280;
            const ty = (pos.y / 100) * 720;

            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.font = `${italic ? 'italic' : ''} ${bold ? 'bold' : ''} ${fontSize}px ${config.fontFamily}`;
            ctx.textAlign = align;
            const textWidth = ctx.measureText(text.toUpperCase()).width;
            
            if (showBg) {
               ctx.fillStyle = bgColor;
               let rx = 0;
               if (align === 'center') rx = -textWidth / 2; else if (align === 'right') rx = -textWidth;
               ctx.fillRect(rx - bgPadX, -fontSize/2 - bgPadY, textWidth + bgPadX * 2, fontSize + bgPadY * 2);
            }
            if (showShadow) { ctx.shadowColor = sColor; ctx.shadowBlur = sBlur; ctx.shadowOffsetX = sOffset; ctx.shadowOffsetY = sOffset; }
            if (isGrad) { const grad = ctx.createLinearGradient(0, -fontSize/2, 0, fontSize/2); grad.addColorStop(0, color); grad.addColorStop(1, color2); ctx.fillStyle = grad; } else { ctx.fillStyle = color; }
            if (strokeW > 0) { ctx.lineWidth = strokeW * 2; ctx.strokeStyle = strokeC; ctx.strokeText(text.toUpperCase(), 0, 0); }
            ctx.fillText(text.toUpperCase(), 0, 0);
            ctx.restore();
        };
        drawLine('line1');
        if (config.showLine2) drawLine('line2');
        if (config.showLine3) drawLine('line3');

        config.graphics.forEach(g => {
            ctx.save();
            const gx = (g.x / 100) * 1280;
            const gy = (g.y / 100) * 720;
            ctx.translate(gx, gy);
            ctx.rotate((g.rotation * Math.PI) / 180);
            ctx.fillStyle = g.color;
            const p = new Path2D(g.path);
            ctx.translate(-g.size / 2, -g.size / 2);
            const scale = g.size / 24;
            ctx.scale(scale, scale);
            ctx.fill(p);
            ctx.restore();
        });

        const link = document.createElement('a'); link.download = `thumb-${Date.now()}.png`; link.href = canvas.toDataURL('image/png'); link.click();
    };
    img.src = config.imageUrl || 'https://picsum.photos/1280/720?grayscale';
  };

  const getTextStyle = (line: 'line1' | 'line2' | 'line3') => {
    const c = config;
    const prefix = line;
    const txtColor = c[`${prefix}Color` as keyof ThumbnailConfig] as string;
    const txtColor2 = c[`${prefix}Color2` as keyof ThumbnailConfig] as string;
    const isGrad = c[`${prefix}IsGradient` as keyof ThumbnailConfig] as boolean;
    const sShow = c[`${prefix}ShowShadow` as keyof ThumbnailConfig] as boolean;
    const sColor = c[`${prefix}ShadowColor` as keyof ThumbnailConfig] as string;
    const sBlur = c[`${prefix}ShadowBlur` as keyof ThumbnailConfig] as number;
    const sOffset = c[`${prefix}ShadowOffset` as keyof ThumbnailConfig] as number;
    const strokeW = c[`${prefix}StrokeWidth` as keyof ThumbnailConfig] as number;
    const strokeC = c[`${prefix}StrokeColor` as keyof ThumbnailConfig] as string;
    const align = c[`${prefix}Align` as keyof ThumbnailConfig] as string;
    const fSize = c[`${prefix}FontSize` as keyof ThumbnailConfig] as number;
    const bold = c[`${prefix}Bold` as keyof ThumbnailConfig] as boolean;
    const italic = c[`${prefix}Italic` as keyof ThumbnailConfig] as boolean;
    const underline = c[`${prefix}Underline` as keyof ThumbnailConfig] as boolean;
    const showBg = c[`${prefix}ShowBg` as keyof ThumbnailConfig] as boolean;
    const bgColor = c[`${prefix}BgColor` as keyof ThumbnailConfig] as string;
    const bgPadX = c[`${prefix}BgPaddingX` as keyof ThumbnailConfig] as number;
    const bgPadY = c[`${prefix}BgPaddingY` as keyof ThumbnailConfig] as number;
    const pos = c[`${prefix}Position` as keyof ThumbnailConfig] as {x: number, y: number};
    const rotation = c[`${prefix}Rotation` as keyof ThumbnailConfig] as number;

    return {
      position: 'absolute' as const,
      left: `${pos.x}%`, top: `${pos.y}%`,
      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      fontFamily: c.fontFamily,
      fontSize: `${fSize * previewScale}px`,
      WebkitTextStroke: `${strokeW * previewScale}px ${strokeC}`,
      textAlign: align as 'left' | 'center' | 'right', fontWeight: bold ? 'bold' : 'normal', fontStyle: italic ? 'italic' : 'normal',
      textDecoration: underline ? 'underline' : 'none', whiteSpace: 'nowrap' as const, lineHeight: '1.2', cursor: 'grab',
      zIndex: draggingLine === line ? 100 : 10,
      ...(showBg ? { backgroundColor: bgColor, padding: `${bgPadY * previewScale}px ${bgPadX * previewScale}px` } : {}),
      ...(isGrad ? { backgroundImage: `linear-gradient(to bottom, ${txtColor}, ${txtColor2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: txtColor }),
      ...(sShow ? { filter: `drop-shadow(${sOffset * previewScale}px ${sOffset * previewScale}px ${sBlur * previewScale}px ${sColor})` } : {})
    };
  };

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden bg-slate-950 text-slate-100">
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
          <span className="font-black tracking-tighter text-2xl bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">G-Thumbnail Studio</span>
        </div>
        <div className="flex items-center gap-5">
          <button onClick={toggleFullscreen} className="p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-all">{isFullscreen ? 'Esc' : 'Full'}</button>
          <div className="flex items-center gap-1.5 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
            <button onClick={undo} disabled={history.past.length === 0} className="p-1.5 rounded-md text-slate-200 disabled:text-slate-600">Undo</button>
            <button onClick={redo} disabled={history.future.length === 0} className="p-1.5 rounded-md text-slate-200 disabled:text-slate-600">Redo</button>
          </div>
          <button onClick={() => updateConfig(DEFAULT_CONFIG)} className="text-sm font-bold text-slate-400">RESET</button>
          <button onClick={downloadThumbnail} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black rounded-full shadow-lg">XUẤT ẢNH</button>
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        <aside className="w-[330px] border-r border-slate-800 bg-slate-900/40 flex flex-col overflow-hidden"><div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5"><EditorControls config={config} onChange={updateConfig} /></div></aside>
        <section className="flex-1 bg-slate-950 flex flex-col items-center p-8 relative overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-[1100px] space-y-10 z-10">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-7 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {language === 'Vietnamese' ? 'Phân tích & Ý tưởng' : 'Analysis & Concepts'}
                  </h3>
                  <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800">
                    <button 
                      onClick={() => setLanguage('Vietnamese')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${language === 'Vietnamese' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      TIẾNG VIỆT
                    </button>
                    <button 
                      onClick={() => setLanguage('English')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${language === 'English' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      ENGLISH
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <textarea 
                    placeholder={language === 'Vietnamese' ? "Nhập kịch bản hoặc mô tả video..." : "Enter your video script or description..."} 
                    className="w-full h-28 bg-slate-950/50 border border-slate-800 rounded-2xl p-5 text-base outline-none mb-4 focus:border-indigo-500/50 transition-colors pr-16" 
                    value={script} 
                    onChange={(e) => setScript(e.target.value)} 
                  />
                  {script && (
                    <button 
                      onClick={() => setScript('')}
                      className="absolute top-4 right-4 text-[10px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest transition-colors"
                    >
                      {language === 'Vietnamese' ? 'XOÁ' : 'CLEAR'}
                    </button>
                  )}
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={handleAnalyze} 
                    disabled={status === AppStatus.ANALYZING || !script} 
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
                  >
                    {status === AppStatus.ANALYZING 
                      ? (language === 'Vietnamese' ? 'ĐANG PHÂN TÍCH...' : 'ANALYZING...') 
                      : (language === 'Vietnamese' ? 'GỢI Ý Ý TƯỞNG AI' : 'AI IDEA SUGGESTIONS')}
                  </button>
                  <div className="flex-1 flex gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold transition-all active:scale-[0.98]">
                      {language === 'Vietnamese' ? 'TẢI ẢNH LÊN' : 'UPLOAD IMAGE'}
                    </button>
                    {config.imageUrl && (
                      <>
                        <button 
                          onClick={handleRemoveText}
                          disabled={status === AppStatus.EDITING_IMAGE}
                          className="px-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/20 transition-all flex items-center justify-center gap-2 font-bold text-xs"
                          title={language === 'Vietnamese' ? 'Xoá chữ trong ảnh' : 'Remove text from image'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          <span className="hidden sm:inline">{language === 'Vietnamese' ? 'XOÁ CHỮ' : 'REMOVE TEXT'}</span>
                        </button>
                        <button 
                          onClick={() => updateConfig({ imageUrl: null })}
                          className="px-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-2xl border border-red-500/20 transition-all flex items-center justify-center"
                          title={language === 'Vietnamese' ? 'Xoá ảnh' : 'Remove background'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                </div>
            </div>
            <div ref={containerRef} className="canvas-container w-full select-none border border-slate-800/60 overflow-hidden shadow-indigo-500/5" style={{ backgroundImage: config.imageUrl ? `url(${config.imageUrl})` : 'none' }}>
              {!config.imageUrl && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-700 opacity-50 uppercase font-black tracking-widest text-sm">
                  {language === 'Vietnamese' ? 'Chưa có background' : 'No background set'}
                </div>
              )}
              <div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: config.overlayOpacity / 100 }} />
              <div ref={lineRefs.line1} onMouseDown={(e) => handleMouseDown(e, 'line1')} style={getTextStyle('line1')}>{config.line1Text}</div>
              {config.showLine2 && <div ref={lineRefs.line2} onMouseDown={(e) => handleMouseDown(e, 'line2')} style={getTextStyle('line2')}>{config.line2Text}</div>}
              {config.showLine3 && <div ref={lineRefs.line3} onMouseDown={(e) => handleMouseDown(e, 'line3')} style={getTextStyle('line3')}>{config.line3Text}</div>}
              {config.graphics.map((g) => (
                <div 
                  key={g.id}
                  style={{
                    position: 'absolute',
                    left: `${g.x}%`,
                    top: `${g.y}%`,
                    width: `${g.size * previewScale}px`,
                    height: `${g.size * previewScale}px`,
                    transform: `translate(-50%, -50%) rotate(${g.rotation}deg)`,
                    color: g.color,
                    zIndex: 5
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
                    <path d={g.path} />
                  </svg>
                </div>
              ))}
              {status === AppStatus.GENERATING_IMAGE && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-[60]">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <div className="text-white font-black uppercase tracking-widest text-xs animate-pulse">
                    {language === 'Vietnamese' ? 'AI ĐANG VẼ ẢNH...' : 'AI IS GENERATING IMAGE...'}
                  </div>
                </div>
              )}
              {status === AppStatus.EDITING_IMAGE && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-[60]">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <div className="text-white font-black uppercase tracking-widest text-xs animate-pulse">
                    {language === 'Vietnamese' ? 'AI ĐANG XOÁ CHỮ...' : 'AI IS REMOVING TEXT...'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
        <aside className="w-[330px] border-l border-slate-800 bg-slate-900/60 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-900/40">
            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest">
              {language === 'Vietnamese' ? 'Gợi ý từ AI' : 'AI Suggestions'}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {suggestions && <div className="space-y-10">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {language === 'Vietnamese' ? 'Tiêu đề đề xuất' : 'Suggested Titles'}
                </p>
                {suggestions.titles.map((title, i) => (
                  <div key={i} className="flex gap-2 group relative">
                    <button 
                      onClick={() => applyTitleSuggestion(title)} 
                      className="flex-1 text-left p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-[12px] font-black uppercase leading-tight"
                    >
                      {title}
                    </button>
                    <button 
                      onClick={() => handleCopyText(title, i, 'title')}
                      className={`shrink-0 w-12 flex items-center justify-center rounded-xl border transition-all ${copyTitleStatus === i ? 'bg-green-600/20 border-green-500 text-green-400' : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:text-white hover:border-indigo-500'}`}
                      title="Copy title"
                    >
                      {copyTitleStatus === i ? (
                        <span className="text-[8px] font-black">OK!</span>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {language === 'Vietnamese' ? 'Phông nền AI' : 'AI Backgrounds'}
                </p>
                {suggestions.imagePrompts.map((p, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 mb-5 group">
                    <p className="text-[11px] text-slate-400 mb-4 italic leading-relaxed">{p}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleGenerateImage(p)} 
                        disabled={status === AppStatus.GENERATING_IMAGE} 
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-[10px] font-black transition-all active:scale-[0.97]"
                      >
                        {language === 'Vietnamese' ? 'VẼ BACKGROUND' : 'GENERATE BACKGROUND'}
                      </button>
                      <button 
                        onClick={() => handleCopyText(p, i, 'prompt')}
                        className={`px-3 py-2.5 rounded-lg border font-black text-[10px] transition-all ${copyPromptStatus === i ? 'bg-green-600/20 border-green-500 text-green-400' : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-white'}`}
                      >
                        {copyPromptStatus === i ? 'OK!' : 'COPY'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>}
            {!suggestions && status === AppStatus.IDLE && (
              <div className="h-full flex items-center justify-center text-center opacity-30 px-6">
                <p className="text-[11px] font-bold uppercase tracking-widest">
                  {language === 'Vietnamese' ? 'Nhập kịch bản để nhận gợi ý' : 'Enter script to get suggestions'}
                </p>
              </div>
            )}
          </div>
        </aside>
      </main>
      {error && (
        <div className="fixed bottom-7 right-7 bg-red-600 text-white px-7 py-5 rounded-2xl shadow-2xl z-[100] font-black text-sm border border-red-400/50 animate-bounce">
          {error}
        </div>
      )}
    </div>
  );
};

export default App;
