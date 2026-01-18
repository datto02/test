import { useKanjiSvg } from '../hooks.js';
import KanjiAnimationModal from './KanjiAnimationModal.js';
import HeaderSection from './HeaderSection.js';
import GridBox from './GridBox.js';

const { useState } = React;

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

            <KanjiAnimationModal 
                char={char}
                paths={paths}
                fullSvg={fullSvg}  
                dbData={dbData}    
                isOpen={isAnimOpen}
                onClose={() => setIsAnimOpen(false)}
            />
        </div>
    );
};

export default WorkbookRow;
