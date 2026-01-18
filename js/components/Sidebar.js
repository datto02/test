import { removeAccents, shuffleString } from '../utils.js';

const { useState, useRef, useEffect } = React;

const Sidebar = ({ config, onChange, onPrint, isMenuOpen, setIsMenuOpen, isConfigOpen, setIsConfigOpen, isCafeModalOpen, setIsCafeModalOpen, showMobilePreview, setShowMobilePreview, dbData }) => {
    const scrollRef = useRef(null);
    const [searchResults, setSearchResults] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0); 
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUtilsOpen, setIsUtilsOpen] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const filterRef = useRef(null);
    const quickMenuRef = useRef(null);
    const utilsMenuRef = useRef(null);
    const cafeModalRef = useRef(null);
    const searchInputRef = useRef(null);
    const configMenuRef = useRef(null);
    const isComposing = useRef(false);
    const [randomCount, setRandomCount] = useState(10); 
    const [localText, setLocalText] = useState(config.text);
    const [filterOptions, setFilterOptions] = useState({ hiragana: true, katakana: true, kanji: true, removeDuplicates: false });

    // --- LOGIC FUNCTIONS (Đã giữ nguyên) ---
    const getJLPTLevel = (char) => {
        if (dbData.KANJI_LEVELS.N5.includes(char)) return 'N5';
        if (dbData.KANJI_LEVELS.N4.includes(char)) return 'N4';
        if (dbData.KANJI_LEVELS.N3.includes(char)) return 'N3';
        if (dbData.KANJI_LEVELS.N2.includes(char)) return 'N2';
        if (dbData.KANJI_LEVELS.N1.includes(char)) return 'N1';
        return null;
    };

    const levelColors = {
        N5: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-600 hover:text-white hover:border-green-600',
        N4: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600',
        N3: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-600 hover:text-white hover:border-orange-600',
        N2: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-600 hover:text-white hover:border-purple-600',
        N1: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600'
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault(); e.stopPropagation(); return false;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isPrintModalOpen || isDocsModalOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isPrintModalOpen, isDocsModalOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            const activeItem = scrollRef.current.childNodes[activeIndex];
            if (activeItem) activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [activeIndex]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (filterRef.current && !filterRef.current.contains(event.target)) setIsFilterMenuOpen(false);
            if (isMenuOpen && quickMenuRef.current && !quickMenuRef.current.contains(event.target)) setIsMenuOpen(false);
            if (isUtilsOpen && utilsMenuRef.current && !utilsMenuRef.current.contains(event.target)) setIsUtilsOpen(false);
            if (isCafeModalOpen && cafeModalRef.current && !cafeModalRef.current.contains(event.target)) setIsCafeModalOpen(false);
            if (isConfigOpen && configMenuRef.current && !configMenuRef.current.contains(event.target)) setIsConfigOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMenuOpen, isUtilsOpen, isFilterMenuOpen, isCafeModalOpen, isConfigOpen]);

    useEffect(() => {
        const currentClean = localText ? localText.replace(/[a-zA-Z]/g, '') : '';
        if (currentClean !== config.text) setLocalText(config.text);
    }, [config.text]);

    const handleChange = (key, value) => onChange({ ...config, [key]: value });

    const getAllowedRegexString = (options, allowLatin = false) => {
        let ranges = "\\s"; 
        if (allowLatin) ranges += "a-zA-Z"; 
        if (options.hiragana) ranges += "\\u3040-\\u309F";
        if (options.katakana) ranges += "\\u30A0-\\u30FF";
        if (options.kanji)    ranges += "\\u4E00-\\u9FAF\\u3400-\\u4DBF\\u2E80-\\u2FDF\\uF900-\\uFAFF"; 
        return ranges;
    };

    const getUniqueChars = (str) => Array.from(new Set(str)).join('');

    const handleFilterChange = (key) => {
        const newOptions = { ...filterOptions, [key]: !filterOptions[key] };
        setFilterOptions(newOptions);
        let newText = localText;
        if (['hiragana', 'katakana', 'kanji'].includes(key) && filterOptions[key] === true) {
            const allowedString = getAllowedRegexString(newOptions, true); 
            const regex = new RegExp(`[^${allowedString}]`, 'g');
            newText = newText.replace(regex, '');
        }
        if (newOptions.removeDuplicates) newText = getUniqueChars(newText);
        setLocalText(newText);
        handleChange('text', newText.replace(/[a-zA-Z]/g, ''));
    };

    const handleRemoveLatinManual = () => {
        if (!localText) return;
        let cleaned = localText;
        cleaned = cleaned.replace(/[a-zA-Z]/g, '').replace(/[\n\r]+/g, '').replace(/[ 　\t]+/g, '').trim();
        setLocalText(cleaned);
        handleChange('text', cleaned); 
    };

    const handleInputText = (e) => {
        const rawInput = e.target.value;
        if (isComposing.current) { setLocalText(rawInput); return; }
        const allowedString = getAllowedRegexString(filterOptions, true);
        const blockRegex = new RegExp(`[^${allowedString}]`, 'g');
        let validForInput = rawInput.replace(blockRegex, '');
        if (filterOptions.removeDuplicates) validForInput = getUniqueChars(validForInput);
        setLocalText(validForInput);
        handleChange('text', validForInput.replace(/[a-zA-Z]/g, ''));
    };

    const handleCompositionStart = () => { isComposing.current = true; };
    const handleCompositionEnd = (e) => {
        isComposing.current = false;
        const rawInput = e.target.value;
        const allowedString = getAllowedRegexString(filterOptions, true);
        const blockRegex = new RegExp(`[^${allowedString}]`, 'g');
        let validForInput = rawInput.replace(blockRegex, '');
        if (filterOptions.removeDuplicates) validForInput = getUniqueChars(validForInput);
        setLocalText(validForInput);
        handleChange('text', validForInput.replace(/[a-zA-Z]/g, ''));
    };

    const handleLoadFromGithub = async (url, type = 'kanji') => {
        setProgress(0); setIsLoading(true); setIsMenuOpen(false);    
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Lỗi tải dữ liệu từ ${url}`);
            const rawText = await response.text();
            const cleanText = rawText.replace(/["\n\r\s,\[\]]/g, '');
            if (!cleanText) { alert("File dữ liệu rỗng!"); setIsLoading(false); return; }
            setFilterOptions(prev => ({ ...prev, [type]: true })); 
            setProgress(30);
            setTimeout(() => setProgress(100), 300);
            setTimeout(() => {
                setLocalText(cleanText);              
                onChange({ ...config, text: cleanText }); 
                setIsLoading(false);                  
            }, 500);
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Không tải được dữ liệu. Vui lòng kiểm tra lại đường truyền hoặc link GitHub.");
            setIsLoading(false);
        }
    };

    const handleRandomLoadFromGithub = async (level) => {
        if (randomCount === '' || randomCount <= 0) { alert("Vui lòng nhập số lượng chữ cần lấy!"); return; }
        setProgress(0);
        const fileName = `kanji${level.toLowerCase()}.json`; 
        const url = `https://raw.githubusercontent.com/datto02/luyenvietkanji/refs/heads/main/${fileName}`;
        setIsLoading(true); setIsUtilsOpen(false); 
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Lỗi tải file");
            const rawText = await response.text();
            const cleanText = rawText.replace(/["\n\r\s]/g, '');
            if (!cleanText) { alert("File dữ liệu rỗng!"); setIsLoading(false); return; }
            const shuffled = shuffleString(cleanText); 
            let count = randomCount > 50 ? 50 : randomCount;
            const selectedChars = shuffled.slice(0, count);
            setFilterOptions(prev => ({ ...prev, kanji: true }));
            setProgress(30); setTimeout(() => setProgress(100), 300);
            setTimeout(() => {
                setLocalText(selectedChars);
                onChange({ ...config, text: selectedChars });
                setIsLoading(false);
            }, 500);
        } catch (error) {
            console.error(error);
            alert(`Không tải được dữ liệu ${level}. Kiểm tra lại mạng hoặc link GitHub.`);
            setIsLoading(false);
        }
    };

    const handleBlurText = () => {
        if (!localText) return;
        let cleaned = localText; 
        cleaned = cleaned.replace(/[ \t]+/g, ' ').replace(/(\n\s*){2,}/g, '\n').trim();
        if (filterOptions.removeDuplicates) cleaned = getUniqueChars(cleaned);
        if (cleaned !== localText) {
            setLocalText(cleaned);
            handleChange('text', cleaned.replace(/[a-zA-Z]/g, ''));
        }
    };

    const handleSmartLoad = (content, type = null) => {
        if (!content) return;
        setIsLoading(true); setIsMenuOpen(false); setIsUtilsOpen(false); setIsConfigOpen(false); setProgress(0);
        if (type) setFilterOptions(prev => ({ ...prev, [type]: true }));
        else if (type === 'all') setFilterOptions(prev => ({ ...prev, kanji: true }));
        const interval = setInterval(() => {
            setProgress((prev) => { if (prev >= 90) return 90; return prev + Math.floor(Math.random() * 10) + 5; });
        }, 80);
        setTimeout(() => {
            setLocalText(content);
            onChange({ ...config, text: content });
            clearInterval(interval); setProgress(100); setTimeout(() => setIsLoading(false), 200);
        }, 600);
    };

    const handleShuffleCurrent = () => {
        if (!config.text) { alert("Chưa có nội dung!"); return; }
        handleSmartLoad(shuffleString(config.text));
    };

    const handleSearchRealtime = (val) => {
        setSearchTerm(val);
        const query = val.toLowerCase().trim();
        const queryNoAccent = removeAccents(query);
        if (!query) { setSearchResults([]); return; }
        const matches = [];
        const processData = (source, type) => {
            Object.entries(source).forEach(([char, info]) => {
                if (info.sound) {
                    const sound = info.sound.toLowerCase();
                    const soundNoAccent = removeAccents(sound);
                    let priority = 99;
                    if (sound === query) priority = 1; 
                    else if (soundNoAccent === queryNoAccent) priority = 2; 
                    else if (sound.includes(query)) priority = 3; 
                    else if (soundNoAccent.includes(queryNoAccent)) priority = 4; 
                    if (priority < 99) matches.push({ char, ...info, type, priority, sound });
                }
            });
        };
        processData(dbData.KANJI_DB, 'kanji');
        matches.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return a.sound.localeCompare(b.sound);
        });
        setSearchResults(matches.slice(0, 20));
        setActiveIndex(0); 
    };

    const selectResult = (item) => {
        let newText = config.text + item.char;
        if (filterOptions.removeDuplicates) newText = getUniqueChars(newText);
        setLocalText(newText);
        handleChange('text', newText);
        setSearchTerm(''); setSearchResults([]); setActiveIndex(0);
        if (item.type === 'kanji') setFilterOptions(p => ({...p, kanji: true}));
        else if (item.char.match(/[\u3040-\u309F]/)) setFilterOptions(p => ({...p, hiragana: true}));
        else setFilterOptions(p => ({...p, katakana: true}));
    };

    const toggleMenu = (menuName) => {
        setIsCafeModalOpen(false); setIsFilterMenuOpen(false); 
        if (menuName === 'quick') { setIsMenuOpen(!isMenuOpen); setIsUtilsOpen(false); setIsConfigOpen(false); }
        else if (menuName === 'utils') { setIsUtilsOpen(!isUtilsOpen); setIsMenuOpen(false); setIsConfigOpen(false); }
        else if (menuName === 'config') { setIsConfigOpen(!isConfigOpen); setIsMenuOpen(false); setIsUtilsOpen(false); }
    };

    const getDynamicPlaceholder = () => {
        const labels = [];
        if (filterOptions.kanji) labels.push("漢字");        
        if (filterOptions.hiragana) labels.push("ひらがな"); 
        if (filterOptions.katakana) labels.push("カタカナ"); 
        if (labels.length === 0) return "Vui lòng chọn ít nhất 1 loại chữ...";
        return labels.join(", ");
    };

    const isWarningMode = !filterOptions.hiragana && !filterOptions.katakana && !filterOptions.kanji;

    return (
        <div className="w-full md:w-96 bg-white shadow-xl p-6 flex flex-col gap-6 h-auto md:h-screen md:overflow-y-auto relative md:sticky top-0 border-r border-gray-200 z-50 hide-scrollbar">
            
            <div className="mb-4 pb-3 border-b border-gray-100"> 
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-1.5 mb-1">
                <span className="text-2xl leading-none -mt-1">⛩️</span>
                TẠO FILE LUYỆN VIẾT KANJI
                </h1>
            </div>

            <div className="space-y-6 flex-1">
                
                {/* SEARCH AREA */}
                <div className="space-y-1.5 pb-2 mb-2 relative">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            </div>
                            <input ref={searchInputRef} type="text" value={searchTerm} className="w-full pl-10 pr-10 py-2.5 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50 text-indigo-900 placeholder-indigo-400 font-bold font-sans" placeholder="Tìm Kanji theo âm Hán Việt" onChange={(e) => handleSearchRealtime(e.target.value)} 
                                onKeyDown={(e) => {
                                    if (searchResults.length > 0) {
                                        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0)); } 
                                        else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1)); } 
                                        else if (e.key === 'Enter') { e.preventDefault(); selectResult(searchResults[activeIndex]); }
                                    }
                                }}
                            />
                            {searchTerm && (
                                <button onClick={() => { setSearchTerm(''); setSearchResults([]); searchInputRef.current.focus(); }} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 transition-colors" title="Xóa tìm kiếm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            )}
                        </div>
                    </div>
                    {searchResults.length > 0 && (
                        <div ref={scrollRef} className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[70] max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                            {searchResults.map((item, idx) => {
                                const level = getJLPTLevel(item.char);
                                return (
                                    <div key={idx} onClick={() => selectResult(item)} className={`flex items-center gap-3 p-3 cursor-pointer border-b border-gray-50 last:border-none transition-colors group ${idx === activeIndex ? 'bg-indigo-100' : 'bg-white hover:bg-indigo-50'}`}>
                                        <span className="text-2xl font-['Klee_One'] text-black group-hover:scale-110 transition-transform">{item.char}</span>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-indigo-600 uppercase leading-tight">{item.sound}</span>
                                            {item.meaning && <span className="text-[10px] text-gray-400 font-medium leading-tight">{item.meaning}</span>}
                                        </div>
                                        <div className="ml-auto">
                                            {level ? <div className={`px-1.5 py-0.5 rounded text-[9px] font-black border transition-all duration-200 ${levelColors[level]}`}>{level}</div> : <div className="px-1.5 py-0.5 rounded text-[9px] font-black border bg-gray-100 text-gray-500 border-gray-200 uppercase transition-all duration-200 hover:bg-gray-500 hover:text-white hover:border-gray-500 cursor-default">Bộ thủ</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* TEXT AREA */}
                <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 font-sans">Nhập dữ liệu</label>
                        <div className="flex items-center gap-3 relative">
                            <div className="relative" ref={filterRef}>
                                <button onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-colors ${isFilterMenuOpen ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-700'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> Bộ lọc
                                </button>
                                {isFilterMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">BỘ LỌC</span>
                                            <div className="group relative cursor-help">
                                                <div className="text-gray-400 hover:text-indigo-500 border border-gray-300 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] font-serif font-bold bg-gray-50">i</div>
                                                <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-gray-900 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-[60]">1. Bỏ tích ô nào, chữ loại đó sẽ bị xóa ngay lập tức khỏi ô nhập liệu. <br/> 2. "LÀM SẠCH" sẽ xóa hết chữ latinh, khoảng trắng thừa trong ô nhập liệu.</div>
                                            </div>
                                        </div>
                                        <div className="space-y-2.5">
                                            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-indigo-600 select-none"><input type="checkbox" checked={filterOptions.kanji} onChange={() => handleFilterChange('kanji')} className="accent-indigo-600 w-3.5 h-3.5 rounded-sm"/> Kanji & Bộ thủ</label>
                                            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-indigo-600 select-none"><input type="checkbox" checked={filterOptions.hiragana} onChange={() => handleFilterChange('hiragana')} className="accent-indigo-600 w-3.5 h-3.5 rounded-sm"/> Hiragana</label>
                                            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-indigo-600 select-none"><input type="checkbox" checked={filterOptions.katakana} onChange={() => handleFilterChange('katakana')} className="accent-indigo-600 w-3.5 h-3.5 rounded-sm"/> Katakana</label>
                                            <hr className="border-gray-100 my-1"/>
                                            <label className={`flex items-center gap-2 text-xs cursor-pointer select-none transition-colors ${filterOptions.removeDuplicates ? 'text-red-500 hover:text-red-600' : 'text-gray-700 hover:text-indigo-600'}`}>
                                                <input type="checkbox" checked={filterOptions.removeDuplicates} onChange={() => handleFilterChange('removeDuplicates')} className={`w-3.5 h-3.5 rounded-sm ${filterOptions.removeDuplicates ? 'accent-red-500' : 'accent-indigo-500'}`}/> Xóa chữ trùng lặp
                                            </label>
                                            <hr className="border-gray-100"/>
                                            <button onClick={handleRemoveLatinManual} className="w-full py-2 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg flex items-center justify-center gap-1 transition">LÀM SẠCH</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => { setLocalText(''); handleChange('text', ''); }} className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-tighter">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> XÓA TẤT CẢ
                            </button>
                        </div>
                    </div>
                    <textarea className={`w-full h-[104px] p-3 pr-1 border border-gray-300 rounded-lg resize-none text-lg bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner input-scrollbar ${(isWarningMode && !localText) ? 'font-sans' : "font-['Klee_One']"}`} placeholder={getDynamicPlaceholder()} value={localText} onChange={handleInputText} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} onBlur={handleBlurText}/>
                </div>

                {/* FOOTER BUTTONS */}
                <div className="flex flex-col gap-3 w-full">
                    <div className="flex flex-row gap-4 w-full h-12">
                        {/* 1. CHỌN NHANH */}
                        <div className="relative flex-1" ref={quickMenuRef}> 
                            <button onClick={() => toggleMenu('quick')} className={`w-full h-full px-1 border rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-[0.98] ${isMenuOpen ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}><span className="font-bold text-xs whitespace-nowrap">Chọn nhanh</span></button>
                            {isMenuOpen && (
                                <div className="absolute bottom-full left-0 mb-2 z-50 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 text-left">Bảng chữ cái</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => handleLoadFromGithub('https://raw.githubusercontent.com/datto02/luyenvietkanji/refs/heads/main/hiragana.json', 'hiragana')} className="py-2 text-xs font-bold bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-black hover:text-white transition">あ Hiragana</button>
                                            <button onClick={() => handleLoadFromGithub('https://raw.githubusercontent.com/datto02/luyenvietkanji/refs/heads/main/katakana.json', 'katakana')} className="py-2 text-xs font-bold bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-black hover:text-white transition">ア Katakana</button>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Bộ thủ</p>
                                        <button onClick={() => handleLoadFromGithub('https://raw.githubusercontent.com/datto02/luyenvietkanji/refs/heads/main/bothu.json')} className="w-full py-2 text-xs font-black border bg-gray-100 text-gray-500 border-gray-200 uppercase transition-all duration-200 hover:bg-gray-500 hover:text-white hover:border-gray-500 rounded">Bộ thủ cơ bản</button>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 text-left">Lấy tất cả Kanji</p>
                                        <div className="grid grid-cols-5 gap-1.5">
                                            {['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => (
                                                <button key={level} onClick={() => { const fileName = `kanji${level.toLowerCase()}.json`; const url = `https://raw.githubusercontent.com/datto02/luyenvietkanji/refs/heads/main/${fileName}`; handleLoadFromGithub(url); }} className={`py-2 text-[11px] font-black border rounded-md transition-all duration-200 active:scale-95 ${levelColors[level]}`}>{level}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. TIỆN ÍCH */}
                        <div className="relative flex-1" ref={utilsMenuRef}> 
                            <button onClick={() => toggleMenu('utils')} className={`w-full h-full px-1 border rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-[0.98] ${isUtilsOpen ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}><span className="font-bold text-xs whitespace-nowrap">Tiện ích</span></button>
                            {isUtilsOpen && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 text-left">Công cụ</p>
                                        <button onClick={handleShuffleCurrent} className="w-full py-2.5 text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-600 hover:text-white transition flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>Xáo trộn danh sách hiện tại</button>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Lấy ngẫu nhiên</p>
                                            <div className="flex items-center gap-1.5">
                                                <input type="number" min="0" max="50" value={randomCount} onChange={(e) => { const val = e.target.value; if (val === '') setRandomCount(''); else setRandomCount(parseInt(val)); }} onKeyDown={(e) => { if(e.key==='Enter' && randomCount>50) setRandomCount(50) }} onBlur={() => { if(randomCount>50) setRandomCount(50) }} className="w-14 h-7 text-xs text-center font-bold bg-white border border-gray-300 text-gray-700 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors" />
                                                <span className="text-[10px] font-bold text-gray-500">chữ</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-5 gap-1.5">
                                            {['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => (<button key={level} onClick={() => handleRandomLoadFromGithub(level)} className={`py-2 text-[11px] font-black border rounded-md transition-all duration-200 ${levelColors[level]}`}>{level}</button>))}
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2 mb-2"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">ÔN TẬP</p><span className="flex-1 border-b border-gray-50"></span></div>
                                        <a href="https://quizlet.com/join/mE5CzMyT7?i=4yxqkk&x=1bqt" target="_blank" className="w-full py-3 bg-[#4255ff] hover:bg-[#3243cc] text-white rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 group">
                                            <span className="bg-white p-0.5 rounded flex items-center justify-center group-hover:rotate-12 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4255ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span>
                                            <span className="text-xs font-black tracking-wide">FLASHCARD KANJI</span>
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. TÙY CHỈNH */}
                        <div className="relative flex-1" ref={configMenuRef}> 
                            <button onClick={() => toggleMenu('config')} className={`w-full h-full px-1 border rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-[0.98] ${isConfigOpen ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}><span className="font-bold text-xs whitespace-nowrap">Tùy chỉnh</span></button>
                            {isConfigOpen && (
                                <div className="absolute bottom-full right-0 mb-2 z-50 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center"><label className="text-[11px] font-bold text-gray-600">Số chữ mẫu</label><span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-1.5 rounded">{config.traceCount} chữ</span></div>
                                        <input type="range" min="0" max="12" step="1" className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={config.traceCount} onChange={(e) => handleChange('traceCount', parseInt(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center"><label className="text-[11px] font-bold text-gray-600">Độ đậm chữ</label><span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-1.5 rounded">{Math.round(config.traceOpacity * 100)}%</span></div>
                                        <input type="range" min="0.05" max="0.5" step="0.05" className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={config.traceOpacity} onChange={(e) => handleChange('traceOpacity', parseFloat(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center"><label className="text-[11px] font-bold text-gray-600">Cỡ chữ</label><span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-1.5 rounded">{config.fontSize} pt</span></div>
                                        <input type="range" min="30" max="40" step="1" className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={config.fontSize} onChange={(e) => handleChange('fontSize', parseInt(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center"><label className="text-[11px] font-bold text-gray-600">Độ đậm khung</label><span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-1.5 rounded">{Math.round(config.gridOpacity * 100)}%</span></div>
                                        <input type="range" min="0.1" max="1" step="0.1" className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={config.gridOpacity} onChange={(e) => handleChange('gridOpacity', parseFloat(e.target.value))} />
                                    </div>
                                    <div className="pt-2 border-t border-gray-100">
                                        <div className="space-y-1">
                                            <label className="flex items-center justify-between group cursor-pointer">
                                                <span className="text-[11px] font-bold text-gray-600">Hiện âm On/Kun</span>
                                                <div className="relative inline-block w-9 h-5">
                                                    <input type="checkbox" className="peer opacity-0 w-0 h-0" checked={config.showOnKun} onChange={() => handleChange('showOnKun', !config.showOnKun)} />
                                                    <span className="absolute inset-0 rounded-full transition-all duration-300 bg-gray-200 peer-checked:bg-indigo-600"></span>
                                                    <span className={`absolute left-1 bottom-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${config.showOnKun ? 'translate-x-4' : ''}`}></span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="pt-0">
                                        <button onClick={() => onChange({ ...config, fontSize: 35, traceCount: 9, traceOpacity: 0.15, gridOpacity: 0.8, showOnKun: false })} className="w-full py-1.5 text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>KHÔI PHỤC MẶC ĐỊNH</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full mt-auto pt-4 flex flex-col gap-4"> 
                        <button onClick={() => { if (!config.text || config.text.trim().length === 0) { alert("Vui lòng nhập nội dung để tạo file"); return; } setIsPrintModalOpen(true); }} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 group">
                            <svg className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>IN / LƯU PDF
                        </button>
                        {(() => {
                            const isEmpty = !config.text || config.text.trim().length === 0;
                            return (
                                <button onClick={() => { if (showMobilePreview) { setShowMobilePreview(false); } else { setShowMobilePreview(true); setTimeout(() => { const previewElement = document.getElementById('preview-area'); if(previewElement) previewElement.scrollIntoView({ behavior: 'smooth' }); }, 100); } }} className={`md:hidden w-full py-3 font-bold rounded-xl border shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all mt-3 ${showMobilePreview ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                    {showMobilePreview ? (<>{isEmpty ? (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>)}{isEmpty ? "ĐÓNG HƯỚNG DẪN" : "ĐÓNG BẢN XEM TRƯỚC"}</>) : (<>{isEmpty ? (<><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>XEM HƯỚNG DẪN</>) : (<><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>XEM TRƯỚC BẢN IN</>)}</>)}
                                </button>
                            );
                        })()}
                        <div className="flex items-center justify-between px-2 gap-2 text-xs font-bold text-gray-500 pb-2">
                            <div className="relative flex flex-col items-center" ref={cafeModalRef}>
                                <button onClick={() => { setIsCafeModalOpen(!isCafeModalOpen); setIsMenuOpen(false); setIsUtilsOpen(false); setIsConfigOpen(false); setIsFilterMenuOpen(false); }} className="flex flex-col items-center gap-1 group w-full">
                                    <div className="p-2 bg-orange-50 rounded-full text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all duration-200"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg></div>
                                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-orange-600">Mời cafe</span>
                                </button>
                                {isCafeModalOpen && (
                                    <div className="absolute bottom-full left-0 mb-3 z-[60] w-60 bg-white border border-orange-100 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        <div className="text-center space-y-3">
                                            <p className="text-[10px] text-orange-800 font-medium leading-tight">Sự ủng hộ của bạn giúp mình duy trì và phát triển nhiều tính năng mới. Cảm ơn bạn rất nhiều!</p>
                                            <div className="bg-gray-50 p-2 rounded-lg inline-block shadow-inner"><img src="https://i.ibb.co/JWGwcTL1/3381513652021492183.jpg" alt="QR Cafe" className="w-28 h-auto rounded"/></div>
                                            <p className="text-[11px] text-orange-500 font-bold bg-orange-50 py-1 rounded">MB BANK: 99931082002</p>
                                        </div>
                                        <div className="absolute top-full left-4 -mt-1 w-3 h-3 bg-white border-b border-r border-orange-100 rotate-45"></div>
                                    </div>
                                )}
                            </div>
                            <a href="https://www.tiktok.com/@phadaotiengnhat" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 hover:text-black transition-colors group">
                                <div className="p-2 bg-gray-100 rounded-full text-gray-600 group-hover:bg-black group-hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg></div>
                                <span className="text-[10px]">Tiktok</span>
                            </a>
                            <a href="https://zalo.me/g/ujgais332" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 hover:text-blue-600 transition-colors group">
                                <div className="p-2 bg-blue-50 rounded-full text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
                                <span className="text-[10px]">Nhóm</span>
                            </a>
                            <button onClick={() => setIsDocsModalOpen(true)} className="flex flex-col items-center gap-1 hover:text-purple-600 transition-colors group">
                                <div className="p-2 bg-purple-50 rounded-full text-purple-500 group-hover:bg-purple-600 group-hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
                                <span className="text-[10px]">Tài liệu</span>
                            </button>
                        </div>
                    </div>

                    {isDocsModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 flex flex-col max-h-[80vh]">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>TÀI LIỆU HỌC TẬP</h3>
                                    <button onClick={() => setIsDocsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                                </div>
                                <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
                                    <a href="https://drive.google.com/file/d/1Q3bbd3Aao7R71wemjESHddbvmXWYe542/view?usp=sharing" target="_blank" className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                                        <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-800 truncate group-hover:text-purple-700 pb-1">2139 Hán tự (N5-N1)</p><p className="text-[10px] text-gray-400">PDF • 797 KB</p></div>
                                        <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                    </a>
                                    <a href="https://drive.google.com/file/d/17L2ufF9P0GfLrhzE_yCsAqjXYSYrhTxU/view?usp=sharing" target="_blank" className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                                        <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-800 truncate group-hover:text-purple-700 pb-1">Quy tắc chuyển âm</p><p className="text-[10px] text-gray-400">PDF • 128 KB</p></div>
                                        <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                    </a>
                                    <a href="https://quizlet.com/join/mE5CzMyT7?i=4yxqkk&x=1bqt" target="_blank" className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                                        <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-800 truncate group-hover:text-purple-700 pb-1">Flashcard 2139 kanji N5-N1</p><p className="text-[10px] text-gray-400">147 học phần</p></div>
                                        <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                    </a>
                                    <a href="https://quizlet.com/join/nuE9y8xHf?i=4yxqkk&x=1bqt" target="_blank" className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                                        <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-800 truncate group-hover:text-purple-700 pb-1">Flashcard từ vựng N5-N1</p><p className="text-[10px] text-gray-400">354 học phần</p></div>
                                        <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                    </a>
                                    <a href="https://zalo.me/g/ujgais332" target="_blank" className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group">
                                        <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
                                        <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-800 truncate group-hover:text-purple-700 pb-1">Thêm nhiều tài liệu khác...</p><p className="text-[10px] text-gray-400">tham gia nhóm học tập</p></div>
                                        <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                    </a>
                                </div>
                                <div className="p-4 pt-2 bg-white">
                                    <button onClick={() => setIsDocsModalOpen(false)} className="w-full py-3 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-lg transition-transform active:scale-95">ĐÓNG</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isPrintModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200 border border-gray-200">
                                <button onClick={() => setIsPrintModalOpen(false)} className="absolute top-3 right-3 p-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full transition-colors z-10 group" title="Đóng"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                                <div className="p-6 flex flex-col items-center text-center">
                                    <div className="w-14 h-14 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-4 border border-yellow-100"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">LƯU Ý QUAN TRỌNG</h3>
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-800 leading-relaxed text-left w-full">
                                        <p className="font-bold mb-2 flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Để bản in đẹp nhất:</p>
                                        <ul className="list-disc list-inside space-y-1.5 ml-1"><li>Nên dùng <b>Máy tính (PC/Laptop)</b>.</li><li>Trình duyệt khuyên dùng: <b>Google Chrome</b>.</li><li>Không nên dùng <b>iphone</b>.</li></ul>
                                    </div>
                                    <button onClick={() => { setIsPrintModalOpen(false); onPrint(); }} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>TIẾN HÀNH IN/LƯU NGAY</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {isLoading && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                    <div className="w-72 p-6 bg-white rounded-2xl shadow-2xl border border-indigo-50 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-end mb-2"><span className="text-xs font-bold text-indigo-600 uppercase tracking-wider animate-pulse">Đang nạp dữ liệu...</span><span className="text-sm font-black text-indigo-600">{progress}%</span></div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden"><div className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${progress}%` }}></div></div>
                        <p className="text-[10px] text-gray-400 mt-3 text-center italic">Hệ thống đang xử lý, vui lòng đợi giây lát...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;
