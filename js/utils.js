// Cần import fetchKanjiData từ api.js để useKanjiSvg hoạt động
import { fetchKanjiData } from './api.js';

const { useState, useEffect, useRef } = React;

// --- UTILS ---
export const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
};

export const getHex = (char) => char.codePointAt(0).toString(16).toLowerCase().padStart(5, '0');

export const shuffleString = (str) => {
    const arr = [...str];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
};

export const getUniqueChars = (str) => Array.from(new Set(str)).join('');

export const getAllowedRegexString = (options, allowLatin = false) => {
    let ranges = "\\s"; 
    if (allowLatin) ranges += "a-zA-Z";
    if (options.hiragana) ranges += "\\u3040-\\u309F";
    if (options.katakana) ranges += "\\u30A0-\\u30FF";
    if (options.kanji) ranges += "\\u4E00-\\u9FAF\\u3400-\\u4DBF\\u2E80-\\u2FDF\\uF900-\\uFAFF"; 
    return ranges;
};

// --- CUSTOM HOOKS (Phải có để components.js không bị lỗi) ---

export const useKanjiSvg = (char) => {
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
                setState({ loading: false, paths: [], fullSvg: null, failed: true });
            }
        });

        return () => { mounted.current = false; };
    }, [char]);

    return state;
};

export const useKanjiReadings = (char, active, dbData) => {
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
