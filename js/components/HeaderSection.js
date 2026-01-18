import { useKanjiReadings } from '../hooks.js';

const HeaderSection = ({ char, paths, loading, failed, config, dbData }) => {
    const readings = useKanjiReadings(char, config.showOnKun);

    if (loading) return <div className="h-[22px] w-full animate-pulse bg-gray-100 rounded mb-1"></div>;
    if (failed) return <div className="h-[22px] w-full mb-1"></div>;

    const info = dbData.KANJI_DB[char] || dbData.ALPHABETS.hiragana[char] || dbData.ALPHABETS.katakana[char];
    const isJLPT = dbData.KANJI_LEVELS.N5.includes(char) || 
                   dbData.KANJI_LEVELS.N4.includes(char) || 
                   dbData.KANJI_LEVELS.N3.includes(char) || 
                   dbData.KANJI_LEVELS.N2.includes(char) || 
                   dbData.KANJI_LEVELS.N1.includes(char);

    return (
        <div className="flex flex-row items-end px-1 mb-1 h-[22px] overflow-hidden border-b border-transparent" style={{ width: '184mm', minWidth: '184mm', maxWidth: '184mm' }}>
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

            <div className="flex-1 min-w-0 h-[22px]"> 
                {(() => {
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
                    return null;
                })()}
            </div>
        </div>
    );
};

export default HeaderSection;
