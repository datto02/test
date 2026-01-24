   const App = () => {
const [isCafeModalOpen, setIsCafeModalOpen] = useState(false);
const [showMobilePreview, setShowMobilePreview] = useState(false);
const [isConfigOpen, setIsConfigOpen] = React.useState(false);
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
        const [isReviewListOpen, setIsReviewListOpen] = useState(false);
        const [srsData, setSrsData] = useState(() => {
    // Tự động lấy dữ liệu cũ từ máy người dùng khi mở web
    const saved = localStorage.getItem('phadao_srs_data');
            
    return saved ? JSON.parse(saved) : {};
});

// Hàm để lưu kết quả học tập
const updateSRSProgress = (char, quality) => {
    const newProgress = calculateSRS(srsData[char], quality);
    const newData = { ...srsData, [char]: newProgress };
    setSrsData(newData);
    localStorage.setItem('phadao_srs_data', JSON.stringify(newData));
};
const handleResetAllSRS = () => {
    setSrsData({}); // Xóa sạch state
    localStorage.removeItem('phadao_srs_data'); // Xóa sạch trong bộ nhớ máy
};
// State cấu hình mặc định
const [config, setConfig] = useState({ 
    text: '', fontSize: 33, traceCount: 9, verticalOffset: -3, 
    traceOpacity: 0.15, guideScale: 1.02, guideX: 0, guideY: 0.5, 
    gridOpacity: 0.8, gridType: 'cross', 
    fontFamily: "'Klee One', 'UD Digi Kyokasho N-R', 'UD Digi Kyokasho', 'UD デジタル 教科書体 N-R', 'UD デジタル 教科書体', cursive",
    showOnKun: false 
});

const [showPostPrintDonate, setShowPostPrintDonate] = useState(false);

// --- PHẦN MỚI: State chứa dữ liệu tải về ---
const [dbData, setDbData] = useState(null);
const [isDbLoaded, setIsDbLoaded] = useState(false);

// 1. Dùng useEffect để tải dữ liệu ngay khi mở web
useEffect(() => {
    fetchDataFromGithub().then(data => {
        if (data) {
            setDbData(data);      // Lưu dữ liệu vào state
            setIsDbLoaded(true); // Báo hiệu đã tải xong
        }
    });
}, []);

// 2. Logic xử lý cuộn trang khi hiện popup (giữ nguyên)
useEffect(() => {
    if (showPostPrintDonate) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
}, [showPostPrintDonate]);

/*useEffect(() => {
    if (!config.text || config.text.trim().length === 0) setShowMobilePreview(false);
}, [config.text]); */
// ------------------------------

// 3. Logic phân trang (giữ nguyên)
const pages = useMemo(() => {
    const contentToShow = (config.text && config.text.trim().length > 0) ? config.text : "日本語"; 
    const chars = Array.from(contentToShow).filter(c => c.trim().length > 0);
    const chunks = [];
    const ROWS_PER_PAGE = 10;
    for (let i = 0; i < chars.length; i += ROWS_PER_PAGE) { chunks.push(chars.slice(i, i + ROWS_PER_PAGE)); }
    if (chunks.length === 0) return [[]];
    return chunks;
}, [config.text]);

// 4. Logic in ấn (giữ nguyên)
const handlePrint = () => {
    const handleAfterPrint = () => { setShowPostPrintDonate(true); window.removeEventListener("afterprint", handleAfterPrint); };
    window.addEventListener("afterprint", handleAfterPrint);
    window.print();
};

// --- MÀN HÌNH CHỜ (LOADING) ---
// Nếu dữ liệu chưa tải xong, hiện màn hình xoay vòng tròn
if (!isDbLoaded) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold animate-pulse">Đang tải dữ liệu Kanji...</p>
        </div>
    );
}

// --- GIAO DIỆN CHÍNH (Khi đã có dữ liệu) ---
return (
    <div className="min-h-screen flex flex-col md:flex-row print-layout-reset">
    <div className="no-print z-50">
    <Sidebar 
        config={config} onChange={setConfig} onPrint={handlePrint} 
        isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen}
        isConfigOpen={isConfigOpen} setIsConfigOpen={setIsConfigOpen}
        isCafeModalOpen={isCafeModalOpen} setIsCafeModalOpen={setIsCafeModalOpen} 
        showMobilePreview={showMobilePreview} setShowMobilePreview={setShowMobilePreview}
        setIsFlashcardOpen={setIsFlashcardOpen}
        
        dbData={dbData} // <--- QUAN TRỌNG: Truyền dữ liệu xuống Sidebar
            srsData={srsData}
         onOpenReviewList={() => setIsReviewListOpen(true)}
      
    />
    </div>

    <div id="preview-area" className={`flex-1 bg-gray-100 p-0 md:p-8 overflow-auto flex-col items-center min-h-screen print-layout-reset custom-scrollbar ${showMobilePreview ? 'flex' : 'hidden md:flex'}`}>
    {pages.map((pageChars, index) => (
        <Page 
        key={index} 
        chars={pageChars} 
        config={config} 
        
        dbData={dbData} // <--- QUAN TRỌNG: Truyền dữ liệu xuống page 
        /> 
    ))}
    </div>

    {/* Popup Donate  */}
    {showPostPrintDonate && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300 no-print">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in zoom-in-95 duration-300 border border-orange-100">
        <button onClick={() => setShowPostPrintDonate(false)} className="absolute top-3 right-3 p-1.5 bg-gray-100 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors z-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div className="p-6 flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">BẠN TẠO ĐƯỢC FILE CHƯA?</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">Nếu bạn thấy trang web hữu ích <br/> hãy mời mình một ly cafe nhé!</p>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-xl shadow-inner border border-orange-200 mb-4">
            <img src="https://i.ibb.co/JWGwcTL1/3381513652021492183.jpg" alt="QR Donate" className="w-40 h-auto rounded-lg mix-blend-multiply" />
            </div>
            <p className="text-[11px] font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full mb-4">MB BANK: 99931082002</p>
            <button onClick={() => setShowPostPrintDonate(false)} className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95">Lần sau nhé!</button>
        </div>
        </div>
    </div>
    )}
        
<FlashcardModal 
    isOpen={isFlashcardOpen} 
    onClose={() => setIsFlashcardOpen(false)} 
    text={config.text} 
    dbData={dbData} 
    onSrsUpdate={updateSRSProgress}
    srsData={srsData} 
    onSrsRestore={(char, oldData) => {
        // Hàm này sẽ đè dữ liệu cũ (snapshot) lên dữ liệu hiện tại
        const newData = { ...srsData, [char]: oldData };
        setSrsData(newData);
        localStorage.setItem('phadao_srs_data', JSON.stringify(newData));
    }}
/>
       {/* 3. RENDER MODAL MỚI */}
            <ReviewListModal 
                isOpen={isReviewListOpen}
                onClose={() => setIsReviewListOpen(false)}
                srsData={srsData}
                onResetSRS={handleResetAllSRS}
            />
        </div>
);
};
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
