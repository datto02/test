const KanjiAnimationModal = ({ char, paths, fullSvg, dbData, isOpen, onClose }) => {
const [key, setKey] = useState(0); 
const [strokeNumbers, setStrokeNumbers] = useState([]); 
const [speedConfig, setSpeedConfig] = useState({ duration: 3, delay: 0.6 });
const initialDelay = 0.4;
const [activeSpeed, setActiveSpeed] = useState('normal'); 

// Logic khóa cuộn
useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
}, [isOpen]);

// Logic lấy số thứ tự
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

// Logic lấy dữ liệu thông minh
let info = {};
if (dbData?.KANJI_DB?.[char]) info = dbData.KANJI_DB[char];
else if (dbData?.ALPHABETS?.hiragana?.[char]) info = dbData.ALPHABETS.hiragana[char];
else if (dbData?.ALPHABETS?.katakana?.[char]) info = dbData.ALPHABETS.katakana[char];

return (
    <div 
        
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
        onClick={onClose} 
    >
        <div 
            
            className="bg-white rounded-2xl shadow-2xl p-5 w-[90%] max-w-sm flex flex-col items-center relative animate-in zoom-in-95 duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()} 
        >
            <button 
                onClick={onClose}
                className="absolute top-3 right-3 p-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full transition-colors z-10"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="flex items-center justify-center gap-5 mb-3 mt-2 w-full px-2">
                <h3 className="text-5xl font-black text-indigo-600 font-['Klee_One'] leading-none">
                    {char}
                </h3>
                <div className="flex flex-col items-start justify-center h-full pt-1">
                    {info.sound ? (
                        <>
                            <span className="text-xl font-black text-gray-800 uppercase font-sans tracking-wide leading-tight mb-0.5">
                                {info.sound}
                            </span>
                            {info.meaning && (
                                <span className="text-xs text-gray-500 font-medium font-sans italic leading-tight text-left">
                                    {info.meaning}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-xs text-gray-400 font-sans">---</span>
                    )}
                </div>
            </div>

            <div key={key} className="w-60 h-40 bg-white border border-indigo-50 rounded-xl relative mb-4 shadow-inner flex-shrink-0 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="50" y1="0" x2="50" y2="100" stroke="black" strokeWidth="0.5" strokeDasharray="4 4" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="black" strokeWidth="0.5" strokeDasharray="4 4" />
                </svg>

                <svg viewBox="0 0 109 109" className="h-full w-auto p-2">
                    {strokeNumbers.map((num, idx) => (
                        <text 
                            key={`num-${idx}`} 
                            transform={num.transform} 
                            className="stroke-number"
                            style={{ animationDelay: `${initialDelay + (idx * speedConfig.delay)}s` }} 
                        >
                            {num.value}
                        </text>
                    ))}
                    {paths.map((d, index) => (
                        <path 
                            key={`path-${index}`}
                            d={d} 
                            className="stroke-anim-path"
                            style={{ 
                                animationDuration: `${speedConfig.duration}s`, 
                                animationDelay: `${initialDelay + (index * speedConfig.delay)}s` 
                            }} 
                        />
                    ))}
                </svg>
            </div>

            <div className="flex justify-center gap-2 w-full px-2">
                <button 
                    onClick={() => handleReplay('slow')}
                    title="Tua chậm"
                    className={`py-2 px-3 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 ${activeSpeed === 'slow' ? 'bg-indigo-100 text-indigo-700 font-bold ring-1 ring-indigo-300' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200 shadow-sm'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
                    <span className="text-[10px] font-bold uppercase">Chậm</span>
                </button>

                <button 
                    onClick={() => handleReplay('normal')}
                    title="Vẽ lại"
                    className={`py-2 px-4 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 ${activeSpeed === 'normal' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                    <span className="text-[10px] font-bold uppercase">Vẽ lại</span>
                </button>

                <button 
                    onClick={() => handleReplay('fast')}
                    title="Tua nhanh"
                    className={`py-2 px-3 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 ${activeSpeed === 'fast' ? 'bg-indigo-100 text-indigo-700 font-bold ring-1 ring-indigo-300' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200 shadow-sm'}`}
                >
                    <span className="text-[10px] font-bold uppercase">Nhanh</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
                </button>
            </div>
        </div>
    </div>
);
};
const HeaderSection = ({ char, paths, loading, failed, config, dbData }) => {
const readings = useKanjiReadings(char, config.showOnKun, dbData);

if (loading) return <div className="h-[22px] w-full animate-pulse bg-gray-100 rounded mb-1"></div>;
if (failed) return <div className="h-[22px] w-full mb-1"></div>;


const info = dbData.KANJI_DB[char] || dbData.ALPHABETS.hiragana[char] || dbData.ALPHABETS.katakana[char];

const isJLPT = dbData.KANJI_LEVELS.N5.includes(char) || 
            dbData.KANJI_LEVELS.N4.includes(char) || 
            dbData.KANJI_LEVELS.N3.includes(char) || 
            dbData.KANJI_LEVELS.N2.includes(char) || 
            dbData.KANJI_LEVELS.N1.includes(char);

return (
<div 
    className="flex flex-row items-end px-1 mb-1 h-[22px] overflow-hidden border-b border-transparent"
    style={{ width: '184mm', minWidth: '184mm', maxWidth: '184mm' }}
>
    {/* 1. ÂM HÁN VIỆT + NGHĨA (Luôn hiện nếu có dữ liệu) */}
    {info && (
    <div className="flex-shrink-0 mr-4 flex items-baseline gap-2 mb-[3px]">
        <span className="font-bold text-sm leading-none text-black whitespace-nowrap uppercase">
        {info.sound}
        </span>
        {info.meaning && info.meaning.trim() !== "" && (
        <span className="text-[12px] font-normal text-black leading-none whitespace-nowrap">
            ({info.meaning})
        </span>
        )}
    </div>
    )}

    {/* 2. PHẦN LOGIC THAY ĐỔI THEO NÚT GẠT */}
    <div className="flex-1 min-w-0 h-[22px]"> 
    {(() => {
        // TRƯỜNG HỢP 1: Nếu nút gạt đang TẮT (Mặc định)
        // Hiện thứ tự nét vẽ cho TẤT CẢ các chữ (Kanji, Kana...)
        if (!config.showOnKun) {
        return (
            <div className="h-full flex items-center flex-wrap gap-1">
            {paths.map((_, i) => (
                <div key={i} className="w-[22px] h-[22px] flex-shrink-0">
                <svg viewBox="0 0 109 109" className="decomp-svg">
                    {paths.slice(0, i + 1).map((d, pIndex) => (
                    <path key={pIndex} d={d} />
                    ))}
                </svg>
                </div>
            ))}
            </div>
        );
        }

        // TRƯỜNG HỢP 2: Nếu nút gạt đang BẬT
        // A. Nếu là Kanji thuộc N1-N5: Hiện âm On/Kun
        if (isJLPT) {
        return (
            <div className="h-full flex items-end pb-[3px] text-[12px] text-black italic w-full leading-none whitespace-nowrap">
            <div className="truncate w-full">
            <span className="font-bold text-black mr-1 uppercase">On:</span>
            <span className="mr-3 not-italic font-medium">{readings.on || '---'}</span>
            <span className="font-bold text-black mr-1 uppercase">Kun:</span>
            <span className="not-italic font-medium">{readings.kun || '---'}</span>
            </div>
            </div>
        );
        }

        // B. Nếu KHÔNG phải Kanji N1-N5 (Hiragana, Katakana, chữ khác): Ẩn hoàn toàn nét vẽ
        return null;
    })()}
    </div>
</div>
);
};
const GridBox = ({ char, type, config, index, svgData, failed, onClick }) => {
const isReference = type === 'reference';
const showTrace = index < config.traceCount;
const { gridType, gridOpacity } = config; 

const gridColor = `rgba(0, 0, 0, ${gridOpacity})`;

const refStyle = isReference ? {
    '--guide-scale': config.guideScale,
    '--guide-x': `${config.guideX}px`,
    '--guide-y': `${config.guideY}px`
} : {};

return (
    <div 
    
    className={`relative w-[16mm] h-[16mm] border-r border-b box-border flex justify-center items-center overflow-hidden bg-transparent ${isReference ? 'reference-box cursor-pointer hover:bg-indigo-50 transition-colors duration-200' : ''}`}
    style={{ borderColor: gridColor }}
    onClick={isReference ? onClick : undefined} 
    title={isReference ? "Bấm để xem cách viết" : ""}
    >
    
    <div className="absolute inset-0 pointer-events-none z-0">
        {gridType !== 'blank' && (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="50" y1="0" x2="50" y2="100" stroke="black" strokeOpacity={gridOpacity} strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="black" strokeOpacity={gridOpacity} strokeWidth="0.5" strokeDasharray="4 4" />
        </svg>
        )}
    </div>

    {char && (
        <>
        {isReference && (
            <div className="relative z-20 w-full h-full flex items-center justify-center p-[1px]">
                {!failed && svgData ? (
                <div className="ref-wrapper" style={refStyle} dangerouslySetInnerHTML={{ __html: svgData }} />
                ) : (
                <span className="kanji-trace !text-black flex justify-center items-center h-full w-full"
                    style={{ fontSize: `${config.fontSize}pt`, color: 'black', transform: `translateY(${config.verticalOffset}px)`, textShadow: 'none', webkitTextStroke: '0' }}>
                    {char}
                </span>
                )}
                
                {/* Icon bàn tay gợi ý (ẩn đi vì đã có hiệu ứng đổi màu chữ làm tín hiệu) */}
                <div className="absolute bottom-0.5 right-0.5 opacity-0 hover:opacity-0 text-indigo-400 pointer-events-none transition-opacity">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                </div>
            </div>
        )}

        {!isReference && showTrace && (
            <span className="kanji-trace"
            style={{
                fontSize: `${config.fontSize}pt`,
                transform: `translateY(${config.verticalOffset}px)`,
                color: `rgba(0, 0, 0, ${config.traceOpacity})`,
                //fontFamily: config.fontFamily
            }}
            >
            {char}
            </span>
        )}
        </>
    )}
    </div>
);
};

   const WorkbookRow = ({ char, config, dbData }) => {
    const { loading, paths, fullSvg, failed } = useKanjiSvg(char);
    const boxes = Array.from({ length: 12 }, (_, i) => i);
    const gridBorderColor = `rgba(0, 0, 0, ${config.gridOpacity})`;
    
    const [isAnimOpen, setIsAnimOpen] = useState(false);

    return (
        <div className="flex flex-col w-full px-[8mm]">
            <HeaderSection 
                char={char} 
                paths={paths} 
                loading={loading} 
                failed={failed} 
                config={config} 
                dbData={dbData}
            />
        
            <div className="flex border-l border-t w-fit" style={{ borderColor: gridBorderColor }}>
                {boxes.map((i) => (
                <GridBox
                    key={i}
                    index={i}
                    char={char}
                    type={i === 0 ? 'reference' : 'trace'}
                    config={config}
                    svgData={fullSvg}
                    failed={failed}
                    onClick={i === 0 ? () => setIsAnimOpen(true) : undefined}
                />
                ))}
            </div>

            {/* Modal nhận thêm fullSvg và dbData */}
            <KanjiAnimationModal 
                char={char}
                paths={paths}
                fullSvg={fullSvg}  // <-- Truyền chuỗi SVG gốc để lấy số
                dbData={dbData}    // <-- Truyền data để lấy Âm/Nghĩa
                isOpen={isAnimOpen}
                onClose={() => setIsAnimOpen(false)}
            />
        </div>
    );
};
    const Page = ({ chars, config, dbData }) => {
// 1. Hàm Xuất dữ liệu (Tải file về máy)
    const handlePageExport = () => {
        const data = localStorage.getItem('phadao_srs_data');
        if (!data || data === '{}') {
            alert("Bạn chưa có dữ liệu học tập nào để sao lưu!");
            return;
        }
        // Tạo file JSON và kích hoạt tải về
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const date = new Date();
        const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        const fileName = `backup_tiengnhat_${dateStr}.json`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // 2. Hàm Nhập dữ liệu (Tải file lên)
    const handlePageImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target.result;
                JSON.parse(json); // Kiểm tra xem file có lỗi không
                
                // Hỏi xác nhận lần cuối
                if (confirm("⚠️ CẢNH BÁO:\nDữ liệu hiện tại trên máy này sẽ bị thay thế hoàn toàn bởi file bạn vừa chọn.\nBạn có chắc chắn muốn khôi phục không?")) {
                    localStorage.setItem('phadao_srs_data', json);
                    alert("Khôi phục thành công! Trang web sẽ tải lại.");
                    window.location.reload();
                }
            } catch (err) {
                alert("File lỗi! Vui lòng chọn đúng file .json đã sao lưu trước đó.");
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset để chọn lại file cũ vẫn nhận
    };
        
    // Kiểm tra xem có phải đang ở chế độ bản mẫu (không có text) hay không
    const isSample = !config.text || config.text.trim().length === 0;

    return (
        <div className="a4-page mx-auto relative flex flex-col pt-[15mm] pl-[3mm] bg-white">
        
        {/* --- PHẦN TIÊU ĐỀ BẢN MẪU (CHỈ HIỆN KHI TRỐNG) --- */}
        {isSample && (
            <div className="w-full max-w-[210mm] mb-6 text-left pl-[8mm]">
                <h2 className="text-xl font-black text-gray-600 uppercase mb-3 font-sans tracking-wide">
                    HƯỚNG DẪN
                </h2>
                <div className="text-sm text-gray-500 font-medium space-y-1.5 font-sans">
                   <p className="flex items-center gap-2">
                        <span className="bg-gray-100 text-gray-600 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold">1</span>
                        <span><span className="font-bold">Nhập dữ liệu</span> để tạo file luyện viết.</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <span className="bg-gray-100 text-gray-600 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold">2</span>
                        <span>Ấn vào <span className="font-bold">chữ mẫu đầu tiên</span> để xem họa hoạt cách viết.</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <span className="bg-gray-100 text-gray-600 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold">3</span>
                        <span>Tạo nhanh <span className="font-bold">Flashcard</span> trong phần "tiện ích".</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <span className="bg-gray-100 text-gray-600 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold">4</span>
                        <span>Chế độ <span className="font-bold">ÔN TẬP THÔNG MINH</span> (lặp lại ngắt quãng) được tích hợp vào Flashcard.</span>
                    </p>
                </div>
            </div>
        )}

        {/* DANH SÁCH CÁC DÒNG */}
        <div className="flex flex-col gap-[4mm]">
            {chars.map((char, index) => (
            <WorkbookRow
                key={`${index}-${char}`}
                char={char}
                config={config}
                dbData={dbData}
            />
            ))}
        </div>

        {/* Branding Footer */}
        <div className="absolute bottom-[5mm] left-[12.5mm] text-gray-600 text-xs font-sans">
            {/* Dòng 1 */}
            <div className="text-[10px]">
                © Bản quyền thuộc <span className="font-bold text-gray-700">Phá Đảo Tiếng Nhật</span> 
                <span> (<span className="font-bold italic text-gray-700">phadaotiengnhat.com</span>)</span>
            </div>
            
            {/* Dòng 2 */}
            <div className="text-[10px] mt-0.5">
                Tài liệu miễn phí - Nghiêm cấm mọi hành vi mua bán thương mại
            </div>
        </div>
        </div>
    );
    };
  
  
