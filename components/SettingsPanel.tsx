
import React from 'react';
import { WatermarkSettings } from '../types';
import { Copy, Check, CalendarDays } from 'lucide-react';

interface SettingsPanelProps {
  settings: WatermarkSettings;
  setSettings: React.Dispatch<React.SetStateAction<WatermarkSettings>>;
  onApplyWatermark: () => void;
  onApplyToAll: () => void;
  isProcessing: boolean;
}

const SettingsInput: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; placeholder: string; type?: string; isTextArea?: boolean }> = 
({ label, name, value, onChange, placeholder, type = 'text', isTextArea = false }) => (
    <div>
        <label htmlFor={name} className="text-sm font-medium text-gray-500 mb-1 block">{label}</label>
        {isTextArea ? (
            <textarea id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} rows={2} className="w-full p-2.5 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition" />
        ) : (
            <div className="relative">
                <input type={type} id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full p-2.5 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition" />
                {name === 'date' && <CalendarDays size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />}
            </div>
        )}
    </div>
);


const SettingsSlider: React.FC<{ label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; min: number; max: number; unit: string; name: string; }> = 
({ label, value, onChange, min, max, unit, name }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <label htmlFor={name} className="text-sm font-medium text-gray-500">{label}</label>
            <span className="text-sm text-white font-mono bg-gray-600 px-1.5 py-0.5 rounded">{value}{unit}</span>
        </div>
        <input type="range" id={name} name={name} min={min} max={max} value={value} onChange={onChange} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary" />
    </div>
);


const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, setSettings, onApplyWatermark, onApplyToAll, isProcessing }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: name === 'fontSize' || name === 'boxWidth' || name === 'opacity' ? Number(value) : value }));
  };
  
  const [copied, setCopied] = React.useState(false);
  const handleCopyToAll = () => {
    onApplyToAll();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="h-full flex flex-col">
        <h2 className="text-xl font-bold text-gray-800 flex-shrink-0">Watermark Settings</h2>
        
        <div className="flex-grow mt-6 space-y-4 overflow-y-auto pr-2">
            <SettingsInput label="Date" name="date" type="text" value={settings.date} onChange={handleChange} placeholder="e.g., 12-Aug-2025" />
            <SettingsInput label="Recipient" name="recipient" value={settings.recipient} onChange={handleChange} placeholder="Enter recipient name" />
            <SettingsInput label="Purpose" name="purpose" isTextArea value={settings.purpose} onChange={handleChange} placeholder="Enter purpose" />
            
            <div className="p-4 rounded-lg bg-gray-800 space-y-4">
                <SettingsSlider label="Font Size" name="fontSize" value={settings.fontSize} onChange={handleChange} min={4} max={48} unit="pt" />
                <SettingsSlider label="Box Width" name="boxWidth" value={settings.boxWidth} onChange={handleChange} min={150} max={800} unit="px" />
                <SettingsSlider label="Transparency" name="opacity" value={settings.opacity} onChange={handleChange} min={10} max={100} unit="%" />
            </div>
        </div>

        <div className="space-y-3 pt-6 border-t border-gray-200 flex-shrink-0">
             <button onClick={handleCopyToAll} className={`w-full flex items-center justify-center text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>
                {copied ? <Check size={16} className="mr-2"/> : <Copy size={16} className="mr-2"/>}
                {copied ? 'Position Copied!' : 'Apply Position to All Pages'}
            </button>
            <button onClick={onApplyWatermark} disabled={isProcessing} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-primary-light disabled:cursor-not-allowed flex items-center justify-center">
                {isProcessing ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                    </>
                ) : 'Apply Watermark & Download'}
            </button>
            <p className="text-xs text-center text-gray-500">Click the button above to process the active PDF with your custom watermark.</p>
        </div>
    </div>
  );
};

export default SettingsPanel;
