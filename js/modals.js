// --- SỬA LẠI: REVIEW LIST MODAL (Xem thêm: Xám nhạt, góc trái, chìm nền) ---
const ReviewListModal = ({ isOpen, onClose, srsData, onResetSRS }) => {
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
    const [isHelpOpen, setIsHelpOpen] = React.useState(false);
    
    // State lưu trạng thái mở rộng
    const [expandedSections, setExpandedSections] = React.useState({});

    // Reset trạng thái khi đóng Modal
    React.useEffect(() => {
        if (!isOpen) {
            setIsConfirmOpen(false);
            setIsHelpOpen(false);
            setExpandedSections({}); 
        }
    }, [isOpen]);

    const toggleExpand = (key) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // --- CÁC HÀM XỬ LÝ FILE (GIỮ NGUYÊN) ---
    const handleExport = () => {
        const data = localStorage.getItem('phadao_srs_data');
        if (!data || data === '{}') { alert("Chưa có dữ liệu!"); return; }
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const date = new Date();
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_tiengnhat_${date.getDate()}-${date.getMonth()+1}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target.result;
                JSON.parse(json); 
                if (confirm("⚠️ CẢNH BÁO: Dữ liệu hiện tại sẽ bị ghi đè. Bạn chắc chắn chứ?")) {
                    localStorage.setItem('phadao_srs_data', json);
                    window.location.reload();
                }
            } catch (err) { alert("File lỗi!"); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };
    
    React.useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // --- LOGIC GOM NHÓM DỮ LIỆU ---
    const groupedData = React.useMemo(() => {
        const groups = { today: [] }; 
        const now = Date.now();
        Object.entries(srsData || {}).forEach(([char, data]) => {
            if ((!data.nextReview && data.nextReview !== 0) || (data.isDone === true)) return;
            if (data.nextReview === 0 || data.nextReview <= now) {
                groups.today.push(char);
            } else {
                const dateObj = new Date(data.nextReview);
                const dateKey = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
                if (!groups[dateKey]) groups[dateKey] = [];
                groups[dateKey].push(char);
            }
        });
        return groups;
    }, [srsData, isOpen]);

    if (!isOpen) return null;

    const futureDates = Object.keys(groupedData).filter(k => k !== 'today').sort((a, b) => {
        const [d1, m1] = a.split('/').map(Number);
        const [d2, m2] = b.split('/').map(Number);
        return m1 === m2 ? d1 - d2 : m1 - m2;
    });

    // === COMPONENT CON: RENDER LIST (ĐÃ CHỈNH STYLE NÚT XEM THÊM) ===
    const RenderListSection = ({ title, count, items, bgColor, borderColor, sectionKey, isToday }) => {
        const LIMIT = 33; 
        const shouldCollapse = !isToday && items.length > LIMIT;
        const isExpanded = expandedSections[sectionKey];

        return (
            <div className={`${bgColor} rounded-xl p-3 border ${borderColor} relative transition-all`}>
                <div className="flex items-center justify-between mb-2">
                    {isToday ? (
                        <span className="text-sm font-black text-orange-600 uppercase">{title}</span>
                    ) : (
                        <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            {title}
                        </span>
                    )}
                    <span className={`${isToday ? 'bg-orange-200 text-orange-700' : 'bg-gray-200 text-gray-600'} text-[10px] font-bold px-1.5 rounded`}>{count} chữ</span>
                </div>

                {items.length > 0 ? (
                    <div className={`relative ${shouldCollapse && !isExpanded ? 'max-h-[120px] overflow-hidden' : ''}`}>
                        <div className="flex flex-wrap gap-1">
                            {items.map((char, i) => (
                                <span key={i} className={`inline-block bg-white border ${isToday ? 'border-orange-200 text-gray-800' : 'border-gray-200 text-gray-500'} rounded px-1.5 py-0.5 text-base font-['Klee_One'] min-w-[28px] text-center shadow-sm ${!isToday && 'opacity-70'}`}>{char}</span>
                            ))}
                        </div>
                        
                        {/* --- PHẦN SỬA ĐỔI: Lớp phủ mờ + Nút Chìm --- */}
                        {shouldCollapse && !isExpanded && (
                            <div 
                                className="absolute inset-x-0 bottom-0 h-16 flex items-end justify-start pl-3 pb-1 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent cursor-pointer rounded-b-xl"
                                onClick={() => toggleExpand(sectionKey)}
                            >
                                {/* Nút dạng text đơn giản, màu xám nhạt */}
                                <button className="text-[10px] font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
                                    Xem thêm {items.length - LIMIT} chữ...
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-[12px] text-gray-400 italic">Không có Kanji cần ôn. Giỏi quá! 🎉</p>
                )}
                
                {/* Nút thu gọn (Cũng làm chìm cho đồng bộ) */}
                {shouldCollapse && isExpanded && (
                     <div className="flex justify-center mt-2 pt-2 border-t border-dashed border-gray-200">
                        <button 
                            onClick={() => toggleExpand(sectionKey)}
                            className="text-[10px] font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                        >
                            Thu gọn
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                        </button>
                     </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-pointer" onClick={onClose}>
            <div className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 overflow-hidden relative transition-all cursor-default ${isConfirmOpen ? 'max-w-[300px]' : 'max-w-md'}`} onClick={e => e.stopPropagation()}>
                
                {isHelpOpen ? (
                    // === GIAO DIỆN HƯỚNG DẪN (GIỮ NGUYÊN) ===
                    <>
                         <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
                            <h3 className="text-base font-black text-indigo-700 uppercase flex items-center gap-2">🎓 HƯỚNG DẪN</h3>
                            <button onClick={() => setIsHelpOpen(false)} className="text-indigo-400 hover:text-indigo-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar text-sm text-gray-600 space-y-6 flex-1">
                            <div><h4 className="font-bold text-gray-800 mb-1">🧠 1. PHƯƠNG PHÁP HỌC</h4><p className="text-justify">Hệ thống sử dụng thuật toán <b>Lặp lại ngắt quãng</b> để nhắc bạn ôn tập đúng thời điểm.</p></div>
                            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100"><h4 className="font-bold text-indigo-700 mb-1">⚙️ 2. CƠ CHẾ</h4><p>Hệ thống tự tính toán lịch ôn. Thông báo sẽ hiện khi đến hạn (5h sáng).</p></div>
                            <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100"><h4 className="font-bold text-yellow-700 mb-1">⚠️ 3. LƯU Ý DỮ LIỆU</h4><p>Dữ liệu lưu trên trình duyệt. Xóa lịch sử hoặc dùng ẩn danh sẽ mất dữ liệu.</p></div>
                            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                <h4 className="font-bold text-emerald-800 mb-2">💾 4. SAO LƯU & KHÔI PHỤC</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={handleExport} className="flex flex-col items-center justify-center gap-1 py-2 bg-white border border-emerald-200 text-emerald-700 font-bold rounded-lg shadow-sm"><span>TẢI FILE VỀ</span><span className="text-[9px] font-normal opacity-80">(.json)</span></button>
                                    <label className="flex flex-col items-center justify-center gap-1 py-2 bg-emerald-600 border border-emerald-600 text-white font-bold rounded-lg shadow-sm cursor-pointer"><span>KHÔI PHỤC</span><span className="text-[9px] font-normal opacity-80">(Chọn file)</span><input type="file" accept=".json" className="hidden" onChange={handleImport} /></label>
                                </div>
                            </div>
                            <button onClick={() => setIsHelpOpen(false)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg active:scale-95 text-xs uppercase">QUAY LẠI</button>
                        </div>
                    </>
                ) : !isConfirmOpen ? (
                    // === GIAO DIỆN CHÍNH ===
                    <>
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div className="flex items-baseline gap-3">
                                <h3 className="text-sm font-bold text-gray-800 uppercase flex items-center gap-2">📅 LỊCH TRÌNH ÔN TẬP</h3>
                                <button onClick={() => setIsHelpOpen(true)} className="text-[12px] font-bold text-blue-500 hover:text-blue-700 underline decoration-blue-300 underline-offset-2">xem hướng dẫn</button>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                        </div>

                        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-4">
                                {/* HÔM NAY: isToday={true} -> Luôn hiện full */}
                                <RenderListSection 
                                    title="Cần ôn ngay"
                                    count={groupedData.today.length}
                                    items={groupedData.today}
                                    bgColor="bg-orange-50"
                                    borderColor="border-orange-100"
                                    sectionKey="today"
                                    isToday={true} 
                                />

                                {/* TƯƠNG LAI: isToday={false} -> Cắt nếu > 33 chữ */}
                                {futureDates.length > 0 && (
                                    <div className="space-y-3">
                                         <div className="flex items-center gap-2 mt-2">
                                            <span className="h-[1px] flex-1 bg-gray-100"></span>
                                            <span className="text-sm font-bold text-gray-400 uppercase">Sắp tới</span>
                                            <span className="h-[1px] flex-1 bg-gray-100"></span>
                                        </div>
                                        {futureDates.map(date => (
                                            <RenderListSection 
                                                key={date}
                                                title={`Ngày ${date}`}
                                                count={groupedData[date].length}
                                                items={groupedData[date]}
                                                bgColor="bg-gray-50"
                                                borderColor="border-gray-100"
                                                sectionKey={date}
                                                isToday={false}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-dashed border-gray-200 text-center pb-2">
                                <button onClick={() => { if (!srsData || Object.keys(srsData).length === 0) { alert("Danh sách trống"); return; } setIsConfirmOpen(true); }} className="text-red-700 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 mx-auto">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                    XÓA TOÀN BỘ TIẾN ĐỘ
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    // === GIAO DIỆN CẢNH BÁO XÓA (GIỮ NGUYÊN) ===
                    <div className="p-7 text-center animate-in fade-in zoom-in-95 flex flex-col items-center justify-center min-h-[300px]" onClick={(e) => { e.stopPropagation(); setIsConfirmOpen(false); }}>
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 animate-bounce">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        </div>
                        <h3 className="text-xl font-black text-gray-800 mb-2 uppercase">Cảnh báo</h3>
                        <p className="text-sm text-gray-500 mb-8 max-w-[260px]">Lịch sử học tập sẽ bị xóa vĩnh viễn.<br/><span className="text-red-500 font-bold">Không thể khôi phục lại!</span></p>
                        <div className="flex flex-col gap-3 w-full max-w-[260px]">
                            <button onClick={() => setIsConfirmOpen(false)} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg active:scale-95 uppercase text-xs">KHÔNG XÓA NỮA</button>
                            <button onClick={() => { onResetSRS(); setIsConfirmOpen(false); onClose(); }} className="w-full py-3 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 font-bold rounded-xl text-xs">Vẫn xóa dữ liệu</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
// --- BƯỚC 4: FLASHCARD MODAL (ĐÃ GẮN SỰ KIỆN LƯU DỮ LIỆU) ---
const FlashcardModal = ({ isOpen, onClose, text, dbData, onSrsUpdate, srsData, onSrsRestore }) => { 
    const [originalQueue, setOriginalQueue] = React.useState([]);
    const [queue, setQueue] = React.useState([]);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [isFlipped, setIsFlipped] = React.useState(false);
    const [unknownIndices, setUnknownIndices] = React.useState([]);
    const [knownCount, setKnownCount] = React.useState(0);
    const [history, setHistory] = React.useState([]); 
    const [isFinished, setIsFinished] = React.useState(false);
    const [exitDirection, setExitDirection] = React.useState(null);
    const [showHint, setShowHint] = React.useState(true);
    const [dragX, setDragX] = React.useState(0); 
    const [startX, setStartX] = React.useState(0); 
    const [isDragging, setIsDragging] = React.useState(false);
    const [btnFeedback, setBtnFeedback] = React.useState(null);
    const [isShuffleOn, setIsShuffleOn] = React.useState(false);

    const triggerConfetti = React.useCallback(() => { if (typeof confetti === 'undefined') return; const count = 200; const defaults = { origin: { y: 0.6 }, zIndex: 1500 }; function fire(particleRatio, opts) { confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) }); } fire(0.25, { spread: 26, startVelocity: 55 }); fire(0.2, { spread: 60 }); fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 }); fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 }); fire(0.1, { spread: 120, startVelocity: 45 }); }, []);
    React.useEffect(() => { if (isFinished && isOpen) { triggerConfetti(); } }, [isFinished, triggerConfetti]);
    const shuffleArray = React.useCallback((array) => { const newArr = [...array]; for (let i = newArr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [newArr[i], newArr[j]] = [newArr[j], newArr[i]]; } return newArr; }, []);
    const startNewSession = React.useCallback((chars) => { setQueue(chars); setCurrentIndex(0); setIsFlipped(false); setUnknownIndices([]); setKnownCount(0); setHistory([]); setIsFinished(false); setExitDirection(null); setDragX(0); setBtnFeedback(null); }, []);
    
    // --- Các useEffect cơ bản ---
    React.useEffect(() => { if (isOpen && text) { const chars = Array.from(text).filter(c => c.trim()); setOriginalQueue(chars); const queueToLoad = isShuffleOn ? shuffleArray(chars) : chars; startNewSession(queueToLoad); setShowHint(true); } }, [isOpen, text, startNewSession]); 
    React.useEffect(() => { if (isOpen) { const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth; document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'; document.body.style.paddingRight = `${scrollBarWidth}px`; document.body.style.touchAction = 'none'; } else { document.documentElement.style.overflow = ''; document.body.style.overflow = ''; document.body.style.paddingRight = ''; document.body.style.touchAction = ''; } return () => { document.documentElement.style.overflow = ''; document.body.style.overflow = ''; document.body.style.paddingRight = ''; document.body.style.touchAction = ''; }; }, [isOpen]);
    
    // --- Các hàm xử lý UI ---
    const toggleFlip = React.useCallback(() => { setIsFlipped(prev => !prev); if (currentIndex === 0) setShowHint(false); }, [currentIndex]);
    const handleNext = React.useCallback((isKnown) => { 
        if (exitDirection || isFinished || queue.length === 0) return; 
        
        // 1. Lấy chữ hiện tại
        const currentChar = queue[currentIndex];

        // 2. CHỤP LẠI DỮ LIỆU CŨ (SNAPSHOT) TRƯỚC KHI BỊ THAY ĐỔI
        // Nếu chưa có dữ liệu thì lưu object rỗng
        const snapshot = (srsData && srsData[currentChar]) ? { ...srsData[currentChar] } : {};

        setIsFlipped(false); 

        // Logic đếm số lượng (Giữ nguyên)
        if (isKnown) { 
            setKnownCount(prev => prev + 1); 
        } else { 
            setUnknownIndices(prev => [...prev, currentIndex]); 
        } 

        // 3. LƯU VÀO HISTORY (Lưu cả trạng thái đúng/sai VÀ bản chụp dữ liệu cũ)
        setHistory(prev => [...prev, { isKnown, char: currentChar, snapshot }]); 

        // Gọi hàm cập nhật dữ liệu mới (Giữ nguyên)
        setBtnFeedback(isKnown ? 'right' : 'left'); 
        setExitDirection(isKnown ? 'right' : 'left'); 
        
        setTimeout(() => { 
            setCurrentIndex((prevIndex) => { 
                if (prevIndex < queue.length - 1) { 
                    setExitDirection(null); 
                    setDragX(0); 
                    setBtnFeedback(null); 
                    return prevIndex + 1; 
                } else { 
                    setIsFinished(true); 
                    return prevIndex; 
                } 
            }); 
        }, 150); 
    }, [currentIndex, queue, exitDirection, isFinished, srsData]);
    const handleBack = (e) => { 
        if (e) { e.preventDefault(); e.stopPropagation(); e.currentTarget.blur(); } 
        
        if (currentIndex > 0 && history.length > 0) { 
            // 1. Lấy phần tử lịch sử cuối cùng (Bây giờ nó là object chứa snapshot)
            const lastItem = history[history.length - 1]; 
            
            // 2. Tính toán lại UI (Dựa vào lastItem.isKnown thay vì lastIsKnown)
            if (lastItem.isKnown === true) { 
                setKnownCount(prev => Math.max(0, prev - 1)); 
            } else { 
                setUnknownIndices(prev => prev.slice(0, -1)); 
            } 

            // 3. KHÔI PHỤC DỮ LIỆU SRS VỀ TRẠNG THÁI CŨ
            
            if (onSrsRestore && lastItem.char) {
                onSrsRestore(lastItem.char, lastItem.snapshot);
            }

            // 4. Cập nhật lại các state UI khác (Giữ nguyên)
            setHistory(prev => prev.slice(0, -1)); 
            setCurrentIndex(prev => prev - 1); 
            setIsFlipped(false); 
            setExitDirection(null); 
            setDragX(0); 
            setBtnFeedback(null); 
        } 
    };
    const handleToggleShuffle = (e) => { if (e) { e.preventDefault(); e.stopPropagation(); e.currentTarget.blur(); } const nextState = !isShuffleOn; setIsShuffleOn(nextState); setBtnFeedback('shuffle'); setTimeout(() => setBtnFeedback(null), 400); const passedPart = queue.slice(0, currentIndex); const remainingPart = queue.slice(currentIndex); if (remainingPart.length === 0) return; let newRemainingPart; if (nextState) { newRemainingPart = shuffleArray(remainingPart); } else { const counts = {}; remainingPart.forEach(c => { counts[c] = (counts[c] || 0) + 1; }); newRemainingPart = []; for (const char of originalQueue) { if (counts[char] > 0) { newRemainingPart.push(char); counts[char]--; } } } setQueue([...passedPart, ...newRemainingPart]); setIsFlipped(false); };
    
    // --- Các hàm Drag ---
    const handleDragStart = (e) => { if (exitDirection || isFinished) return; setIsDragging(true); const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX; setStartX(clientX); };
    const handleDragMove = (e) => { if (!isDragging || exitDirection) return; const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX; setDragX(clientX - startX); };
    const dynamicBorder = () => { if (dragX > 70 || btnFeedback === 'right') return '#22c55e'; if (dragX < -70 || btnFeedback === 'left') return '#ef4444'; return 'white'; };

    // --- SỬA LOGIC: PHÍM TẮT ---
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen || isFinished) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            switch (e.key) {
                case ' ': case 'ArrowUp': case 'ArrowDown':
                    e.preventDefault(); toggleFlip(); break;
                case 'ArrowLeft':
                    e.preventDefault();
                    // [LOGIC MỚI] Gọi hàm lưu dữ liệu: 0 = Đang học
                    if(onSrsUpdate) onSrsUpdate(queue[currentIndex], 0);
                    handleNext(false); 
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    // [LOGIC MỚI] Gọi hàm lưu dữ liệu: 1 = Đã biết
                    if(onSrsUpdate) onSrsUpdate(queue[currentIndex], 1);
                    handleNext(true); 
                    break;
                case 'Escape': onClose(); break;
                default: break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isFinished, toggleFlip, handleNext, onClose, onSrsUpdate, queue, currentIndex]);

    // --- SỬA LOGIC: VUỐT (DRAG) ---
    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (dragX > 70) {
             // [LOGIC MỚI] Kéo phải = Đã biết (1)
             if(onSrsUpdate) onSrsUpdate(queue[currentIndex], 1);
             handleNext(true);
        }
        else if (dragX < -70) {
             // [LOGIC MỚI] Kéo trái = Đang học (0)
             if(onSrsUpdate) onSrsUpdate(queue[currentIndex], 0);
             handleNext(false);
        }
        else setDragX(0);
    };

    if (!isOpen || queue.length === 0) return null;
    const currentChar = queue[currentIndex] || ''; 
    if (!currentChar && !isFinished && isOpen) { setIsFinished(true); }
    const info = dbData?.KANJI_DB?.[currentChar] || dbData?.ALPHABETS?.hiragana?.[currentChar] || dbData?.ALPHABETS?.katakana?.[currentChar] || {};
    const progressRatio = currentIndex / (queue.length - 1 || 1);

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-900/95 backdrop-blur-xl animate-in fade-in duration-200 select-none touch-none" style={{ touchAction: 'none' }} onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-sm flex flex-col items-center">
                {!isFinished ? (
                    <>
                        {/* --- PHẦN CARD (GIỮ NGUYÊN) --- */}
                        <div className={`relative transition-all duration-300 ease-in-out ${exitDirection === 'left' ? '-translate-x-16 -rotate-3' : exitDirection === 'right' ? 'translate-x-16 rotate-3' : ''}`} style={{ transform: !exitDirection && dragX !== 0 ? `translateX(${dragX}px) rotate(${dragX * 0.02}deg)` : '', transition: isDragging ? 'none' : 'all 0.25s ease-out' }}>
                            <div onClick={() => { if (Math.abs(dragX) < 5) toggleFlip(); }} onMouseDown={handleDragStart} onMouseMove={handleDragMove} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd} onTouchStart={handleDragStart} onTouchMove={handleDragMove} onTouchEnd={handleDragEnd} className={`relative w-64 h-80 cursor-pointer transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                                <div className="absolute inset-0 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center border-4 [backface-visibility:hidden] overflow-hidden" style={{ borderColor: dynamicBorder() }}>
                                    <span className="text-8xl font-['Klee_One'] text-gray-800 transform -translate-y-5">{currentChar}</span>
                                    {currentIndex === 0 && showHint && (<p className="absolute bottom-14 text-indigo-400 text-[7px] font-black uppercase tracking-[0.4em] animate-pulse">Chạm để lật</p>)}
                                    <div className={`absolute bottom-5 left-0 right-0 px-6 items-center z-50 ${isFlipped ? 'hidden sm:flex' : 'flex'} justify-between`}>
                                        <button onClick={handleBack} className={`p-2.5 bg-black/5 hover:bg-black/10 active:scale-90 rounded-full transition-all flex items-center justify-center ${currentIndex === 0 ? 'opacity-10 cursor-not-allowed' : 'text-gray-400 hover:text-gray-700'}`} disabled={currentIndex === 0}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="pointer-events-none"><path d="M9 14 4 9l5-5"/><path d="M4 9h12a5 5 0 0 1 0 10H7"/></svg>
                                        </button>
                                        <button onClick={handleToggleShuffle} className={`p-2.5 bg-black/5 hover:bg-black/10 active:scale-90 rounded-full transition-all flex items-center justify-center ${isShuffleOn ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-700'}`}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`pointer-events-none ${btnFeedback === 'shuffle' ? 'animate-[spin_0.4s_linear_infinite]' : ''}`}><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-indigo-600 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center p-6 text-white [backface-visibility:hidden] [transform:rotateY(180deg)] border-4 overflow-hidden text-center" style={{ borderColor: dynamicBorder() }}>
                                    <div className="flex-1 flex flex-col items-center justify-center w-full transform -translate-y-3">
                                        <h3 className="text-3xl font-black mb-2 uppercase tracking-tighter leading-tight">{info.sound || '---'}</h3>
                                        <p className="text-base opacity-90 font-medium italic leading-snug px-2">{info.meaning || ''}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* --- THANH TIẾN TRÌNH (GIỮ NGUYÊN) --- */}
                        <div className="w-64 mt-8 mb-6 relative h-6 flex items-center">
                            <div className="w-full h-1 bg-white/10 rounded-full relative overflow-hidden"><div className="absolute top-0 left-0 h-full bg-sky-400 transition-all duration-300 ease-out" style={{ width: `${progressRatio * 100}%` }} /></div>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full h-1 pointer-events-none"><div className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-9 rounded-md flex items-center justify-center bg-white shadow-sm z-0"><span className="text-[10px] font-black text-black leading-none">{queue.length}</span></div></div>
                            <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 pointer-events-none"><div className="absolute top-1/2 -translate-y-1/2 h-7 w-9 bg-sky-400 rounded-md flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.8)] transition-all duration-300 ease-out z-10" style={{ left: `calc(${progressRatio * 100}% - ${progressRatio * 36}px)` }}><span className="text-[10px] font-black text-white leading-none">{currentIndex + 1}</span></div></div>
                        </div>

                        {/* --- SỬA: NÚT ĐIỀU HƯỚNG (GẮN SỰ KIỆN LƯU) --- */}
                        <div className="flex gap-3 w-full px-8">
                            <button 
                                onClick={() => {
                                    // [LOGIC MỚI] Nút Đỏ = 0
                                    if(onSrsUpdate) onSrsUpdate(currentChar, 0); 
                                    handleNext(false);
                                }} 
                                className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 hover:text-red-600 active:bg-red-500 text-red-500 active:text-white border border-red-500/20 rounded-xl font-black text-[10px] transition-all flex items-center justify-center gap-2 uppercase"
                            >
                                ĐANG HỌC <span className="bg-red-600 text-white min-w-[28px] h-6 px-2 rounded-md flex items-center justify-center text-[10px] font-bold shadow-sm">{unknownIndices.length}</span>
                            </button>
                            <button 
                                onClick={() => {
                                    // [LOGIC MỚI] Nút Xanh = 1
                                    if(onSrsUpdate) onSrsUpdate(currentChar, 1); 
                                    handleNext(true);
                                }} 
                                className="flex-1 py-3 bg-green-500/10 hover:bg-green-500/20 hover:text-green-600 active:bg-green-500 text-green-500 active:text-white border border-green-500/20 rounded-xl font-black text-[10px] transition-all flex items-center justify-center gap-2 uppercase"
                            >
                                ĐÃ BIẾT <span className="bg-green-600 text-white min-w-[28px] h-6 px-2 rounded-md flex items-center justify-center text-[10px] font-bold shadow-sm">{knownCount}</span>
                            </button>
                        </div>

                        <button onClick={onClose} className="mt-8 text-white/40 hover:text-red-500 transition-all text-[13px] sm:text-[11px] font-black uppercase tracking-[0.2em] py-2 px-4 active:scale-95">Đóng thẻ</button>
                    </>
                ) : (
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-[280px] text-center shadow-2xl border-4 border-indigo-50 animate-in zoom-in-95">
                        <div className="text-5xl mb-4 animate-bounce cursor-pointer hover:scale-125 transition-transform" onClick={triggerConfetti} title="Bấm để bắn pháo hoa!">🎉</div>
                        <h3 className="text-lg font-black text-gray-800 mb-1 uppercase">Hoàn thành</h3>
                        <p className="text-gray-400 mb-6 text-[11px] font-medium italic">Bạn đã học được {knownCount}/{queue.length} chữ.</p>
                        <div className="space-y-2">
                            {unknownIndices.length > 0 && (<button onClick={() => startNewSession(isShuffleOn ? shuffleArray(unknownIndices.map(idx => queue[idx])) : unknownIndices.map(idx => queue[idx]))} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[11px] shadow-lg active:scale-95 transition-colors">ÔN LẠI {unknownIndices.length} THẺ ĐANG HỌC</button>)}
                            <button onClick={() => startNewSession(isShuffleOn ? shuffleArray(originalQueue) : originalQueue)} className="w-full py-3.5 bg-blue-50 border-2 border-blue-100 text-blue-500 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 rounded-xl font-black text-[11px] transition-all active:scale-95">HỌC LẠI TỪ ĐẦU</button>
                            <button onClick={onClose} className="w-full py-3.5 bg-white border-2 border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-600 font-black text-[11px] uppercase tracking-widest rounded-xl transition-all active:scale-95">THOÁT</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
