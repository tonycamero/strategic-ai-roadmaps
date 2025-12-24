import React, { createContext, useContext, useState } from 'react';
import { OnepagerSpec } from '../types/OnepagerSpec';

interface RoadmapContextType {
    payload: OnepagerSpec | null;
    setPayload: (payload: OnepagerSpec | null) => void;
}

const RoadmapContext = createContext<RoadmapContextType | undefined>(undefined);

export function RoadmapProvider({ children }: { children: React.ReactNode }) {
    const [payload, setPayload] = useState<OnepagerSpec | null>(null);

    return (
        <RoadmapContext.Provider value={{ payload, setPayload }}>
            {children}
        </RoadmapContext.Provider>
    );
}

export function useRoadmap() {
    const context = useContext(RoadmapContext);
    if (!context) {
        throw new Error('useRoadmap must be used within a RoadmapProvider');
    }
    return context;
}
