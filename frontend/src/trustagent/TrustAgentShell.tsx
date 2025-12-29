/**
 * ⚠️ EXECUTION LOCK — DO NOT MODIFY CASUALLY
 *
 * This file is governed by /working_protocol.md
 *
 * Default mode: NON-DESTRUCTIVE
 * Forbidden unless explicitly authorized:
 * - Refactors
 * - File moves or deletions
 * - API contract changes
 * - Dropping fields (e.g. cta, reveal)
 *
 * If unsure: STOP and ask before editing.
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'wouter';
import ReactMarkdown from 'react-markdown';
import { type FlowId, type FlowStep, type ConversationMessage, findStep } from './flows';
import { type VisitorContext, loadVisitorContext, generateBookingParams, personalizeMessage } from './visitorContext';
import { analytics } from './analytics';
import { config, getQuickPicks, trustAgentMode as defaultMode } from './config';
import { trustagentApi } from './api';
import { useRoadmap } from '../context/RoadmapContext';
import { shapeOnepager } from '../lib/onepagerShaper';
import { TrustAgentAvatar } from './TrustAgentAvatar';

interface TrustAgentShellProps {
  // Future: allow disabling via prop
  enabled?: boolean;
  mode?: 'homepage' | 'feta';
  agentType?: 'public' | 'roadmap';
}

export function TrustAgentShell({ enabled = true, mode: trustAgentMode = defaultMode, agentType = 'public' }: TrustAgentShellProps) {
  const { setPayload } = useRoadmap();
  const [introOpen, setIntroOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mode] = useState<'simulated' | 'live'>('live');
  const [, setLocation] = useLocation();

  // Conversation state
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentFlowId] = useState<FlowId>('intro');
  const [visitorContext, setVisitorContext] = useState<VisitorContext>({});
  const [inputValue, setInputValue] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sessionId] = useState<string>(() => crypto.randomUUID()); // Generate unique session ID per page load

  // AG-TICKET-07: Personal voice capture (Phase 1: collection only)
  const [voiceNotes, setVoiceNotes] = useState<Record<string, string>>({});
  const [showVoicePrompt, setShowVoicePrompt] = useState<string | null>(null); // Question ID being elaborated
  const [currentVoiceInput, setCurrentVoiceInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [greetingPreloaded, setGreetingPreloaded] = useState(false);
  const greetingInProgressRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);

  // AG-TICKET-07: Dev logging for voice notes
  useEffect(() => {
    if (import.meta.env?.DEV && Object.keys(voiceNotes).length > 0) {
      console.log('[TrustAgent Voice Capture]', voiceNotes);
    }
  }, [voiceNotes]);

  // Check if intro has been seen on mount
  useEffect(() => {
    // Disable intro for roadmap agent (portal users already onboarded)
    if (!enabled || !config.introEnabled || agentType === 'roadmap') return;

    const introSeen = localStorage.getItem('trustagent_intro_seen');
    if (!introSeen) {
      // Delay intro slightly to let page settle
      const timer = setTimeout(() => {
        setIntroOpen(true);
        if (config.analyticsEnabled) {
          analytics.introSeen();
        }
      }, config.introDelay);
      return () => clearTimeout(timer);
    }
  }, [enabled]);

  // Handle intro modal close
  const handleIntroClose = () => {
    localStorage.setItem('trustagent_intro_seen', 'true');
    setIntroOpen(false);
  };

  // Toggle panel
  const handleBubbleClick = () => {
    setPanelOpen(!panelOpen);
  };

  // Handle panel close
  const handlePanelClose = () => {
    setPanelOpen(false);
  };

  // Load visitor context on mount (Public Only)
  useEffect(() => {
    if (agentType === 'roadmap') return;
    const context = loadVisitorContext();
    setVisitorContext(context);
  }, [agentType]);

  // Public Lifecycle: Load greeting when panel opens (in live mode)
  useEffect(() => {
    if (agentType === 'roadmap') return;
    if (mode === 'live' && panelOpen && !greetingPreloaded && messages.length === 0) {
      setGreetingPreloaded(true);
      handleInitialGreeting();
    }
  }, [mode, panelOpen, agentType]);

  // Roadmap Lifecycle: Contextual Greeting on mount (or open)
  useEffect(() => {
    if (agentType !== 'roadmap') return;
    // For roadmap, we might want to greet immediately or just be ready.
    // Let's silently prepare.
    if (panelOpen && messages.length === 0 && !greetingPreloaded) {
      setGreetingPreloaded(true);
      // Simple local greeting to start conversation
      const welcomeMsg: ConversationMessage = {
        id: 'init-roadmap',
        speaker: 'agent',
        message: "Hello. I'm your Executive Roadmap Copilot. How can I help you execute on your strategy today?",
        timestamp: new Date()
      };
      setMessages([welcomeMsg]);
    }
  }, [agentType, panelOpen, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (panelOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (config.analyticsEnabled) {
        analytics.opened();
      }
    }
  }, [panelOpen]);

  // ESC to close intro modal or panel
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (introOpen) {
          handleIntroClose();
        } else if (panelOpen) {
          handlePanelClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [introOpen, panelOpen]);

  // Handle quick pick from intro modal
  const handleQuickPick = (flowId: string) => {
    handleIntroClose();
    setPanelOpen(true);

    // In live mode, convert to natural language prompt
    const prompts: Record<string, string> = {
      explain_roadmap: 'Can you explain the Strategic AI Roadmap in simple terms?',
      fit_check: 'I want to know if the Strategic AI Roadmap is right for my firm. Can you help assess fit?',
      roi_teaser: 'Can you walk me through ROI examples for a professional-service firm like mine?',
    };

    const prompt = prompts[flowId] || 'Tell me about the Strategic AI Roadmap';
    setInputValue(prompt);

    // Trigger send after a brief delay to let UI update
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };



  // Add agent message to conversation
  const addAgentMessage = (step: FlowStep) => {
    const message: ConversationMessage = {
      id: `${Date.now()}-${Math.random()}`,
      speaker: 'agent',
      message: personalizeMessage(step.message, visitorContext),
      timestamp: new Date(),
      options: step.options,
      cta: step.cta,
    };
    setMessages(prev => [...prev, message]);

    // Auto-advance if there's a nextId and no options
    if (step.nextId && !step.options && !step.cta) {
      setTimeout(() => {
        const nextStep = findStep(currentFlowId, step.nextId!);
        if (nextStep) {
          addAgentMessage(nextStep);
        }
      }, config.autoAdvanceDelay);
    }
  };

  // Add user message
  const addUserMessage = (text: string) => {
    const message: ConversationMessage = {
      id: `${Date.now()}-${Math.random()}`,
      speaker: 'user',
      message: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  };

  // AG-TICKET-07: Voice capture handlers
  const handleVoiceSubmit = async (questionId: string) => {
    if (currentVoiceInput.trim()) {
      setVoiceNotes(prev => ({
        ...prev,
        [questionId]: currentVoiceInput.trim()
      }));
    }
    setShowVoicePrompt(null);
    setCurrentVoiceInput('');

    // Now continue with backend communication
    const optionId = answers[questionId];
    if (optionId && mode === 'live') {
      await sendMessageToBackend(optionId);
    }
  };

  const handleVoiceSkip = async () => {
    const questionId = showVoicePrompt;
    setShowVoicePrompt(null);
    setCurrentVoiceInput('');

    // Continue without voice note
    if (questionId) {
      const optionId = answers[questionId];
      if (optionId && mode === 'live') {
        await sendMessageToBackend(optionId);
      }
    }
  };

  //Helper to send message to backend
  const sendMessageToBackend = async (optionId: string) => {
    if (isLoading || sendingRef.current) return;

    sendingRef.current = true;
    setIsLoading(true);

    try {
      const pageContext = {
        entryPage: window.location.pathname,
        referrer: document.referrer || undefined,
      };

      const response = await trustagentApi.chat(optionId, sessionId, pageContext, trustAgentMode === 'feta' ? 'feta' : undefined);
      const { message: messageText, cta: parsedCta } = parseAgentResponse(response.message);

      const agentMessage: ConversationMessage = {
        id: `${Date.now()}-${Math.random()}`,
        speaker: 'agent',
        message: messageText,
        timestamp: new Date(),
        options: response.options,
        cta: response.cta || parsedCta,
        reveal: response.reveal,
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error: any) {
      console.error('Live API error:', error);
      const errorMessage: ConversationMessage = {
        id: `${Date.now()}-${Math.random()}`,
        speaker: 'agent',
        message: error.message || 'I encountered an issue processing your selection.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      sendingRef.current = false;
    }
  };

  // Handle option click
  const handleOptionClick = async (optionId: string, label: string) => {
    // Prevent double-click
    if (isLoading || sendingRef.current) return;

    // Track answer for evidence-locked copy generation
    if (optionId.includes('_')) {
      const questionId = optionId.split('_')[0]; // e.g. "A1"
      setAnswers(prev => ({ ...prev, [questionId]: optionId }));

      // AG-TICKET-07.1: Show voice prompt only for A1/A2/A3 (not H0 or other steps)
      if (optionId.startsWith('A1_') || optionId.startsWith('A2_') || optionId.startsWith('A3_')) {
        setShowVoicePrompt(questionId);
        setCurrentVoiceInput('');
        addUserMessage(label); // Show user's selection
        return; // Don't send to backend yet - wait for voice input
      }
    }

    addUserMessage(label);

    // Live Mode: Send option ID to backend
    sendingRef.current = true;
    setIsLoading(true);

    try {
      const pageContext = {
        entryPage: window.location.pathname,
        referrer: document.referrer || undefined,
      };

      // Send optionID as the answer
      const response = await trustagentApi.chat(optionId, sessionId, pageContext, trustAgentMode as 'feta' | 'homepage');

      // Parse JSON response
      const { message: messageText, cta: parsedCta } = parseAgentResponse(response.message);

      // Add assistant message
      const agentMessage: ConversationMessage = {
        id: `${Date.now()}-${Math.random()}`,
        speaker: 'agent',
        message: messageText,
        timestamp: new Date(),
        options: response.options,
        cta: response.cta || parsedCta,
        reveal: response.reveal,
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error: any) {
      console.error('Live API error:', error);
      const errorMessage: ConversationMessage = {
        id: `${Date.now()}-${Math.random()}`,
        speaker: 'agent',
        message: error.message || 'I encountered an issue processing your selection.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      sendingRef.current = false;
    }
    return;
  }

  // Handle CTA click
  const handleCtaClick = (cta: any) => {
    if (config.analyticsEnabled) {
      analytics.ctaClicked(cta.type);
    }

    if (cta.type === 'book_call') {
      const params = generateBookingParams(visitorContext);
      // TODO: Replace with actual booking URL when available
      const bookingUrl = `mailto:tony@scend.cash?subject=Strategic AI Roadmap - Discovery Call&body=Source: TrustAgent%0A${params ? `Context: ${params}` : ''}`;
      window.open(bookingUrl, '_blank');
    } else if (cta.type === 'view_sample_roadmap') {
      setLocation('/cohort');
      setPanelOpen(false);
    } else if (cta.type === 'view_metrics_demo') {
      // Scroll to metrics section or navigate
      setLocation('/cohort');
      setPanelOpen(false);
      setPanelOpen(false);
    } else if (cta.type === 'generate_mini_roadmap') {
      // Find latest reveal in messages
      const latestReveal = [...messages].reverse().find(m => m.reveal)?.reveal;
      // ALWAYS shape the payload (fallback handled inside shapeOnepager)
      setPayload(shapeOnepager(latestReveal, answers, voiceNotes)); // AG-TICKET-07: Pass voiceNotes
      setLocation('/onepager');
      setPanelOpen(false);
    }
  };

  // Helper: Parse TrustAgent XML response
  const parseAgentResponse = (rawMessage: string) => {
    console.log('[TrustAgent] Raw message:', rawMessage);

    // Extract tag helper
    const extractTag = (text: string, tag: string): string | null => {
      const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : null;
    };

    // Try to extract TrustAgent XML tags
    const quickHit = extractTag(rawMessage, 'quick_hit');
    const valuePop = extractTag(rawMessage, 'value_pop');
    const oneQuestion = extractTag(rawMessage, 'one_question');

    let messageText: string;
    let cta: any = undefined;

    // If we have TrustAgent tags, format them nicely
    if (quickHit || valuePop || oneQuestion) {
      const parts: string[] = [];

      if (quickHit) {
        parts.push(`**${quickHit}**`);
      }

      if (valuePop) {
        parts.push(valuePop);
      }

      if (oneQuestion) {
        parts.push(`**Question:** ${oneQuestion}`);
      }

      messageText = parts.join('\n\n');
    } else {
      // Fallback: no tags found, use raw message
      messageText = rawMessage;
    }

    // Parse CTA markers
    const ctaMarkers = [
      { marker: '{{cta:schedule_call}}', type: 'book_call', label: 'Schedule a Strategy Call' },
      { marker: '{{cta:explore_cohort}}', type: 'view_sample_roadmap', label: 'Explore Eugene Cohort' },
      { marker: '{{cta:read_overview}}', type: 'view_sample_roadmap', label: 'Read Roadmap Overview' },
    ];

    for (const { marker, type, label } of ctaMarkers) {
      if (messageText.includes(marker)) {
        messageText = messageText.replace(marker, '').trim();
        cta = { type, label };
        break;
      }
    }

    return { message: messageText, cta };
  };

  // Handle initial greeting (proactive first message)
  const handleInitialGreeting = async () => {
    // Strict Guard: Never run public greeting for roadmap agent
    if (agentType === 'roadmap') return;

    // Prevent duplicate calls (React StrictMode calls effects twice in dev)
    if (greetingInProgressRef.current || isLoading || messages.length > 0) return;

    greetingInProgressRef.current = true;
    setIsLoading(true);

    try {
      const pageContext = {
        entryPage: window.location.pathname,
        referrer: document.referrer || undefined,
      };

      // Send a special init message that triggers the opening behavior
      const response = await trustagentApi.chat('', sessionId, pageContext, trustAgentMode as 'feta' | 'homepage');

      // Parse JSON response
      const { message: messageText, cta: parsedCta } = parseAgentResponse(response.message);

      // Add assistant message (no user message for proactive greeting)
      const agentMessage: ConversationMessage = {
        id: `${Date.now()}-${Math.random()}`,
        speaker: 'agent',
        message: messageText,
        timestamp: new Date(),
        options: response.options,
        cta: response.cta || parsedCta,
        reveal: response.reveal,
      };

      setMessages([agentMessage]);
    } catch (error: any) {
      console.error('Initial greeting error:', error);
    } finally {
      setIsLoading(false);
      greetingInProgressRef.current = false;
    }
  };

  // Handle send message (freeform input)
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || sendingRef.current) return;
    sendingRef.current = true;

    const userMessage = inputValue;
    addUserMessage(userMessage);
    setInputValue('');
    setIsLoading(true);

    if (config.analyticsEnabled) {
      analytics.messageSent(true);
    }

    // Live mode: call real API
    try {
      const pageContext = {
        entryPage: window.location.pathname,
        referrer: document.referrer || undefined,
      };

      let response;
      if (agentType === 'roadmap') {
        // Use Roadmap Agent API
        // We need to import 'api' from '../lib/api'. Since we can't easily add top-level imports in this specific tool call without viewing the top, 
        // and we know 'fetch' works, we'll inline the fetch for now to ensure correctness with the new 'answer' format.
        // Actually, let's use the fetch pattern to match trustagentApi but for roadmap.
        const res = await fetch('/api/roadmap/qna', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ question: userMessage })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || err.message || 'Failed to contact Roadmap Agent');
        }
        const data = await res.json();

        // Adapt to TrustAgent ChatResponse format
        response = {
          sessionId: sessionId,
          message: data.answer,
          options: [], // Roadmap agent currently doesn't return options, but we could add suggested actions later
          cta: undefined
        };

      } else {
        // Use FE-TA API (Public)
        response = await trustagentApi.chat(userMessage, sessionId, pageContext, trustAgentMode as 'feta' | 'homepage');
      }

      // Parse JSON response
      const { message: messageText, cta: parsedCta } = parseAgentResponse(response.message);

      // Add assistant message
      const agentMessage: ConversationMessage = {
        id: `${Date.now()}-${Math.random()}`,
        speaker: 'agent',
        message: messageText,
        timestamp: new Date(),
        options: response.options,
        cta: response.cta || parsedCta,
        reveal: response.reveal,
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error: any) {
      console.error('Live API error:', error);

      // Show error message in chat
      const errorMessage: ConversationMessage = {
        id: `${Date.now()}-${Math.random()}`,
        speaker: 'agent',
        message: error.message || 'I encountered an issue processing your message. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      sendingRef.current = false;
    }
    return;
  }

  if (!enabled) return null;

  return createPortal(
    <>
      {/* Bubble - always visible */}
      <div
        onClick={handleBubbleClick}
        className="fixed top-20 right-5 z-[80] cursor-pointer hover:scale-110 transition-transform duration-200 safe-top safe-right"
        style={{ top: 'max(5rem, env(safe-area-inset-top))', right: 'max(1.25rem, env(safe-area-inset-right))' }}
        aria-label="Open TrustAgent"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleBubbleClick();
          }
        }}
      >
        <TrustAgentAvatar size="medium" showPulse={true} />
      </div>

      {/* Intro Modal */}
      {introOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center sm:items-center items-end justify-center p-0 sm:p-4 z-[80]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trustagent-intro-title"
        >
          <div className="bg-slate-950 border-t sm:border border-slate-800 rounded-t-xl sm:rounded-xl max-w-lg w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleIntroClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-2xl leading-none transition-colors"
              aria-label="Close"
            >
              ×
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0">
                <TrustAgentAvatar size="large" showPulse={false} />
              </div>

              <div>
                <h2 id="trustagent-intro-title" className="text-2xl font-semibold text-slate-100 mb-2">
                  {config.intro.headline}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {config.intro.subheadline}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {Array.isArray(config?.intro?.quickPicks) ? getQuickPicks().map((pick) => (
                <button
                  key={pick.flowId}
                  onClick={() => handleQuickPick(pick.flowId)}
                  className="w-full text-left px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-slate-200 transition-colors"
                >
                  {pick.label}
                </button>
              )) : null}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleIntroClose();
                  setPanelOpen(true);
                }}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                {config.intro.primaryCtaLabel}
              </button>
              <button
                onClick={handleIntroClose}
                className="px-6 py-3 text-slate-400 hover:text-slate-200 font-medium transition-colors"
              >
                {config.intro.secondaryCtaLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel */}
      {panelOpen && (
        <div
          className="fixed inset-0 sm:top-0 sm:right-0 sm:bottom-0 sm:left-auto w-full sm:w-[440px] bg-slate-950 sm:border-l border-slate-800 z-[80] shadow-2xl flex flex-col"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">{config.panel.title}</h3>
              <p className="text-xs text-slate-400">
                {agentType === 'roadmap' ? 'Your Executive Roadmap Copilot' : config.panel.subtitle}
              </p>
            </div>
            <button
              onClick={handlePanelClose}
              className="text-slate-400 hover:text-slate-200 text-2xl leading-none transition-colors"
              aria-label="Close panel"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && !isLoading ? (
              <div className="text-center text-slate-400 mt-8">
                <p className="mb-4">👋 Hi! I'm TrustAgent.</p>
                <p className="text-sm">Click a suggestion below to start chatting.</p>
              </div>
            ) : messages.length === 0 && isLoading ? (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-slate-900 text-slate-200 rounded-lg p-4">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.speaker === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-200'} rounded-lg p-4`}>
                    {msg.speaker === 'agent' ? (
                      <div className="text-sm prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{msg.message}</ReactMarkdown>
                        {/* Reveal Logic */}
                        {msg.speaker === 'agent' && msg.reveal && (
                          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 px-4 py-4 text-left shadow-lg">
                            <h3 className="text-base font-semibold text-white mb-2">
                              {msg.reveal.headline}
                            </h3>

                            <ul className="mb-3 list-disc pl-5 text-sm text-slate-300 space-y-1">
                              {msg.reveal.signals.map((signal, i) => (
                                <li key={i}>{signal}</li>
                              ))}
                            </ul>

                            <p className="text-sm text-slate-400 font-medium">
                              {msg.reveal.diagnosis}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm whitespace-pre-line">{msg.message}</div>
                    )}

                    {/* Options */}
                    {msg.options && (
                      <div className="mt-3 flex flex-col gap-2">
                        {msg.options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleOptionClick(option.id, option.label)}
                            className="w-full px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-left text-slate-100 rounded-lg border border-slate-700 transition-colors"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    {msg.cta && (
                      <button
                        onClick={() => handleCtaClick(msg.cta)}
                        className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                      >
                        {msg.cta.label}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* AG-TICKET-07: Voice prompt flow interstitial (Phase 1 collection only) */}
          {showVoicePrompt && (
            <div className="p-6 border-b border-slate-800">
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                <div className="text-sm text-slate-200 font-medium">
                  Optional — add one sentence of detail
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  If you skip this, no problem. If you add it, we'll better understand how to help you move forward.
                </div>

                <textarea
                  className="mt-3 w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
                  value={currentVoiceInput}
                  onChange={(e) => setCurrentVoiceInput(e.target.value)}
                  maxLength={240}
                  rows={3}
                  placeholder="What happened the last time this occurred?"
                  autoFocus
                />

                <div className="mt-3 flex gap-2 justify-end">
                  <button
                    type="button"
                    className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
                    onClick={handleVoiceSkip}
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-slate-200 px-4 py-2 text-sm text-slate-900 hover:bg-white transition-colors font-medium"
                    onClick={() => handleVoiceSubmit(showVoicePrompt)}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-6 border-t border-slate-800">
            {/* Suggested prompts (Public Only) */}
            {messages.length === 0 && agentType !== 'roadmap' && (
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setInputValue('Can you explain the Strategic AI Roadmap in simple terms?');
                    setTimeout(() => handleSendMessage(), 100);
                  }}
                  className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-full text-slate-300 transition-colors"
                >
                  What is the Roadmap?
                </button>
                <button
                  onClick={() => {
                    setInputValue('I want to know if the Strategic AI Roadmap is right for my firm. Can you help assess fit?');
                    setTimeout(() => handleSendMessage(), 100);
                  }}
                  className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-full text-slate-300 transition-colors"
                >
                  Am I a fit?
                </button>
                <button
                  onClick={() => {
                    setInputValue('Can you walk me through ROI examples for a professional-service firm like mine?');
                    setTimeout(() => handleSendMessage(), 100);
                  }}
                  className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-full text-slate-300 transition-colors"
                >
                  Show me ROI
                </button>
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  agentType === 'roadmap'
                    ? "Ask about your roadmap..."
                    : (messages.length > 0 && messages[messages.length - 1].options ? "Please select an option above..." : "Type a message...")
                }
                disabled={agentType !== 'roadmap' && (messages.length > 0 && !!messages[messages.length - 1].options)}
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={!inputValue.trim() || isLoading || (agentType !== 'roadmap' && messages.length > 0 && !!messages[messages.length - 1].options)}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
