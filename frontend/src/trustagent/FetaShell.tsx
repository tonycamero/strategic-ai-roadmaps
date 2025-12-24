import { useState, useEffect, useRef } from 'react';
import { type ConversationMessage } from './flows';
import { config } from './config';
import { trustagentApi } from './api';
import { FetaChatBody } from './FetaChatBody';

interface FetaShellProps {
    panelOpen: boolean;
    handlePanelClose: () => void;
}

// THIS FILE CONTAINS ALL FE-TA-ONLY LOGIC TO KEEP TrustAgentShell.tsx CLEAN
export function FetaShell({ panelOpen, handlePanelClose }: FetaShellProps) {
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [sessionId] = useState<string>(() => crypto.randomUUID());
    const [isLoading, setIsLoading] = useState(false);
    const greetingInProgressRef = useRef(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (panelOpen && messages.length === 0) {
            handleInitialGreeting();
        }
    }, [panelOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleInitialGreeting = async () => {
        if (greetingInProgressRef.current || isLoading || messages.length > 0) return;
        greetingInProgressRef.current = true;
        setIsLoading(true);
        try {
            const response = await trustagentApi.chat('', sessionId, {}, 'feta');
            setMessages([{
                id: `${Date.now()}`,
                speaker: 'agent',
                ...parseAgentResponse(response.message),
                timestamp: new Date(),
            }]);
        } catch (err) {
            console.error('FE-TA Init Error:', err);
        } finally {
            setIsLoading(false);
            greetingInProgressRef.current = false;
        }
    };

    const handleOptionClick = async (_id: string, label: string) => {
        setMessages(prev => [...prev, { id: `${Date.now()}`, speaker: 'user', message: label, timestamp: new Date() }]);
        setIsLoading(true);
        try {
            const response = await trustagentApi.chat(label, sessionId, {}, 'feta');
            setMessages(prev => [...prev, {
                id: `${Date.now()}`,
                speaker: 'agent',
                ...parseAgentResponse(response.message),
                timestamp: new Date(),
            }]);
        } catch (err) {
            console.error('FE-TA Option Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCtaClick = (cta: any) => {
        if (cta.type === 'create_roadmap') {
            window.location.href = '/create-roadmap';
        }
    };

    const parseAgentResponse = (raw: string) => {
        const extract = (t: string, tag: string) => {
            const m = t.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
            return m ? m[1].trim() : null;
        };
        const quickHit = extract(raw, 'quick_hit');
        const valuePop = extract(raw, 'value_pop');
        const q = extract(raw, 'one_question');
        const optionsBlock = extract(raw, 'options');
        let message = raw;
        if (quickHit || valuePop || q) {
            message = [quickHit && `**${quickHit}**`, valuePop, q && `**Question:** ${q}`].filter(Boolean).join('\n\n');
        }
        let cta: any = undefined;
        if (raw.includes('{{cta:create_my_roadmap}}')) {
            cta = { type: 'create_roadmap', label: 'Create My Roadmap' };
        }
        let options = optionsBlock ? JSON.parse(optionsBlock).map((o: any) => ({ ...o, nextStepId: o.id })) : undefined;
        return { message, cta, options };
    };

    return (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-slate-950 z-[80] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between">
                <h3>{config.panel.title}</h3>
                <button onClick={handlePanelClose}>×</button>
            </div>
            <FetaChatBody
                messages={messages}
                isLoading={isLoading}
                messagesEndRef={messagesEndRef}
                handleOptionClick={handleOptionClick}
                handleCtaClick={handleCtaClick}
            />
        </div>
    );
}
