
import React from 'react';
import { ThumbnailConfig } from '../types';
import { FONT_FAMILIES, COLOR_PALETTES, ICON_PRESETS } from '../constants';

interface EditorControlsProps {
  config: ThumbnailConfig;
  onChange: (updates: Partial<ThumbnailConfig>) => void;
}

export const EditorControls: React.FC<EditorControlsProps> = ({ config, onChange }) => {
  const SectionHeader = ({ title }: { title: string }) => (
    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">{title}</h4>
  );

  const ValueDisplay = ({ value, unit = '' }: { value: number | string, unit?: string }) => (
    <span className="text-[17px] text-indigo-400 font-mono font-bold leading-none">
      {value}{unit}
    </span>
  );

  const AlignmentControl = ({ value, onSelect }: { value: string, onSelect: (val: 'left' | 'center' | 'right') => void }) => (
    <div className="flex bg-slate-900 p-1 rounded-lg gap-1 border border-slate-700">
      {(['left', 'center', 'right'] as const).map((align) => (
        <button
          key={align}
          onClick={() => onSelect(align)}
          className={`flex-1 flex items-center justify-center p-1 rounded transition-all ${value === align ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {align === 'left' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h16" /></svg>}
          {align === 'center' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M7 12h10M4 18h16" /></svg>}
          {align === 'right' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M10 12h10M4 18h16" /></svg>}
        </button>
      ))}
    </div>
  );

  const FontStyleControl = ({ bold, italic, underline, onBold, onItalic, onUnderline }: { bold: boolean, italic: boolean, underline: boolean, onBold: () => void, onItalic: () => void, onUnderline: () => void }) => (
    <div className="flex bg-slate-900 p-1 rounded-lg gap-1 border border-slate-700">
      <button
        onClick={onBold}
        className={`flex-1 flex items-center justify-center p-1 rounded transition-all font-black text-base ${bold ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
      >
        B
      </button>
      <button
        onClick={onItalic}
        className={`flex-1 flex items-center justify-center p-1 rounded transition-all font-serif italic text-base ${italic ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
      >
        I
      </button>
      <button
        onClick={onUnderline}
        className={`flex-1 flex items-center justify-center p-1 rounded transition-all underline font-bold text-base ${underline ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
      >
        U
      </button>
    </div>
  );

  const ColorSelector = ({ selected, onSelect, label }: { selected: string, onSelect: (color: string) => void, label: string }) => (
    <div className="space-y-2">
      <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {COLOR_PALETTES.map((p) => (
          <button
            key={p.name}
            onClick={() => onSelect(p.color)}
            className={`w-5 h-5 rounded-sm border transition-all ${selected.toLowerCase() === p.color.toLowerCase() ? 'ring-1 ring-indigo-500 ring-offset-1 ring-offset-slate-900 border-white' : 'border-slate-800 hover:border-slate-600'}`}
            style={{ backgroundColor: p.color }}
            title={p.name}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-7 h-7 shrink-0">
          <input 
            type="color" 
            value={selected.startsWith('#') && selected.length === 7 ? selected : '#ffffff'}
            onChange={(e) => onSelect(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div 
            className="w-full h-full rounded border border-slate-700 shadow-inner"
            style={{ backgroundColor: selected }}
          />
        </div>
        <div className="flex-1">
          <input 
            type="text" 
            value={selected}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono font-bold text-indigo-400 outline-none focus:border-indigo-500 transition-all uppercase"
            placeholder="#HEX"
          />
        </div>
      </div>
    </div>
  );

  const Slider = ({ label, value, min, max, step = 1, onChange, unit = '', showInput = false }: { label: string, value: number, min: number, max: number, step?: number, onChange: (val: number) => void, unit?: string, showInput?: boolean }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</label>
        {showInput ? (
          <div className="flex items-center gap-1">
            <input 
              type="number"
              value={value}
              min={min}
              max={max}
              step={step}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) onChange(val);
              }}
              className="w-14 bg-slate-900 border border-slate-700 rounded text-center text-[14px] font-mono font-bold text-indigo-400 outline-none focus:border-indigo-500 p-0.5"
            />
            <span className="text-[11px] text-slate-500 font-bold">{unit}</span>
          </div>
        ) : (
          <ValueDisplay value={value} unit={unit} />
        )}
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-slate-800 rounded appearance-none accent-indigo-500 cursor-pointer"
      />
    </div>
  );

  const renderLineControls = (prefix: 'line1' | 'line2' | 'line3', label: string) => {
    const textKey = `${prefix}Text` as keyof ThumbnailConfig;
    const alignKey = `${prefix}Align` as keyof ThumbnailConfig;
    const boldKey = `${prefix}Bold` as keyof ThumbnailConfig;
    const italicKey = `${prefix}Italic` as keyof ThumbnailConfig;
    const underlineKey = `${prefix}Underline` as keyof ThumbnailConfig;
    const gradKey = `${prefix}IsGradient` as keyof ThumbnailConfig;
    const colorKey = `${prefix}Color` as keyof ThumbnailConfig;
    const color2Key = `${prefix}Color2` as keyof ThumbnailConfig;
    const strokeCKey = `${prefix}StrokeColor` as keyof ThumbnailConfig;
    const sizeKey = `${prefix}FontSize` as keyof ThumbnailConfig;
    const strokeWKey = `${prefix}StrokeWidth` as keyof ThumbnailConfig;
    const showBgKey = `${prefix}ShowBg` as keyof ThumbnailConfig;
    const bgColorKey = `${prefix}BgColor` as keyof ThumbnailConfig;
    const bgPadXKey = `${prefix}BgPaddingX` as keyof ThumbnailConfig;
    const bgPadYKey = `${prefix}BgPaddingY` as keyof ThumbnailConfig;
    const showShadowKey = `${prefix}ShowShadow` as keyof ThumbnailConfig;
    const shadowBlurKey = `${prefix}ShadowBlur` as keyof ThumbnailConfig;
    const shadowOffsetKey = `${prefix}ShadowOffset` as keyof ThumbnailConfig;
    const shadowColorKey = `${prefix}ShadowColor` as keyof ThumbnailConfig;
    const posKey = `${prefix}Position` as keyof ThumbnailConfig;
    const rotKey = `${prefix}Rotation` as keyof ThumbnailConfig;

    const currentPos = config[posKey] as { x: number, y: number };

    return (
      <div className="space-y-4">
        <input
          type="text"
          value={config[textKey] as string}
          onChange={(e) => onChange({ [textKey]: e.target.value })}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-bold uppercase text-sm mb-4 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
          placeholder={`${label}...`}
        />
        
        <div className="flex flex-col gap-4">
          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/60 space-y-3">
            <SectionHeader title="Position & Rotation" />
            <div className="grid grid-cols-2 gap-4">
              <Slider label="X Position" value={currentPos.x} min={0} max={100} step={0.1} onChange={(v) => onChange({ [posKey]: { ...currentPos, x: v } })} unit="%" showInput={true} />
              <Slider label="Y Position" value={currentPos.y} min={0} max={100} step={0.1} onChange={(v) => onChange({ [posKey]: { ...currentPos, y: v } })} unit="%" showInput={true} />
            </div>
            <Slider 
              label="Rotation (360°)" 
              value={config[rotKey] as number} 
              min={-180} 
              max={180} 
              onChange={(v) => onChange({ [rotKey]: v })} 
              unit="°" 
              showInput={true}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block tracking-wider">Align</label>
              <AlignmentControl value={config[alignKey] as string} onSelect={(val) => onChange({ [alignKey]: val })} />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block tracking-wider">Style</label>
              <FontStyleControl 
                bold={config[boldKey] as boolean}
                italic={config[italicKey] as boolean} 
                underline={config[underlineKey] as boolean} 
                onBold={() => onChange({ [boldKey]: !config[boldKey] })}
                onItalic={() => onChange({ [italicKey]: !config[italicKey] })}
                onUnderline={() => onChange({ [underlineKey]: !config[underlineKey] })}
              />
            </div>
          </div>
          
          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Color Gradient</label>
              <button 
                onClick={() => onChange({ [gradKey]: !config[gradKey] })}
                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all ${config[gradKey] ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}
              >
                {config[gradKey] ? 'On' : 'Off'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ColorSelector 
                label={config[gradKey] ? "Color Start" : "Text Color"} 
                selected={config[colorKey] as string} 
                onSelect={(color) => onChange({ [colorKey]: color })} 
              />
              {config[gradKey] && (
                <ColorSelector 
                  label="Color End" 
                  selected={config[color2Key] as string} 
                  onSelect={(color) => onChange({ [color2Key]: color })} 
                />
              )}
              <ColorSelector 
                label="Stroke Color" 
                selected={config[strokeCKey] as string} 
                onSelect={(color) => onChange({ [strokeCKey]: color })} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Slider label="Size" value={config[sizeKey] as number} min={20} max={300} onChange={(v) => onChange({ [sizeKey]: v })} showInput={true} unit="px" />
            <Slider label="Stroke" value={config[strokeWKey] as number} min={0} max={10} step={0.5} onChange={(v) => onChange({ [strokeWKey]: v })} showInput={true} unit="px" />
          </div>

          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/60 space-y-3">
             <div className="flex items-center justify-between">
                <SectionHeader title="Text Background" />
                <button 
                  onClick={() => onChange({ [showBgKey]: !config[showBgKey] })}
                  className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all ${config[showBgKey] ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                >
                  {config[showBgKey] ? 'Enabled' : 'Disabled'}
                </button>
             </div>
             {config[showBgKey] && (
               <>
                 <ColorSelector label="Bg Color" selected={config[bgColorKey] as string} onSelect={(c) => onChange({ [bgColorKey]: c })} />
                 <div className="grid grid-cols-2 gap-4">
                    <Slider label="Pad X" value={config[bgPadXKey] as number} min={0} max={100} onChange={(v) => onChange({ [bgPadXKey]: v })} showInput={true} unit="px" />
                    <Slider label="Pad Y" value={config[bgPadYKey] as number} min={0} max={100} onChange={(v) => onChange({ [bgPadYKey]: v })} showInput={true} unit="px" />
                 </div>
               </>
             )}
          </div>

          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/60 space-y-3">
             <div className="flex items-center justify-between">
                <SectionHeader title="Drop Shadow / Glow" />
                <button 
                  onClick={() => onChange({ [showShadowKey]: !config[showShadowKey] })}
                  className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all ${config[showShadowKey] ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                >
                  {config[showShadowKey] ? 'Enabled' : 'Disabled'}
                </button>
             </div>
             {config[showShadowKey] && (
               <>
                 <div className="grid grid-cols-2 gap-4">
                   <Slider label="Blur" value={config[shadowBlurKey] as number} min={0} max={30} onChange={(v) => onChange({ [shadowBlurKey]: v })} showInput={true} unit="px" />
                   <Slider label="Dist" value={config[shadowOffsetKey] as number} min={0} max={20} onChange={(v) => onChange({ [shadowOffsetKey]: v })} showInput={true} unit="px" />
                 </div>
                 <ColorSelector label="Shadow Color" selected={config[shadowColorKey] as string} onSelect={(c) => onChange({ [shadowColorKey]: c })} />
               </>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
        <SectionHeader title="Global Style" />
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block tracking-wider">Primary Font</label>
            <select
              value={config.fontFamily}
              onChange={(e) => onChange({ fontFamily: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xl font-bold outline-none focus:border-indigo-500 transition-all"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.name} value={f.value} style={{ fontFamily: f.value }}>{f.name}</option>
              ))}
            </select>
          </div>
          <Slider label="Background Dimming" value={config.overlayOpacity} min={0} max={100} onChange={(v) => onChange({ overlayOpacity: v })} unit="%" />
        </div>
      </section>

      <section className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
        <div className="flex justify-between items-center mb-3">
          <SectionHeader title="Line One" />
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
        </div>
        {renderLineControls('line1', 'Main Hook')}
      </section>

      <section className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
        <div className="flex justify-between items-center mb-3">
          <SectionHeader title="Line Two" />
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={config.showLine2} onChange={(e) => onChange({ showLine2: e.target.checked })} className="sr-only peer" />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4.5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
        {config.showLine2 && renderLineControls('line2', 'Secondary Text')}
      </section>

      <section className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
        <div className="flex justify-between items-center mb-3">
          <SectionHeader title="Line Three" />
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={config.showLine3} onChange={(e) => onChange({ showLine3: e.target.checked })} className="sr-only peer" />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4.5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
        {config.showLine3 && renderLineControls('line3', 'Tertiary Text')}
      </section>

      <section className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
        <div className="flex justify-between items-center mb-3">
          <SectionHeader title="Graphic Elements" />
          <button 
            onClick={() => {
              const id = Math.random().toString(36).substr(2, 9);
              onChange({ 
                graphics: [...config.graphics, {
                  id,
                  type: 'icon',
                  path: ICON_PRESETS[0].path,
                  x: 50,
                  y: 50,
                  size: 100,
                  color: '#ffffff',
                  rotation: 0
                }]
              });
            }}
            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-md transition-all"
          >
            ADD ICON
          </button>
        </div>
        
        <div className="space-y-4">
          {config.graphics.map((g, idx) => (
            <div key={g.id} className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase">Element #{idx + 1}</span>
                <button 
                  onClick={() => onChange({ graphics: config.graphics.filter(item => item.id !== g.id) })}
                  className="text-red-500 hover:text-red-400 text-[10px] font-black uppercase"
                >
                  Remove
                </button>
              </div>
              
              <div className="grid grid-cols-5 gap-1">
                {ICON_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      const newGraphics = [...config.graphics];
                      newGraphics[idx] = { ...g, path: preset.path };
                      onChange({ graphics: newGraphics });
                    }}
                    className={`p-1.5 rounded border transition-all ${g.path === preset.path ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                    title={preset.name}
                  >
                    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
                      <path d={preset.path} />
                    </svg>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Slider 
                  label="X Pos" 
                  value={g.x} 
                  min={0} 
                  max={100} 
                  onChange={(v) => {
                    const newGraphics = [...config.graphics];
                    newGraphics[idx] = { ...g, x: v };
                    onChange({ graphics: newGraphics });
                  }} 
                />
                <Slider 
                  label="Y Pos" 
                  value={g.y} 
                  min={0} 
                  max={100} 
                  onChange={(v) => {
                    const newGraphics = [...config.graphics];
                    newGraphics[idx] = { ...g, y: v };
                    onChange({ graphics: newGraphics });
                  }} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Slider 
                  label="Size" 
                  value={g.size} 
                  min={10} 
                  max={500} 
                  onChange={(v) => {
                    const newGraphics = [...config.graphics];
                    newGraphics[idx] = { ...g, size: v };
                    onChange({ graphics: newGraphics });
                  }} 
                />
                <Slider 
                  label="Rotation" 
                  value={g.rotation} 
                  min={-180} 
                  max={180} 
                  onChange={(v) => {
                    const newGraphics = [...config.graphics];
                    newGraphics[idx] = { ...g, rotation: v };
                    onChange({ graphics: newGraphics });
                  }} 
                />
              </div>

              <ColorSelector 
                label="Color" 
                selected={g.color} 
                onSelect={(c) => {
                  const newGraphics = [...config.graphics];
                  newGraphics[idx] = { ...g, color: c };
                  onChange({ graphics: newGraphics });
                }} 
              />
            </div>
          ))}
          {config.graphics.length === 0 && (
            <p className="text-[10px] text-slate-600 italic text-center py-2">No graphics added yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};
