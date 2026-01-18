const { useState, useEffect } = React;

const KanjiAnimationModal = ({ char, paths, fullSvg, dbData, isOpen, onClose }) => {
    const [key, setKey] = useState(0); 
    const [strokeNumbers, setStrokeNumbers] = useState([]); 
    const [speedConfig, setSpeedConfig] = useState({ duration: 3, delay: 0.6 });
    const [activeSpeed, setActiveSpeed] = useState('normal'); 

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    useEffect(() => {
        if (fullSvg) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(fullSvg, "image/svg+xml");
            const textElements = Array.from(doc.querySelectorAll('text'));
            const numbers = textElements.map(t => ({
                value: t.textContent,
                transform: t.getAttribute('transform')
            }));
            setStrokeNumbers(numbers);
        }
    }, [fullSvg]);

    const handleReplay = (mode) => {
        let newConfig = { duration: 3, delay: 0.6 };
        if (mode === 'slow') newConfig = { duration: 4, delay: 1 };      
        if (mode === 'fast') newConfig = { duration: 1.5, delay: 0.25 };  
        setSpeedConfig(newConfig);
        setActiveSpeed(mode);
        setKey(prev => prev + 1); 
    };

    if (!isOpen) return null;

    let info = {};
    if (dbData?.KANJI_DB?.[char]) info = dbData.KANJI_DB[char];
    else if (dbData?.ALPHABETS?.hiragana?.[char]) info = dbData.ALPHABETS.hiragana[char];
    else if (dbData?.ALPHABETS?.katakana?.[char]) info = dbData.ALPHABETS.katakana[char];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-5 w-[90%] max-w-sm flex flex-col items-center relative animate-in zoom-in-95 duration-200 cursor-default" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full transition-colors z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div className="flex items-center justify-center gap-5 mb-3 mt-2 w-full px-2">
                    <h3 className="text-5xl font-black text-indigo-600 font-['Klee_One'] leading-none">{char}</h3>
                    <div className="flex flex-col items-start justify-center h-full pt-1">
                        {info.sound ? (
                            <>
                                <span className="text-xl font-black text-gray-800 uppercase font-sans tracking-wide leading-tight mb-0.5">{info.sound}</span>
                                {info.meaning && <span className="text-xs text-gray-500 font-medium font-sans italic leading-tight text-left">{info.meaning}</span>}
                            </>
                        ) : <span className="text-xs text-gray-400 font-sans">---</span>}
                    </div>
                </div>

                <div key={key} className="w-60 h-40 bg-white border border-indigo-50 rounded-xl relative mb-4 shadow-inner flex-shrink-0 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <line x1="50" y1="0" x2="50" y2="100" stroke="black" strokeWidth="0.5" strokeDasharray="4 4" />
                        <line x1="0" y1="50" x2="100" y2="50" stroke="black" strokeWidth="0.5" strokeDasharray="4 4" />
                    </svg>
                    <svg viewBox="0 0 109 109" className="h-full w-auto p-2">
                        {strokeNumbers.map((num, idx) => (
                            <text key={`num-${idx}`} transform={num.transform} className="stroke-number" style={{ animationDelay: `${idx * speedConfig.delay}s` }}>{num.value}</text>
                        ))}
                        {paths.map((d, index) => (
                            <path key={`path-${index}`} d={d} className="stroke-anim-path" style={{ animationDuration: `${speedConfig.duration}s`, animationDelay: `${index * speedConfig.delay}s` }} />
                        ))}
                    </svg>
                </div>

                <div className="flex justify-center gap-2 w-full px-2">
                    <button onClick={() => handleReplay('slow')} title="Tua chậm" className={`py-2 px-3 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 ${activeSpeed === 'slow' ? 'bg-indigo-100 text-indigo-700 font-bold ring-1 ring-indigo-300' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200 shadow-sm'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
                        <span className="text-[10px] font-bold uppercase">Chậm</span>
                    </button>
                    <button onClick={() => handleReplay('normal')} title="Vẽ lại" className={`py-2 px-4 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 ${activeSpeed === 'normal' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                        <span className="text-[10px] font-bold uppercase">Vẽ lại</span>
                    </button>
                    <button onClick={() => handleReplay('fast')} title="Tua nhanh" className={`py-2 px-3 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 ${activeSpeed === 'fast' ? 'bg-indigo-100 text-indigo-700 font-bold ring-1 ring-indigo-300' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200 shadow-sm'}`}>
                        <span className="text-[10px] font-bold uppercase">Nhanh</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KanjiAnimationModal;
