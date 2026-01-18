import { fetchKanjiData } from './utils.js';

const { useState, useEffect, useRef } = React;

export const useKanjiSvg = (char) => {
    const [state, setState] = useState({ 
        loading: true, paths: [], fullSvg: null, failed: false 
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

                setState({ loading: false, paths: pathData, fullSvg: svgString, failed: false });
            } else {
                setState({ loading: false, paths: [], fullSvg: null, failed: true });
            }
        });

        return () => { mounted.current = false; };
    }, [char]);

    return state;
};

export const useKanjiReadings = (char, active) => {
    const [readings, setReadings] = useState({ on: '', kun: '' });

    useEffect(() => {
        if (!char || !active) return;
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
    }, [char, active]);

    return readings;
};
