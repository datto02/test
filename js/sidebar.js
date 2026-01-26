const Sidebar = ({ config, onChange, onPrint, srsData, isMenuOpen, setIsMenuOpen, isConfigOpen, setIsConfigOpen, isCafeModalOpen, setIsCafeModalOpen, showMobilePreview, setShowMobilePreview, dbData, setIsFlashcardOpen, onOpenReviewList }) => {
   

// 1. Logic bộ lọc mới
const dueChars = useMemo(() => {
    const now = Date.now();
    return Object.keys(srsData || {}).filter(char => {
        const data = srsData[char];
        // Điều kiện: Chưa hoàn thành VÀ (Là chữ đang học HOẶC Đã đến giờ ôn)
        return !data.isDone && data.nextReview !== null && (data.nextReview === 0 || data.nextReview <= now);
    });
}, [srsData]);

// 2. Hàm Load bài mới (Load xong mở ngay)
const handleLoadDueCards = () => {
    if (dueChars.length === 0) return;
    const dueText = dueChars.join('');
    onChange({ ...config, text: dueText }); 
    setTimeout(() => { setIsFlashcardOpen(true); }, 50); 
};
        
        const scrollRef = useRef(null);
    const [searchResults, setSearchResults] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0); 
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
    
    // --- CHẶN TUYỆT ĐỐI CTRL + P (KHÔNG CÓ GÌ XẢY RA) ---
    useEffect(() => {
    const handleKeyDown = (e) => {
        // Kiểm tra Ctrl + P (Win) hoặc Command + P (Mac)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault(); // Chặn trình duyệt mở bảng in
        e.stopPropagation(); // Chặn sự kiện lan truyền
        return false; // Kết thúc ngay lập tức, không làm gì cả
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
// --- CHẶN CUỘN TRANG KHI MỞ MODAL ---
useEffect(() => {
// Nếu khung In hoặc khung Tài liệu đang mở
if (isPrintModalOpen || isDocsModalOpen) {
    document.body.style.overflow = 'hidden'; // Khóa cuộn
} else {
    document.body.style.overflow = 'unset';  // Mở lại cuộn bình thường
}
// Dọn dẹp khi tắt
return () => { document.body.style.overflow = 'unset'; };
}, [isPrintModalOpen, isDocsModalOpen]);


    useEffect(() => {
if (scrollRef.current) {
    const activeItem = scrollRef.current.childNodes[activeIndex];
    if (activeItem) {
        // Tự động cuộn đến mục đang chọn (block: 'nearest' để mượt hơn)
        activeItem.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }
}
}, [activeIndex]); // Chạy lại mỗi khi activeIndex thay đổi

    // --- STATE QUẢN LÝ ---
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    // --- HÀM KIỂM TRA CẤP ĐỘ JLPT ---
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

    
    // Menu Popup & Ref
    const [isUtilsOpen, setIsUtilsOpen] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const filterRef = useRef(null);
    const quickMenuRef = useRef(null); // THÊM: Ref cho menu Chọn nhanh
    const utilsMenuRef = useRef(null); // THÊM: Ref cho menu Tiện ích
    const cafeModalRef = useRef(null);
    const searchInputRef = useRef(null); // Tạo "địa chỉ" cho ô nhập liệu
    const configMenuRef = useRef(null);
    // Biến kiểm soát bộ gõ IME (Quan trọng)
    const isComposing = useRef(false);

    const [randomCount, setRandomCount] = useState(10); 

    // State hiển thị nội bộ
    const [localText, setLocalText] = useState(config.text);

    // Tùy chọn bộ lọc
    const [filterOptions, setFilterOptions] = useState({
        hiragana: true,
        katakana: true,
        kanji: true,
        removeDuplicates: false 
    });

    // --- HÀM TẠO PLACEHOLDER ---
    const getDynamicPlaceholder = () => {
        const labels = [];
        if (filterOptions.kanji) labels.push("漢字");        
        if (filterOptions.hiragana) labels.push("ひらがな"); 
        if (filterOptions.katakana) labels.push("カタカナ"); 
        
        if (labels.length === 0) return "Vui lòng chọn ít nhất 1 loại chữ...";
        return labels.join(", ");
    };

    // --- 1. CLICK RA NGOÀI ĐỂ ĐÓNG MENU ---
    // --- XỬ LÝ CLICK RA NGOÀI ĐỂ ĐÓNG MENU ---
useEffect(() => {
function handleClickOutside(event) {
    // 1. Xử lý Bộ lọc (Filter)
    if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterMenuOpen(false);
    }

    // 2. Xử lý "Chọn nhanh" (Quick Select) - Tự đóng khi click ra ngoài
    if (isMenuOpen && quickMenuRef.current && !quickMenuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
    }

    // 3. Xử lý "Tiện ích" (Utils) - Tự đóng khi click ra ngoài
    if (isUtilsOpen && utilsMenuRef.current && !utilsMenuRef.current.contains(event.target)) {
        setIsUtilsOpen(false);
    }
    if (isCafeModalOpen && cafeModalRef.current && !cafeModalRef.current.contains(event.target)) {
        setIsCafeModalOpen(false);
    }
    // 5. MỚI: Xử lý "Tùy chỉnh" - Tự đóng khi click ra ngoài
    if (isConfigOpen && configMenuRef.current && !configMenuRef.current.contains(event.target)) {
        setIsConfigOpen(false);
    }

}

document.addEventListener("mousedown", handleClickOutside);
return () => document.removeEventListener("mousedown", handleClickOutside);
}, [isMenuOpen, isUtilsOpen, isFilterMenuOpen, isCafeModalOpen, isConfigOpen]); // Thêm dependencies để cập nhật trạng thái mới nhất

    // --- 2. ĐỒNG BỘ DỮ LIỆU TỪ NGOÀI ---
    useEffect(() => {
        const currentClean = localText ? localText.replace(/[a-zA-Z]/g, '') : '';
        if (currentClean !== config.text) {
            setLocalText(config.text);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.text]);

    const handleChange = (key, value) => {
        onChange({ ...config, [key]: value });
    };

    const shuffleString = (str) => {
        const arr = [...str];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.join('');
    };

    // --- HÀM TRỢ GIÚP: REGEX (ĐÃ SỬA: Thêm dấu chấm Nhật) ---
    const getAllowedRegexString = (options, allowLatin = false) => {
        let ranges = "\\s"; 
        if (allowLatin) ranges += "a-zA-Z"; // Latinh luôn được phép ở input

        if (options.hiragana) ranges += "\\u3040-\\u309F";
        if (options.katakana) ranges += "\\u30A0-\\u30FF";
        if (options.kanji)    ranges += "\\u4E00-\\u9FAF\\u3400-\\u4DBF\\u2E80-\\u2FDF\\uF900-\\uFAFF"; 
        
        // --- THÊM DÒNG NÀY: Cho phép dấu chấm Nhật ---
        ranges += "\\u3002"; 

        return ranges;
    };
    // --- HÀM TRỢ GIÚP: XÓA TRÙNG LẶP ---
        const getUniqueChars = (str) => {
            return Array.from(new Set(str)).join('');
            };

    // --- 3. XỬ LÝ CHECKBOX ---
    const handleFilterChange = (key) => {
        const newOptions = { ...filterOptions, [key]: !filterOptions[key] };
        setFilterOptions(newOptions);
        
        let newText = localText;

        // Xử lý các ô Hiragana/Katakana/Kanji (như cũ)
        if (['hiragana', 'katakana', 'kanji'].includes(key) && filterOptions[key] === true) {
            const allowedString = getAllowedRegexString(newOptions, true); 
            const regex = new RegExp(`[^${allowedString}]`, 'g');
            newText = newText.replace(regex, '');
        }

        // Xử lý ô Xóa trùng lặp (MỚI)
        if (newOptions.removeDuplicates) {
            newText = getUniqueChars(newText);
        }
        
        setLocalText(newText);
        handleChange('text', newText.replace(/[a-zA-Z]/g, ''));
    };

// --- 4. NÚT XÓA LATINH + DỒN DÒNG (PHIÊN BẢN XÓA SẠCH SÀNH SANH) ---
    const handleRemoveLatinManual = () => {
        if (!localText) return;
        let cleaned = localText;
        
        // 1. Xóa chữ cái Latinh
        cleaned = cleaned.replace(/[a-zA-Z]/g, '');
        
        // 2. Xóa hết dấu xuống dòng (Enter) -> Thay bằng rỗng ''
        cleaned = cleaned.replace(/[\n\r]+/g, '');
        
        // 3. Xóa hết các loại dấu cách (thường, tab, Nhật) -> Thay bằng rỗng ''
        // Regex này bao gồm: dấu cách thường ( ), dấu cách Nhật (　), và tab (\t)
        cleaned = cleaned.replace(/[ 　\t]+/g, ''); 
        
        // Cắt khoảng trắng thừa 2 đầu (nếu còn sót)
        cleaned = cleaned.trim();

        setLocalText(cleaned);
        handleChange('text', cleaned); 
    };

    // --- 5. XỬ LÝ NHẬP LIỆU (ĐÃ FIX LỖI IME) ---
    // --- 5. XỬ LÝ NHẬP LIỆU (REAL-TIME FILTER) ---
    const handleInputText = (e) => {
        const rawInput = e.target.value;

        // Nếu đang lơ lửng gõ bộ gõ (IME) thì cứ để hiện
        if (isComposing.current) {
            setLocalText(rawInput);
            return;
        }
        
        // 1. Lọc ký tự rác (số, icon...)
        const allowedString = getAllowedRegexString(filterOptions, true);
        const blockRegex = new RegExp(`[^${allowedString}]`, 'g');
        let validForInput = rawInput.replace(blockRegex, '');

        // 2. LOGIC QUAN TRỌNG: Lọc trùng ngay lập tức
        if (filterOptions.removeDuplicates) {
            validForInput = getUniqueChars(validForInput);
        }

        setLocalText(validForInput);
        handleChange('text', validForInput.replace(/[a-zA-Z]/g, ''));
    };

    const handleCompositionStart = () => {
        isComposing.current = true;
    };

    const handleCompositionEnd = (e) => {
        isComposing.current = false;
        
        // Lấy toàn bộ nội dung trong ô nhập lúc này
        const rawInput = e.target.value;
        
        // 1. Lọc rác
        const allowedString = getAllowedRegexString(filterOptions, true);
        const blockRegex = new RegExp(`[^${allowedString}]`, 'g');
        let validForInput = rawInput.replace(blockRegex, '');

        // 2. LOGIC QUAN TRỌNG: Lọc trùng ngay khi chốt chữ
        if (filterOptions.removeDuplicates) {
            validForInput = getUniqueChars(validForInput);
        }

        setLocalText(validForInput);
        handleChange('text', validForInput.replace(/[a-zA-Z]/g, ''));
    };
// Thêm tham số type (mặc định là 'kanji')
const handleLoadFromGithub = async (url, type = 'kanji') => {
setProgress(0);
setIsLoading(true);      
setIsMenuOpen(false);    

try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Lỗi tải dữ liệu từ ${url}`);
    }

    const rawText = await response.text();
    const cleanText = rawText.replace(/["\n\r\s,\[\]]/g, '');

    if (!cleanText) {
            alert("File dữ liệu rỗng!");
            setIsLoading(false);
            return;
    }

    
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
    // --- HÀM MỚI: Lấy ngẫu nhiên Kanji từ GitHub ---
    const handleRandomLoadFromGithub = async (level) => {
        // 1. Kiểm tra số lượng
        if (randomCount === '' || randomCount <= 0) {
            alert("Vui lòng nhập số lượng chữ cần lấy!");
            return;
        }
        setProgress(0);

        // 2. Tạo link file: kanjin5.json...
        const fileName = `kanji${level.toLowerCase()}.json`; 
        const url = `./data/${fileName}`;

        setIsLoading(true);
         // Đóng menu Tiện ích
        setIsMenuOpen(false)
        
        try {
            // 3. Tải file về
            const response = await fetch(url);
            if (!response.ok) throw new Error("Lỗi tải file");
            
            const rawText = await response.text();
            const cleanText = rawText.replace(/["\n\r\s]/g, '');

            if (!cleanText) {
                    alert("File dữ liệu rỗng!");
                    setIsLoading(false);
                    return;
            }

            // 4. Xáo trộn và cắt lấy số lượng cần thiết
            const shuffled = shuffleString(cleanText); // Hàm shuffleString có sẵn trong code cũ rồi
            let count = randomCount > 50 ? 50 : randomCount;
            const selectedChars = shuffled.slice(0, count);

            // 5. Hiển thị
            setFilterOptions(prev => ({ ...prev, kanji: true }));
            
            setProgress(30);
            setTimeout(() => setProgress(100), 300);

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
    // --- 6. XỬ LÝ RỜI TAY ---
    const handleBlurText = () => {
        if (!localText) return;
        let cleaned = localText; 
        cleaned = cleaned.replace(/[ \t]+/g, ' '); 
        cleaned = cleaned.replace(/(\n\s*){2,}/g, '\n'); 
        cleaned = cleaned.trim();

        if (filterOptions.removeDuplicates) {
            cleaned = getUniqueChars(cleaned);
        }

        if (cleaned !== localText) {
            setLocalText(cleaned);
            handleChange('text', cleaned.replace(/[a-zA-Z]/g, ''));
        }
    };

    // --- CÁC HÀM TIỆN ÍCH KHÁC ---
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

    // Hàm xử lý tìm kiếm thời gian thực
const handleSearchRealtime = (val) => {
setSearchTerm(val);
const query = val.toLowerCase().trim();
const queryNoAccent = removeAccents(query);

if (!query) {
    setSearchResults([]);
    return;
}

const matches = [];
const processData = (source, type) => {
    Object.entries(source).forEach(([char, info]) => {
        if (info.sound) {
            const sound = info.sound.toLowerCase();
            const soundNoAccent = removeAccents(sound);

            // Tính toán trọng số ưu tiên (Càng thấp càng đứng đầu)
            let priority = 99;

            if (sound === query) priority = 1; // 1. Khớp chính xác (An -> AN)
            else if (soundNoAccent === queryNoAccent) priority = 2; // 2. Khớp chính xác không dấu (An -> ÁN)
            else if (sound.includes(query)) priority = 3; // 3. Chứa vần chính xác (An -> SAN)
            else if (soundNoAccent.includes(queryNoAccent)) priority = 4; // 4. Chứa vần không dấu (An -> HÁN)

            if (priority < 99) {
                matches.push({ char, ...info, type, priority, sound });
            }
        }
    });
};

processData(dbData.KANJI_DB, 'kanji');

// Sắp xếp theo trọng số, nếu cùng trọng số thì xếp theo Alphabet
matches.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.sound.localeCompare(b.sound);
});

setSearchResults(matches.slice(0, 20));
setActiveIndex(0); // Reset về vị trí đầu tiên
};

    // --- HÀM CHỌN CHỮ TỪ GỢI Ý (ĐÃ FIX LỖI TRÙNG LẶP) ---
const selectResult = (item) => {
// 1. Tạo chuỗi mới bằng cách cộng chữ vừa chọn vào cuối
let newText = config.text + item.char;

// 2. KIỂM TRA: Nếu đang bật tính năng "Xóa trùng lặp" thì lọc chuỗi ngay
if (filterOptions.removeDuplicates) {
    newText = getUniqueChars(newText);
}

// 3. Cập nhật vào giao diện và dữ liệu hệ thống
setLocalText(newText);
handleChange('text', newText);

// 4. Reset ô tìm kiếm
setSearchTerm('');
setSearchResults([]);
setActiveIndex(0);

// 5. Tự động bật bộ lọc tương ứng 
if (item.type === 'kanji') setFilterOptions(p => ({...p, kanji: true}));
else if (item.char.match(/[\u3040-\u309F]/)) setFilterOptions(p => ({...p, hiragana: true}));
else setFilterOptions(p => ({...p, katakana: true}));
};
    
    const toggleMenu = (menuName) => {
        setIsCafeModalOpen(false); 
        setIsFilterMenuOpen(false); 
        if (menuName === 'quick') { setIsMenuOpen(!isMenuOpen); setIsUtilsOpen(false); setIsConfigOpen(false); }
        else if (menuName === 'utils') { setIsUtilsOpen(!isUtilsOpen); setIsMenuOpen(false); setIsConfigOpen(false); }
        else if (menuName === 'config') { setIsConfigOpen(!isConfigOpen); setIsMenuOpen(false); setIsUtilsOpen(false); }
    };

    // Check warning để đổi font placeholder
    const isWarningMode = !filterOptions.hiragana && !filterOptions.katakana && !filterOptions.kanji;

    return (
        <div className="w-full md:w-96 bg-white shadow-xl p-6 flex flex-col gap-6 h-auto md:h-screen md:overflow-y-auto relative md:sticky top-0 border-r border-gray-200 z-50 hide-scrollbar">
        
        {/* HEADER */}
        <div className="mb-4 pb-3 border-b border-gray-100"> 
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-1.5 mb-1">
            <span className="text-2xl leading-none -mt-1">⛩️</span>
            TẠO FILE LUYỆN VIẾT KANJI
            </h1>
        </div>

        <div className="space-y-6 flex-1">
            
        {/* TÌM KIẾM THÔNG MINH (BƯỚC 3) */}
<div className="space-y-1.5 pb-2 mb-2 relative">
<div className="flex gap-2">
<div className="relative flex-1">
{/* Icon Kính lúp (Bên trái) */}
<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
</div>

{/* Ô Input */}
<input 
    ref={searchInputRef}
    type="text" 
    value={searchTerm} 
    className="w-full pl-10 pr-10 py-2 border border-indigo-200 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50 text-indigo-900 placeholder-indigo-400 font-bold font-sans" 
    placeholder="Tìm Kanji theo âm Hán Việt" 
    onChange={(e) => handleSearchRealtime(e.target.value)} 
    onKeyDown={(e) => {
        if (searchResults.length > 0) {
            if (e.key === 'ArrowDown') { 
                e.preventDefault(); 
                setActiveIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0)); 
            } else if (e.key === 'ArrowUp') { 
                e.preventDefault(); 
                setActiveIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1)); 
            } else if (e.key === 'Enter') { 
                e.preventDefault(); 
                selectResult(searchResults[activeIndex]); 
            }
        }
    }}
/>

{/* NÚT X ĐỂ XÓA (MỚI THÊM) - Chỉ hiện khi đang có chữ */}
{searchTerm && (
    <button 
        onClick={() => {
            setSearchTerm('');    // Xóa chữ
            setSearchResults([]); // Đóng danh sách gợi ý
            searchInputRef.current.focus();
        }}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
        title="Xóa tìm kiếm"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
)}
</div>
</div>

{/* DROPDOWN KẾT QUẢ GỢI Ý - CHỈ HIỆN KHI CÓ KẾT QUẢ */}
{searchResults.length > 0 && (
    <div 
    ref={scrollRef}
    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[70] max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
{searchResults.map((item, idx) => {
const level = getJLPTLevel(item.char); // Kiểm tra cấp độ N1-N5

return (
    <div 
        key={idx} 
        onClick={() => selectResult(item)}
        className={`flex items-center gap-3 p-3 cursor-pointer border-b border-gray-50 last:border-none transition-colors group ${
            idx === activeIndex ? 'bg-indigo-100' : 'bg-white hover:bg-indigo-50'
        }`}
    >
        {/* Chữ hiển thị */}
        <span className="text-2xl font-['Klee_One'] text-black group-hover:scale-110 transition-transform">
            {item.char}
        </span>

        {/* Âm Hán và nghĩa */}
        <div className="flex flex-col">
            <span className="text-[11px] font-black text-indigo-600 uppercase leading-tight">
                {item.sound}
            </span>
            {item.meaning && (
                <span className="text-[10px] text-gray-400 font-medium leading-tight">
                    {item.meaning}
                </span>
            )}
        </div>

        {/* NHÃN MÁC (Badge) */}
        <div className="ml-auto">
            {level ? (
                /* Nếu thuộc danh sách Kanji N1-N5 */
                <div className={`px-1.5 py-0.5 rounded text-[9px] font-black border transition-all duration-200 ${levelColors[level]}`}>
                    {level}
                </div>
            ) : (
                /* Nếu KHÔNG thuộc N1-N5 -> Mặc định hiện mác BỘ THỦ */
                <div className="px-1.5 py-0.5 rounded text-[9px] font-black border bg-gray-100 text-gray-500 border-gray-200 uppercase transition-all duration-200 hover:bg-gray-500 hover:text-white hover:border-gray-500 cursor-default">
                    Bộ thủ
                </div>
            )}
        </div>
    </div>
);
})}
    </div>
)}

</div>

            {/* KHUNG NHẬP LIỆU */}
            <div className="space-y-2 pt-2">
                {/* --- TIÊU ĐỀ & CÁC NÚT (ĐÃ CHỈNH SỬA GIAO DIỆN) --- */}
                <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 font-sans">Nhập dữ liệu</label>
                
                {/* CỤM NÚT BỘ LỌC VÀ XÓA */}
                <div className="flex items-center gap-3 relative">
                    
                    {/* 1. NÚT MỞ BỘ LỌC */}
                    <div className="relative" ref={filterRef}>
                        <button 
                            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-colors ${isFilterMenuOpen ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-700'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                            BỘ LỌC
                        </button>

                        {/* POPUP MENU BỘ LỌC */}
                        {isFilterMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">BỘ LỌC</span>
                                    <div className="group relative cursor-help">
                                        <div className="text-gray-400 hover:text-indigo-500 border border-gray-300 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] font-serif font-bold bg-gray-50">i</div>
                                        {/* Tooltip chữ i */}
                                        <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-gray-900 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-[60]">
                                            1. Bỏ tích ô nào, chữ loại đó sẽ bị xóa ngay lập tức khỏi ô nhập liệu. <br/>
                                            2. "LÀM SẠCH" sẽ xóa hết chữ latinh, khoảng trắng thừa trong ô nhập liệu.
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-indigo-600 select-none">
                                        <input type="checkbox" checked={filterOptions.kanji} onChange={() => handleFilterChange('kanji')} className="accent-indigo-600 w-3.5 h-3.5 rounded-sm"/>
                                        Kanji & Bộ thủ
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-indigo-600 select-none">
                                        <input type="checkbox" checked={filterOptions.hiragana} onChange={() => handleFilterChange('hiragana')} className="accent-indigo-600 w-3.5 h-3.5 rounded-sm"/>
                                        Hiragana
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-indigo-600 select-none">
                                        <input type="checkbox" checked={filterOptions.katakana} onChange={() => handleFilterChange('katakana')} className="accent-indigo-600 w-3.5 h-3.5 rounded-sm"/>
                                        Katakana
                                    </label>
                                    {/* ĐƯỜNG KẺ MỜ NGĂN CÁCH (MỚI) */}
                                    <hr className="border-gray-100 my-1"/>

{/* TÙY CHỌN: XÓA TRÙNG LẶP (ĐỔI MÀU ĐỘNG) */}
<label className={`flex items-center gap-2 text-xs cursor-pointer select-none transition-colors ${
filterOptions.removeDuplicates 
    ? 'text-red-500 hover:text-red-600'  // Khi ĐANG TÍCH: Màu đỏ đậm
    : 'text-gray-700 hover:text-indigo-600'        // Khi KHÔNG TÍCH: Màu xám bình thường
}`}>
<input 
    type="checkbox" 
    checked={filterOptions.removeDuplicates} 
    onChange={() => handleFilterChange('removeDuplicates')} 
    className={`w-3.5 h-3.5 rounded-sm ${
        filterOptions.removeDuplicates ? 'accent-red-500' : 'accent-indigo-500'
    }`}
/>
Xóa chữ trùng lặp
</label>
                                    
                                    <hr className="border-gray-100"/>
                                    
{/* NÚT LÀM SẠCH  */}
<button 
onClick={handleRemoveLatinManual} 
className="w-full py-2 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg flex items-center justify-center gap-1 transition">
LÀM SẠCH
</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. NÚT XÓA TẤT CẢ */}
                    <button onClick={() => { setLocalText(''); handleChange('text', ''); }} className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-tighter">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> XÓA TẤT CẢ
                    </button>
                </div>
                </div>
                <textarea 
                className={`w-full h-[104px] p-3 pr-1 border border-gray-300 rounded-lg resize-none text-lg bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner input-scrollbar ${(isWarningMode && !localText) ? 'font-sans' : "font-['Klee_One']"}`}
                placeholder={getDynamicPlaceholder()} 
                value={localText} 
                onChange={handleInputText} 
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onBlur={handleBlurText}    
                />
            </div>
            
           {dueChars.length > 0 && (
    <div className="mb-6 animate-in slide-in-from-top duration-500">
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center animate-bounce shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 8 4 4-4 4"/><path d="M8 12h7"/><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10 10-4.48 10-10z"/></svg>
                </div>
                <div>
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Hệ thống nhắc nhở</p>
                    <p className="text-sm font-black text-orange-700">CẦN ÔN {dueChars.length} CHỮ!</p>
                </div>
            </div>
            
            {/* NÚT CHIA ĐÔI */}
            <div className="flex gap-2">
                <button onClick={handleLoadDueCards} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black rounded-xl transition-all shadow-md shadow-orange-200 active:scale-95 uppercase">
                    Ôn ngay
                </button>
                <button onClick={onOpenReviewList} className="flex-1 py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-600 text-[10px] font-black rounded-xl transition-all border border-orange-200 active:scale-95 uppercase">
                    danh sách
                </button>
            </div>
        </div>
    </div>
)}
            <div className="flex flex-col gap-3 w-full">
                
                {/* HÀNG 3 NÚT */}
                <div className="flex flex-row gap-4 w-full h-12">
                    
                    {/* 1. MENU CHỌN NHANH (Quick Select) */}
                 <div className="relative flex-1" ref={quickMenuRef}> 
                    <button onClick={() => toggleMenu('quick')} className={`w-full h-full px-1 border rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-[0.98] ${isMenuOpen ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                        <span className="font-bold text-xs whitespace-nowrap">CHỌN NHANH</span>
                    </button>
                    {isMenuOpen && (
                        <div className="absolute bottom-full left-0 mb-2 z-50 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            
                         {/* --- PHẦN GỘP: BẢNG CHỮ CÁI & BỘ THỦ --- */}
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 text-left">Bảng chữ cái & Bộ thủ</p>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {/* Nút 1: Hiragana */}
                                    <button 
                                        onClick={() => handleLoadFromGithub('./data/hiragana.json', 'hiragana')} 
                                        className="py-2 text-[11px] font-bold bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-black hover:text-white transition truncate"
                                        title="Hiragana"
                                    >
                                        あ Hira
                                    </button>

                                    {/* Nút 2: Katakana */}
                                    <button 
                                        onClick={() => handleLoadFromGithub('./data/katakana.json', 'katakana')} 
                                        className="py-2 text-[11px] font-bold bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-black hover:text-white transition truncate"
                                        title="Katakana"
                                    >
                                        ア Kata
                                    </button>

                                    {/* Nút 3: Bộ thủ */}
                                    <button 
                                        onClick={() => handleLoadFromGithub('./data/bothu.json')} 
                                        className="py-2 text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-600 hover:text-white transition truncate"
                                        title="Bộ thủ cơ bản"
                                    >
                                        Bộ thủ
                                    </button>
                                </div>
                            </div>

                           
                            {/* Lấy tất cả Kanji */}
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 text-left">Lấy tất cả Kanji</p>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => (
                                        <button 
                                            key={level} 
                                            onClick={() => { 
                                                const fileName = `kanji${level.toLowerCase()}.json`; 
                                                const url = `./data/${fileName}`; 
                                                handleLoadFromGithub(url); 
                                            }} 
                                            className={`py-2 text-[11px] font-black border rounded-md transition-all duration-200 active:scale-95 ${levelColors[level]}`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Lấy ngẫu nhiên (Đã chuyển xuống đây) */}
                            <div>
                                <div className="flex justify-start items-center gap-2 mb-2 mt-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Lấy ngẫu nhiên</p>
                                    {/* Input số lượng */}
                                    <div className="flex items-center gap-1.5">
                                        <input 
                                            type="number" 
                                            min="0" 
                                            max="50" 
                                            value={randomCount} 
                                            onChange={(e) => { 
                                                const val = e.target.value; 
                                                if (val === '') setRandomCount(''); 
                                                else setRandomCount(parseInt(val)); 
                                            }} 
                                            onKeyDown={(e) => { if (e.key === 'Enter' && randomCount > 50) setRandomCount(50) }} 
                                            onBlur={() => { if (randomCount > 50) setRandomCount(50) }} 
                                            className="w-10 h-6 text-[16px] text-center font-bold bg-gray-50 border border-gray-200 text-gray-700 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                        />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">chữ</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => (
                                        <button 
                                            key={`rand-${level}`} 
                                            onClick={() => handleRandomLoadFromGithub(level)} 
                                            className={`py-2 text-[11px] font-black border rounded-md transition-all duration-200 active:scale-95 ${levelColors[level]}`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                   {/* 2. MENU TIỆN ÍCH (Utilities) */}
<div className="relative flex-1" ref={utilsMenuRef}> 
                    <button onClick={() => toggleMenu('utils')} className={`w-full h-full px-1 border rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-[0.98] ${isUtilsOpen ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                        <span className="font-bold text-xs whitespace-nowrap">TIỆN ÍCH</span>
                    </button>
                    {isUtilsOpen && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            
                            {/* Công cụ Xáo trộn */}
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 text-left">Công cụ</p>
                                <button onClick={handleShuffleCurrent} className="w-full py-2.5 text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-600 hover:text-white transition flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                                    Xáo trộn danh sách hiện tại
                                </button>
                            </div>
{/* NÚT HỌC NGAY (GAME) */}
<div className="pt-0">
    <div className="flex items-center gap-2 mb-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">HỌC TẬP</p>
        <span className="flex-1 border-b border-gray-50"></span>
    </div>
    <button 
        onClick={() => {
            if (!config.text) return alert("Vui lòng nhập chữ để học!");
            setIsLearnGameOpen(true); // <--- Gọi hàm mở Modal ở đây
            setIsUtilsOpen(false);
        }}
        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 mb-2"
    >
        <span className="text-lg">🎮</span>
        <span className="text-xs font-black tracking-wide uppercase">HỌC (GAME)</span>
    </button>
</div>
                            {/* Tạo Flashcard */}
                            <div className="pt-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">ÔN TẬP</p>
                                    <span className="flex-1 border-b border-gray-50"></span>
                                </div>
                                <button 
                                    onClick={() => {
                                        if (!config.text) return alert("Vui lòng nhập chữ vào ô để học flashcard!");
                                        setIsFlashcardOpen(true);
                                        setIsUtilsOpen(false);
                                    }}
                                    className="w-full py-3 bg-[#4255ff] hover:bg-[#3243cc] text-white rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 group"
                                >
                                    <span className="bg-white p-0.5 rounded flex items-center justify-center group-hover:rotate-12 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4255ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                                    </span>
                                    <span className="text-xs font-black tracking-wide uppercase">Flashcard</span>
                                </button>
                            </div>

                            {/* Danh sách ôn tập (Màu Cam) */}
                            <div className="pt-0 mt-1">
                                <button 
                                    onClick={() => {
                                        onOpenReviewList();    
                                        setIsUtilsOpen(false); 
                                    }}
                                    className="w-full py-2.5 bg-orange-50 border border-orange-200 text-orange-600 hover:text-orange-700 hover:border-orange-300 hover:bg-orange-100 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 group shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                         className="text-orange-500 group-hover:text-orange-600 transition-colors"
                                    >
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                        <path d="M8 14h.01"></path>
                                        <path d="M12 14h.01"></path>
                                        <path d="M16 14h.01"></path>
                                        <path d="M8 18h.01"></path>
                                        <path d="M12 18h.01"></path>
                                        <path d="M16 18h.01"></path>
                                    </svg>
                                    <span className="text-xs font-bold uppercase tracking-wide">LỊCH TRÌNH ÔN TẬP</span>
                                </button>
                            </div>

                        </div>
                    )}
 </div>
                    {/* 3. TÙY CHỈNH */}
                    <div className="relative flex-1" ref={configMenuRef}> 
                    <button onClick={() => toggleMenu('config')} className={`w-full h-full px-1 border rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-[0.98] ${isConfigOpen ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                        <span className="font-bold text-xs whitespace-nowrap">TÙY CHỈNH</span>
                    </button>
                    
{isConfigOpen && (() => {
    // Kiểm tra xem có dấu chấm Nhật không
    const isVocabMode = config.text.includes('。');

    return (
        <div className="absolute bottom-full right-0 mb-2 z-50 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* THÔNG BÁO TỰ ĐỘNG */}
            {isVocabMode && (
                <div className="bg-orange-50 text-orange-600 text-[10px] font-bold p-2 rounded-lg mb-2 flex items-center gap-2 border border-orange-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>Đang ở chế độ Từ vựng (Phát hiện dấu 。)</span>
                </div>
            )}

            {/* MỤC 1: SỐ CHỮ MẪU (BỊ KHÓA KHI Ở CHẾ ĐỘ TỪ VỰNG) */}
            <div className={`space-y-1 transition-all duration-300 ${isVocabMode ? "opacity-30 pointer-events-none grayscale filter" : ""}`}>
                <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-gray-600">Số chữ mẫu</label>
                    <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-1.5 rounded">{config.traceCount} chữ</span>
                </div>
                <input type="range" min="0" max="12" step="1" className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={config.traceCount} onChange={(e) => handleChange('traceCount', parseInt(e.target.value))} />
            </div>

            {/* MỤC 2: ĐỘ ĐẬM CHỮ (VẪN CHO CHỈNH) */}
            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-gray-600">Độ đậm chữ</label>
                    <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-1.5 rounded">{Math.round(config.traceOpacity * 100)}%</span>
                </div>
                <input type="range" min="0.05" max="0.5" step="0.05" className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={config.traceOpacity} onChange={(e) => handleChange('traceOpacity', parseFloat(e.target.value))} />
            </div>

            {/* MỤC 3: CỠ CHỮ (VẪN CHO CHỈNH) */}
            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-gray-600">Cỡ chữ</label>
                    <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-1.5 rounded">{config.fontSize} pt</span>
                </div>
                <input type="range" min="30" max="40" step="1" className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={config.fontSize} onChange={(e) => handleChange('fontSize', parseInt(e.target.value))} />
            </div>

            {/* MỤC 4: ĐỘ ĐẬM KHUNG (VẪN CHO CHỈNH) */}
            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-gray-600">Độ đậm khung</label>
                    <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-1.5 rounded">{Math.round(config.gridOpacity * 100)}%</span>
                </div>
                <input type="range" min="0.1" max="1" step="0.1" className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={config.gridOpacity} onChange={(e) => handleChange('gridOpacity', parseFloat(e.target.value))} />
            </div>

            {/* MỤC 5: CHẾ ĐỘ HIỂN THỊ (BỊ KHÓA KHI Ở CHẾ ĐỘ TỪ VỰNG) */}
            <div className={`pt-0 transition-all duration-300 ${isVocabMode ? "opacity-30 pointer-events-none grayscale filter" : ""}`}> 
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <label className="flex items-center gap-1.5 cursor-pointer group select-none">
                            <input type="radio" name="display_mode" checked={config.displayMode === 'strokes'} onChange={() => handleChange('displayMode', 'strokes')} className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer" />
                            <span className={`text-[11px] font-bold transition-colors ${config.displayMode === 'strokes' ? 'text-indigo-700' : 'text-gray-500 group-hover:text-indigo-600'}`}>Nét viết</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer group select-none">
                            <input type="radio" name="display_mode" checked={config.displayMode === 'readings'} onChange={() => handleChange('displayMode', 'readings')} className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer" />
                            <span className={`text-[11px] font-bold transition-colors ${config.displayMode === 'readings' ? 'text-indigo-700' : 'text-gray-500 group-hover:text-indigo-600'}`}>On/Kun</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer group select-none">
                            <input type="radio" name="display_mode" checked={config.displayMode === 'vocab'} onChange={() => handleChange('displayMode', 'vocab')} className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer" />
                            <span className={`text-[11px] font-bold transition-colors ${config.displayMode === 'vocab' ? 'text-indigo-700' : 'text-gray-500 group-hover:text-indigo-600'}`}>Từ vựng</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* NÚT KHÔI PHỤC MẶC ĐỊNH */}
            <div className="pt-2 mt-1 border-t border-gray-200">
                <button 
                    onClick={() => onChange({ ...config, fontSize: 33, traceCount: 9, traceOpacity: 0.15, gridOpacity: 0.8, displayMode: 'strokes' })} 
                    className="w-full py-1.5 text-[10px] font-bold text-red-500 bg-red-50 md:hover:bg-red-500 md:hover:text-white active:bg-red-500 active:text-white rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> 
                    KHÔI PHỤC MẶC ĐỊNH
                </button>
            </div>
        </div>
    );
})()}
                    </div>
                </div>

{/* --- PHẦN CUỐI CỦA SIDEBAR (CẬP NHẬT THÊM NÚT TÀI LIỆU) --- */}
    <div className="w-full mt-auto pt-4 flex flex-col gap-4"> 
    
    {/* 1. NÚT IN (ĐÃ SỬA: CHẶN KHI RỖNG) */}
    <button 
        onClick={() => {
        // --- LOGIC KIỂM TRA MỚI ---
        if (!config.text || config.text.trim().length === 0) {
            alert("Vui lòng nhập nội dung để tạo file"); 
            return; // Dừng lại, không mở modal in
        }
        setIsPrintModalOpen(true); 
        }} 
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 group"
    >
        <svg className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg> 
        IN / LƯU PDF
    </button>

{/* --- 2. NÚT XEM TRƯỚC / XEM BẢN MẪU (MÀU: XANH KHI XEM, ĐỎ KHI ĐÓNG) --- */}
{(() => {
// Biến kiểm tra xem có nội dung hay không
const isEmpty = !config.text || config.text.trim().length === 0;

return (
    <button 
        onClick={() => {
            if (showMobilePreview) {
                setShowMobilePreview(false);
            } else {
                setShowMobilePreview(true);
                // Cuộn xuống vùng xem trước
                setTimeout(() => {
                    const previewElement = document.getElementById('preview-area');
                    if(previewElement) previewElement.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }}
        className={`md:hidden w-full py-3 font-bold rounded-xl border shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all mt-3 ${
            showMobilePreview 
                ? 'bg-red-50 text-red-700 border-red-200'      // KHI ĐANG MỞ -> MÀU ĐỎ
                : 'bg-green-50 text-green-700 border-green-200' // KHI ĐANG ĐÓNG -> MÀU XANH
        }`}
    >
        {showMobilePreview ? (
            // === TRẠNG THÁI: ĐANG MỞ (NÚT ĐỂ ĐÓNG LẠI) ===
            <>
                {isEmpty ? (
                    // Đóng bản mẫu: Giữ nguyên icon X
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                ) : (
                    // Đóng bản in: Dùng icon CON MẮT MỞ (Eye)
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                )}

                {isEmpty ? "ĐÓNG HƯỚNG DẪN" : "ĐÓNG BẢN XEM TRƯỚC"}
            </>
        ) : (
            // === TRẠNG THÁI: ĐANG ĐÓNG (NÚT ĐỂ MỞ RA) ===
            <>
                {isEmpty ? (
                    /* Xem bản mẫu: Giữ nguyên icon Quyển sách */
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        XEM HƯỚNG DẪN
                    </>
                ) : (
                    /* Xem trước bản in: Dùng icon CON MẮT GẠCH CHÉO (Eye Off) */
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                        XEM TRƯỚC BẢN IN
                    </>
                )}
            </>
        )}
    </button>
);
})()}

    {/* 2. KHU VỰC LIÊN HỆ (4 NÚT: DONATE - TIKTOK - NHÓM - TÀI LIỆU) */}
    <div className="flex items-center justify-between px-2 gap-2 text-xs font-bold text-gray-500 pb-2">
        
{/* Nút Donate */}
        <div className="relative flex flex-col items-center" ref={cafeModalRef}>
            <button 
                onClick={() => { setIsCafeModalOpen(!isCafeModalOpen); setIsMenuOpen(false); setIsUtilsOpen(false); setIsConfigOpen(false); setIsFilterMenuOpen(false); }} 
                className="flex flex-col items-center gap-1 group w-full"
            >
                {/* Icon Container: Cố định w-9 h-9 để tròn đều */}
                <div className="p-2 bg-orange-50 rounded-full text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
                        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
                        <line x1="6" y1="2" x2="6" y2="4"/>
                        <line x1="10" y1="2" x2="10" y2="4"/>
                        <line x1="14" y1="2" x2="14" y2="4"/>
                    </svg>
                </div>
                <span className="text-[10px] font-bold text-gray-500 group-hover:text-orange-600">Mời cafe</span>
            </button>

            {/* Popup Cafe */}
            {isCafeModalOpen && (
                <div className="absolute bottom-full left-0 mb-3 z-[60] w-60 bg-white border border-orange-100 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="text-center space-y-3">
                        <p className="text-[10px] text-orange-800 font-medium leading-tight">Sự ủng hộ của bạn giúp mình duy trì và phát triển nhiều tính năng mới. Cảm ơn bạn rất nhiều!</p>
                        <div className="bg-gray-50 p-2 rounded-lg inline-block shadow-inner">
                            <img src="https://i.ibb.co/JWGwcTL1/3381513652021492183.jpg" alt="QR Cafe" className="w-28 h-auto rounded"/>
                        </div>
                        <p className="text-[11px] text-orange-500 font-bold bg-orange-50 py-1 rounded">MB BANK: 99931082002</p>
                    </div>
                    {/* Mũi tên trỏ xuống của popup */}
                    <div className="absolute top-full left-4 -mt-1 w-3 h-3 bg-white border-b border-r border-orange-100 rotate-45"></div>
                </div>
            )}
        </div>
        {/* Nút Tiktok */}
        <a href="https://www.tiktok.com/@phadaotiengnhat" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 hover:text-black transition-colors group">
            <div className="p-2 bg-gray-100 rounded-full text-gray-600 group-hover:bg-black group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
            </div>
            <span className="text-[10px]">Tiktok</span>
        </a>

        {/* Nút Nhóm */}
        <a href="https://zalo.me/g/ujgais332" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 hover:text-blue-600 transition-colors group">
            <div className="p-2 bg-blue-50 rounded-full text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <span className="text-[10px]">Nhóm</span>
        </a>

        {/* --- NÚT MỚI: TÀI LIỆU --- */}
        <button 
            onClick={() => setIsDocsModalOpen(true)}
            className="flex flex-col items-center gap-1 hover:text-purple-600 transition-colors group"
        >
            <div className="p-2 bg-purple-50 rounded-full text-purple-500 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <span className="text-[10px]">Tài liệu</span>
        </button>

    </div>

    </div>

    {/* --- POPUP TÀI LIỆU (MỚI THÊM) --- */}
    {isDocsModalOpen && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 flex flex-col max-h-[80vh]">
            
            {/* Header của Popup */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
{/* Bắt đầu Icon 2D */}
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
</svg>
{/* Kết thúc Icon 2D */}
TÀI LIỆU HỌC TẬP
</h3>
                <button onClick={() => setIsDocsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            {/* Danh sách tài liệu (Cuộn được nếu dài) */}
            <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
                
                {/* 2139 kanji */}
                <a href="https://drive.google.com/file/d/1Q3bbd3Aao7R71wemjESHddbvmXWYe542/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate group-hover:text-purple-700 pb-1">2139 Hán tự (N5-N1)</p>
                        <p className="text-[10px] text-gray-400">PDF • 797 KB</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>

                {/* quy tắc chuyển âm */}
                <a href="https://drive.google.com/file/d/17L2ufF9P0GfLrhzE_yCsAqjXYSYrhTxU/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate group-hover:text-purple-700 pb-1">Quy tắc chuyển âm</p>
                        <p className="text-[10px] text-gray-400">PDF • 128 KB</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>

                {/* Flashcard Kanji */}
                <a href="https://quizlet.com/join/mE5CzMyT7?i=4yxqkk&x=1bqt" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate group-hover:text-purple-700 pb-1">Flashcard 2139 kanji N5-N1</p>
                        <p className="text-[10px] text-gray-400">147 học phần</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>

                {/* Flashcard từ vựng */}
                <a href="https://quizlet.com/join/nuE9y8xHf?i=4yxqkk&x=1bqt" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate group-hover:text-purple-700 pb-1">Flashcard từ vựng N5-N1</p>
                        <p className="text-[10px] text-gray-400">354 học phần</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>

                {/* nhóm học tập */}
                <a href="https://zalo.me/g/ujgais332" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group">
                    {/* Đã đổi: bg-blue -> bg-orange */}
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        {/* Đã đổi: Icon File -> Icon Nhóm người */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate group-hover:text-purple-700 pb-1">Thêm nhiều tài liệu khác...</p>
                        <p className="text-[10px] text-gray-400">tham gia nhóm học tập</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>

            </div>

            {/* Nút đóng màu đen */}
            <div className="p-4 pt-2 bg-white">
                <button 
                    onClick={() => setIsDocsModalOpen(false)}
                    className="w-full py-3 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-lg transition-transform active:scale-95"
                >
                    ĐÓNG
                </button>
            </div>

        </div>
    </div>
    )}

{/* --- MODAL (POPUP) XÁC NHẬN IN --- */}
{isPrintModalOpen && (
<div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
{/* Hộp nội dung chính */}
<div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200 border border-gray-200">
    
    {/* 1. NÚT ĐÓNG (X) MÀU ĐỎ Ở GÓC PHẢI */}
    <button 
    onClick={() => setIsPrintModalOpen(false)}
    className="absolute top-3 right-3 p-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full transition-colors z-10 group"
    title="Đóng"
    >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>

    {/* 2. NỘI DUNG CẢNH BÁO */}
    <div className="p-6 flex flex-col items-center text-center">
    
    {/* Icon trang trí */}
    <div className="w-14 h-14 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-4 border border-yellow-100">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    </div>

    <h3 className="text-xl font-bold text-gray-800 mb-2">LƯU Ý QUAN TRỌNG</h3>
    
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-800 leading-relaxed text-left w-full">
        <p className="font-bold mb-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Để bản in đẹp nhất:
        </p>
        <ul className="list-disc list-inside space-y-1.5 ml-1">
        <li>Nên dùng <b>Máy tính (PC/Laptop)</b>.</li>
        <li>Trình duyệt khuyên dùng: <b>Google Chrome</b>.</li>
        <li>Không nên dùng <b>iphone</b>.</li>
        </ul>
    </div>

    {/* 3. NÚT IN THẬT SỰ (NẰM TRONG KHUNG) */}
    <button 
        onClick={() => {
        setIsPrintModalOpen(false); // Đóng khung này
        onPrint(); // Gọi lệnh in của hệ thống
        }}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
    >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
        TIẾN HÀNH IN/LƯU NGAY
    </button>

    </div>
</div>
</div>
)}

            </div>
        </div>
        
        {/* GIAO DIỆN THANH LOADING (Overlay) */}
        {isLoading && (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="w-72 p-6 bg-white rounded-2xl shadow-2xl border border-indigo-50 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider animate-pulse">
                    Đang nạp dữ liệu...
                </span>
                <span className="text-sm font-black text-indigo-600">{progress}%</span>
                </div>
                
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                    style={{ width: `${progress}%` }}
                ></div>
                </div>
                
                <p className="text-[10px] text-gray-400 mt-3 text-center italic">
                Hệ thống đang xử lý, vui lòng đợi giây lát...
                </p>
            </div>
            </div>
        )}
        
        </div>
    );
    };
