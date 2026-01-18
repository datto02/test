import { getHex } from './js/utils.js';

export const fetchDataFromGithub = async () => {
  try {
    const [dbResponse, onkunResponse] = await Promise.all([
      fetch('./data/kanji_db.json'),
      fetch('./data/onkun.json')
    ]);
    let kanjiDb = dbResponse.ok ? await dbResponse.json() : null;
    let onkunDb = onkunResponse.ok ? await onkunResponse.json() : null;
    return { ...kanjiDb, ONKUN_DB: onkunDb }; 
  } catch (error) {
    console.error("Lỗi tải dữ liệu:", error);
    return null;
  }
};

export const fetchKanjiData = async (char) => {
    const hex = getHex(char);
    const sources = [
      `./data/svg/${hex}.svg`,
      `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/${hex}.svg`,
      `https://cdn.jsdelivr.net/gh/parsimonhi/animCJK@master/svgsKana/${hex}.svg`
    ];
    for (const url of sources) {
      try {
        const res = await fetch(url);
        if (res.ok) {
            const text = await res.text();
            if (text.includes('<svg')) return { success: true, svg: text, source: url };
        }
      } catch (e) { continue; }
    }
    return { success: false };
};
