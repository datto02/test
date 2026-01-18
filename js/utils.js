// Hàm xóa dấu tiếng Việt
export const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
};

// Hàm lấy mã Hex của ký tự
export const getHex = (char) => char.codePointAt(0).toString(16).toLowerCase().padStart(5, '0');

// Hàm xáo trộn chuỗi
export const shuffleString = (str) => {
    const arr = [...str];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
};

// Hàm tải dữ liệu chính từ Github
export const fetchDataFromGithub = async () => {
    try {
        const response = await fetch('https://raw.githubusercontent.com/datto02/luyenvietkanji/refs/heads/main/kanji_db.json');
        if (!response.ok) throw new Error('Không thể tải dữ liệu');
        return await response.json();
    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        return null;
    }
};

// Hàm tải dữ liệu SVG của Kanji
export const fetchKanjiData = async (char) => {
    const hex = getHex(char);
    const sources = [
        `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/${hex}.svg`,
        `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/${hex}-Kaisho.svg`,
        `https://cdn.jsdelivr.net/gh/parsimonhi/animCJK@master/svgsKana/${hex}.svg`,
        `https://cdn.jsdelivr.net/gh/parsimonhi/animCJK@master/svgsJa/${hex}.svg`
    ];

    for (const url of sources) {
        try {
            const res = await fetch(url);
            if (res.ok) {
                const text = await res.text();
                return { success: true, svg: text, source: url };
            }
        } catch (e) {
            continue;
        }
    }
    return { success: false };
};
