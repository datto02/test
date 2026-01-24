const { useState, useEffect, useMemo, useRef } = React;
const removeAccents = (str) => {
return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
};
const calculateSRS = (currentData, quality) => {
  let { level = 0, easeFactor = 2.5, nextReview } = currentData || {};
  const now = Date.now();
  if (nextReview && nextReview > now) {
      if (quality === 1) return currentData;
  }

  if (quality === 0) {
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    
    return {
      level: 0,           
      easeFactor: easeFactor, 
      nextReview: 0,     
      isDone: false
    };

  } else {
    // === BẤM NÚT "ĐÃ BIẾT" (XANH) ===

    let newInterval;

  
    if (!nextReview || nextReview === 0 || level === 0) {
        newInterval = 1; 
    } 
  
    else {

        newInterval = Math.ceil(level * easeFactor);

        easeFactor = Math.min(2.5, easeFactor + 0.1); 
    }

    // --- XỬ LÝ 5 GIỜ SÁNG ---
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + newInterval);
    nextDate.setHours(5, 0, 0, 0);

    return {
      level: newInterval, 
      easeFactor: easeFactor,
      nextReview: nextDate.getTime(),
      isDone: false 
    };
  }
};

 const getHex = (char) => char.codePointAt(0).toString(16).toLowerCase().padStart(5, '0');

 // --- FETCH DATA FROM GITHUB --- 
const fetchDataFromGithub = async () => {
  try { 
  
    const [dbResponse, onkunResponse] = await Promise.all([
      fetch('./data/kanji_db.json'),
      fetch('./data/onkun.json')
    ]);

    let kanjiDb = null;
    let onkunDb = null;

    if (dbResponse.ok) kanjiDb = await dbResponse.json();
    else console.warn("Không tải được kanji_db.json");

    if (onkunResponse.ok) onkunDb = await onkunResponse.json();
    else console.warn("Không tải được onkun.json (sẽ dùng API online)");


    return { ...kanjiDb, ONKUN_DB: onkunDb }; 
  } catch (error) {
    console.error("Lỗi tải dữ liệu hệ thống:", error);
    return null;
  }
};

 const fetchKanjiData = async (char) => {
    const hex = getHex(char);
    
  
    const sources = [
      `./data/svg/${hex}.svg`,  
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
          
          if (text.includes('<svg')) {
             return { success: true, svg: text, source: url };
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    return { success: false };
  };

 const useKanjiSvg = (char) => {
    const [state, setState] = useState({ 
        loading: true, 
        paths: [], 
        fullSvg: null, 
        failed: false 
    });
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        if (!char) return;

        setState({ loading: true, paths: [], fullSvg: null, failed: false });

        fetchKanjiData(char).then((result) => {
        if (!mounted.current) return;

        if (result.success) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(result.svg, "image/svg+xml");
            
            
            const pathElements = Array.from(doc.querySelectorAll('path'));
            const pathData = pathElements.map(p => p.getAttribute('d')).filter(d => d);
            
        
            const svgString = new XMLSerializer().serializeToString(doc.documentElement);

            setState({
            loading: false,
            paths: pathData,
            fullSvg: svgString,
            failed: false
            });
        } else {
            setState({
            loading: false,
            paths: [],
            fullSvg: null,
            failed: true
            });
        }
        });

        return () => { mounted.current = false; };
    }, [char]);

    return state;
    };

const useKanjiReadings = (char, active, dbData) => {
  const [readings, setReadings] = useState({ on: '', kun: '' });

  useEffect(() => {
    if (!char || !active) return;

    
    if (dbData?.ONKUN_DB && dbData.ONKUN_DB[char]) {
      const info = dbData.ONKUN_DB[char];
      setReadings({
        
        on: info.readings_on?.join(', ') || '---', 
        kun: info.readings_kun?.join(', ') || '---'
      });
      return; 
    }

 
    fetch(`https://kanjiapi.dev/v1/kanji/${char}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setReadings({
            on: data.on_readings?.join(', ') || '---',
            kun: data.kun_readings?.join(', ') || '---'
          });
        }
      })
      .catch(() => setReadings({ on: '---', kun: '---' }));
      
  }, [char, active, dbData]); 

  return readings;
};

