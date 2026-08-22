'use client';

import React from 'react';

export default function SchemaTile() {
    return (
        <div className="bg-[#121824] border border-slate-800/80 rounded-2xl p-6 shadow-xl col-span-1 md:col-span-2">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-200">Anlagen-Schema</h2>
                    <p className="text-xs text-slate-400">Live-Visualisierung der Technischen Alternative</p>
                </div>
                <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
                    🔥
                </div>
            </div>
            
            {/* Schema-Container im modernen Dark-Mode-Rahmen */}
            <div className="w-full h-[650px] rounded-xl overflow-hidden border border-slate-800 bg-white relative">
                <iframe 
                    src="http://192.168.2.215/webi/schema.html#1" 
                    className="w-full h-full border-0"
                    title="C.M.I. Schema"
                />
            </div>
        </div>
    );
}