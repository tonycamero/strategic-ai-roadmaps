/**
 * Webinar Multi-Role Diagnostic
 * Password-gated diagnostic with role selection and artifact rendering
 */

import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import ReactMarkdown from "react-markdown";
import { webinarApi } from "./webinarApi";
import { shapeOnepager } from "../../lib/onepagerShaper";
import { useRoadmap } from "../../context/RoadmapContext";

type RoleId = "OWNER" | "SALES" | "OPS" | "DELIVERY";

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  options?: Array<{ id: string; label: string }>;
  cta?: { type: string; label: string };
  reveal?: {
    headline: string;
    signals: string[];
    diagnosis: string;
  };
  isCompletionStep?: boolean;
}

interface WebinarDiagnosticProps {
  isAuthorized: boolean;
  onAuthChange: (authorized: boolean) => void;
  onSwitchToRegister: () => void;
}

const ROLE_LABELS: Record<RoleId, string> = {
  OWNER: "Owner / Executive",
  SALES: "Sales",
  OPS: "Operations",
  DELIVERY: "Delivery",
};

// Session State Keys
const AUTH_KEY = "webinar_auth";
const COMPLETED_KEY = "webinar_completed_roles";
const ORIENTATION_DONE_KEY = "webinar_orientation_done";
const ROLE_PAYLOADS_KEY = "webinar_role_payloads";
const PROGRESS_KEY = "webinar_progress";
const TEAM_REPORT_KEY = "webinar_team_report";
const ROLE_RESULTS_KEY = "webinar_role_results";
const SESSION_ID_KEY = "webinar_session_id";
const TEAM_RESULTS_KEY = "webinar_team_results";

export function WebinarDiagnostic({
  isAuthorized,
  onAuthChange,
  onSwitchToRegister,
}: WebinarDiagnosticProps) {
  const { setPayload } = useRoadmap();
  const [, setLocation] = useLocation();
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const [selectedRole, setSelectedRole] = useState<RoleId | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // Evidence Capture State
  const [pendingStep, setPendingStep] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [evidenceInput, setEvidenceInput] = useState("");

  // Role Progress State

  const [completedRoles, setCompletedRoles] = useState<RoleId[]>([]);
  const [questionStep, setQuestionStep] = useState(0);
  const [currentRoleEvidence, setCurrentRoleEvidence] = useState<
    Record<string, string>
  >({});
  const [viewMode, setViewMode] = useState<
    | "AUTH"
    | "ORIENTATION"
    | "ROLE_SELECT"
    | "CHAT"
    | "ROLE_COMPLETE"
    | "RESULTS"
  >("AUTH");

  const [teamResults, setTeamResults] = useState<any>(null);
  const [narrative, setNarrative] = useState<any>(null); // Phase 4D: Narrative Lattice
  const [showDebug, setShowDebug] = useState(false); // Phase 4D: Debug Toggle
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // PDF Generation Handler
  const handleGeneratePdf = async () => {
    if (completedRoles.length < 4) return;
    setIsPdfGenerating(true);
    try {
      // Ensure we have a session ID
      const effSessionId = sessionStorage.getItem(SESSION_ID_KEY) || sessionId;
      if (!effSessionId) throw new Error("No session ID found");

      const rawPayloads = sessionStorage.getItem(ROLE_PAYLOADS_KEY);
      const rolePayloads = rawPayloads ? JSON.parse(rawPayloads) : {};

      const blob = await webinarApi.generateTeamPdf(effSessionId, rolePayloads);

      // trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Team_Diagnostic_${effSessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error("PDF Gen failed", err);
      // Optional: set global error or toast
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // A7: One-time password check
  // 1. Unified Persistence Helpers
  const loadCompletedRoles = (): RoleId[] => {
    const saved = sessionStorage.getItem(COMPLETED_KEY);
    if (!saved) return [];
    try {
      return JSON.parse(saved) as RoleId[];
    } catch {
      return [];
    }
  };

  function normalizeRole(r: string): RoleId {
    switch (r?.toLowerCase()) {
      case "owner":
        return "OWNER";
      case "sales":
        return "SALES";
      case "ops":
      case "operations":
        return "OPS";
      case "delivery":
        return "DELIVERY";
      default:
        return selectedRole!;
    }
  }

  const markRoleCompleted = (roleId: RoleId) => {
    const finalId = roleId || normalizeRole("");
    console.info("[Webinar] completion detected", { role: finalId });

    const prev = loadCompletedRoles();
    const next = Array.from(new Set([...prev, finalId]));

    sessionStorage.setItem(COMPLETED_KEY, JSON.stringify(next));
    setCompletedRoles(next);

    console.info("[Webinar] completedRoles(state)", next);
    console.info(
      "[Webinar] completedRoles(storage)",
      sessionStorage.getItem(COMPLETED_KEY),
    );
  };

  const startRole = (roleId: RoleId) => {
    // 2. Hard Guard on Role Entry
    if (completedRoles.includes(roleId)) {
      setViewMode(completedRoles.length === 4 ? "RESULTS" : "ROLE_SELECT");
      setSelectedRole(null);
      return;
    }
    setSelectedRole(roleId);
  };

  useEffect(() => {
    const isAuth = sessionStorage.getItem(AUTH_KEY) === "true";
    const orientationDone =
      sessionStorage.getItem(ORIENTATION_DONE_KEY) === "true";

    if (isAuth) {
      if (!isAuthorized) {
        onAuthChange(true);
      }
      if (!orientationDone) {
        setViewMode("ORIENTATION");
      } else {
        setViewMode("ROLE_SELECT");
      }
    } else {
      setViewMode("AUTH");
    }

    // Restore diagnostic state
    const savedRoles = loadCompletedRoles();
    setCompletedRoles(savedRoles);

    if (savedRoles.length === 4) {
      setViewMode("RESULTS");
    }





    const savedResults = sessionStorage.getItem(TEAM_RESULTS_KEY);
    if (savedResults) {
      try {
        setTeamResults(JSON.parse(savedResults));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, pendingStep]);

  // Initialize diagnostic when role selected
  useEffect(() => {
    if (selectedRole && isAuthorized) {
      // Hard guard in case of state desync
      if (completedRoles.includes(selectedRole)) {
        setViewMode(completedRoles.length === 4 ? "RESULTS" : "ROLE_SELECT");
        setSelectedRole(null);
        return;
      }

      setViewMode("CHAT");
      initializeDiagnostic();
    }
  }, [selectedRole, isAuthorized, completedRoles]);

  const handlePasswordSubmit = async () => {
    if (!passwordInput.trim()) {
      setPasswordError("Please enter a password");
      return;
    }

    setIsValidating(true);
    setPasswordError("");

    try {
      const result = await webinarApi.validatePassword(passwordInput);

      if (result.ok) {
        onAuthChange(true);
        // Store auth in session storage
        sessionStorage.setItem(AUTH_KEY, "true");
        sessionStorage.setItem(
          "webinar_pw_version",
          String(result.passwordVersion),
        );
        setViewMode("ORIENTATION");
      } else {
        setPasswordError(result.message || "Invalid password");
        // Show registration prompt
        setTimeout(() => {
          onSwitchToRegister();
        }, 2000);
      }
    } catch (err: any) {
      setPasswordError(err.message || "Validation failed");
    } finally {
      setIsValidating(false);
    }
  };

  const randomDelay = () => {
    const min = 3000;
    const max = 9000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const initializeDiagnostic = async (skipDelay: boolean = true) => {
    setIsLoading(true);
    setIsThinking(!skipDelay);
    setMessages([]);
    setAnswers({});
    setQuestionStep(0);
    setCurrentRoleEvidence({});

    // Generate new session ID for this role
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);

    try {
      if (!skipDelay) {
        const delayMs = randomDelay();
        await delay(delayMs);
      }

      const response = await webinarApi.sendDiagnosticMessage(
        "",
        newSessionId,
        selectedRole!.toLowerCase() as any,
      );

      if (response.sessionId) {
        sessionStorage.setItem(SESSION_ID_KEY, response.sessionId);
      }

      setMessages(() => [
        {
          id: Date.now().toString(),
          role: "agent",
          text: response.message,
          options: response.options,
          cta: response.cta,
          reveal: response.reveal,
        },
      ]);
    } catch (err: any) {
      setMessages(() => [
        {
          id: Date.now().toString(),
          role: "agent",
          text: err.message || "Failed to start diagnostic",
          options: [],
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const handleOptionClick = async (optionId: string, label: string) => {
    if (isLoading) return;

    // A2: Show evidence input for Q1/Q2/Q3 (Universal for all roles)
    // Drive off question index, not labels
    if (questionStep < 3) {
      setPendingStep({ id: optionId, label });
      return;
    }

    await processMessage(optionId, label);
  };

  const handleEvidenceSubmit = async () => {
    if (!pendingStep) return;
    const { id, label } = pendingStep;
    const evidence = evidenceInput.trim();

    setPendingStep(null);
    setEvidenceInput("");

    await processMessage(id, label, evidence);
  };

  const processMessage = async (
    optionId: string,
    label: string,
    evidence?: string,
  ) => {
    // Track answer for persistence
    const stepKey = `Q${questionStep + 1}`;
    setAnswers((prev: Record<string, string>) => ({
      ...prev,
      [stepKey]: optionId,
    }));

    if (evidence) {
      setCurrentRoleEvidence((prev: Record<string, string>) => ({
        ...prev,
        [stepKey]: evidence,
      }));
    }

    // Add user message
    setMessages((prev: Message[]) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        text: label,
      },
    ]);

    setIsLoading(true);
    setIsThinking(true);

    try {
      const delayMs = randomDelay();
      await delay(delayMs);

      const response = await webinarApi.sendDiagnosticMessage(
        optionId,
        sessionId,
        selectedRole!.toLowerCase() as any,
        evidence,
      );

      if (response.sessionId) {
        sessionStorage.setItem(SESSION_ID_KEY, response.sessionId);
      }

      setMessages((prevMessages: Message[]) => {
        const isComplete =
          Array.isArray(response.options) && response.options.length === 0;

        // A5: Gate backend CTA until 4/4
        // Note: completedRoles hasn't updated yet in this render cycle if we just marked it,
        // but it will be 4 in the next. Simplified check:
        const finalCta =
          isComplete && Array.from(new Set([...completedRoles, selectedRole!])).length === 4
            ? response.cta
            : undefined;

        return [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            role: "agent",
            text: response.message,
            options: response.options,
            cta: finalCta,
            reveal: response.reveal,
            isCompletionStep: isComplete,
          },
        ];
      });

      // Increment question step
      setQuestionStep((prev: number) => prev + 1);



      // Completion detection: Options empty (A1/T1)
      const isComplete =
        Array.isArray(response.options) && response.options.length === 0;

      if (isComplete) {
        console.info("[Webinar] completion detected", {
          role: selectedRole,
          respRole: response.role,
          optionsLen: response.options?.length,
        });

        // Track answer for persistence
        const payloads = JSON.parse(
          sessionStorage.getItem(ROLE_PAYLOADS_KEY) || "{}",
        );
        payloads[selectedRole!] = {
          answers: { ...answers, [stepKey]: optionId },
          evidence: evidence
            ? { ...currentRoleEvidence, [stepKey]: evidence }
            : currentRoleEvidence,
        };
        sessionStorage.setItem(ROLE_PAYLOADS_KEY, JSON.stringify(payloads));

        // Persistent Reveal (Synthesis)
        if (response.reveal) {
          const results = JSON.parse(
            sessionStorage.getItem(ROLE_RESULTS_KEY) || "{}",
          );
          results[selectedRole!] = response.reveal;
          sessionStorage.setItem(ROLE_RESULTS_KEY, JSON.stringify(results));
        }

        // Mark completed authoritative
        markRoleCompleted(selectedRole!);
        setViewMode("ROLE_COMPLETE");
      }

      if (response.teamReport) {

        sessionStorage.setItem(
          TEAM_REPORT_KEY,
          JSON.stringify(response.teamReport),
        );
      }
    } catch (err: any) {
      setMessages((prev: Message[]) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "agent",
          text: err.message || "Failed to process response",
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const handleGenerateStrategy = async () => {
    setIsGeneratingStrategy(true);
    setStrategyError(null);

    try {
      const storedSessionId =
        sessionStorage.getItem(SESSION_ID_KEY) || sessionId || crypto.randomUUID();
      const rolePayloads = JSON.parse(
        sessionStorage.getItem(ROLE_PAYLOADS_KEY) || "{}",
      );

      if (Object.keys(rolePayloads).length < 4) {
        throw new Error("All 4 role assessments must be completed.");
      }

      const response = await webinarApi.generateTeamResults({
        sessionId: storedSessionId,
        rolePayloads,
      });

      if (response && response.teamResults) {
        sessionStorage.setItem(
          TEAM_RESULTS_KEY,
          JSON.stringify(response.teamResults),
        );
        setTeamResults(response.teamResults);
        if (response.narrative) {
          setNarrative(response.narrative);
        }
      } else {
        console.error("[Webinar] Invalid response shape", response);
        setStrategyError("Team strategy unavailable. Please try again.");
      }
    } catch (err: any) {
      console.error("[Webinar] Strategy generation failed", err);
      setStrategyError(err.message || "Failed to generate team strategy");
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const handleCta = (cta: any) => {
    if (cta.type === "generate_mini_roadmap") {
      const latestReveal = [...messages]
        .reverse()
        .find((m) => m.reveal)?.reveal;
      setPayload(shapeOnepager(latestReveal, answers, {}));
      setLocation("/onepager");
    } else if (cta.type === "view_sample_roadmap") {
      setLocation("/cohort");
    } else if (cta.type === "generate_full_roadmap") {
      handleGenerateStrategy();
    }
  };

  // Password gate
  if (viewMode === "AUTH" || !isAuthorized) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Hey — let's get you started
          </h2>
          <p className="text-slate-400">What's the diagnostic access code?</p>
        </div>

        <div className="space-y-4">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
            placeholder="Enter password"
            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {passwordError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{passwordError}</p>
              <p className="text-slate-400 text-sm mt-2">
                <button
                  onClick={onSwitchToRegister}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Register now
                </button>{" "}
                to get the updated password.
              </p>
            </div>
          )}

          <button
            onClick={handlePasswordSubmit}
            disabled={isValidating}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isValidating ? "Validating..." : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  // Orientation View
  if (viewMode === "ORIENTATION") {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Diagnostic Orientation
          </h2>
          <div className="space-y-4 text-slate-300 text-lg leading-relaxed">
            <p>
              I'm going to present you with a series of multiple choice
              questions. After each you will will have an opportunity to add
              details. If you skip this, no problem. If you add it, we'll better
              understand how to help you move forward.
            </p>
            <p className="font-semibold text-white">Ready to get started?</p>
          </div>
        </div>

        <button
          onClick={() => {
            sessionStorage.setItem(ORIENTATION_DONE_KEY, "true");
            setViewMode("ROLE_SELECT");
          }}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20"
        >
          Let's go!
        </button>
      </div>
    );
  }

  // Role selector
  if (viewMode === "ROLE_SELECT") {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-2xl w-full">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Team Diagnostic Panel
            </h2>
            <p className="text-slate-400">
              Complete the assessment for all four roles to unlock full team
              results.
            </p>
          </div>
          <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-300 border border-slate-700">
            {completedRoles.length}/4 Roles
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {(Object.keys(ROLE_LABELS) as RoleId[]).map((role) => {
            const isCompleted = completedRoles.includes(role);
            return (
              <button
                key={role}
                onClick={() => !isCompleted && startRole(role)}
                disabled={isCompleted}
                className={`group px-6 py-4 border rounded-lg font-medium transition-all text-left flex items-center justify-between ${isCompleted
                  ? "bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-slate-950 border-slate-700 hover:border-blue-500 hover:bg-slate-900 text-white"
                  }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">
                    {ROLE_LABELS[role]}
                  </span>
                  {isCompleted && (
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-0.5">
                      Completed
                    </span>
                  )}
                </div>
                {isCompleted ? (
                  <svg
                    className="w-5 h-5 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-slate-600 group-hover:text-blue-500 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {completedRoles.length === 4 && (
          <button
            onClick={() => setViewMode("RESULTS")}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3"
          >
            <span>View Constitutional Diagnostic Results</span>
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }

  // Results View
  if (viewMode === "RESULTS") {

    const rolePayloads = JSON.parse(
      sessionStorage.getItem(ROLE_PAYLOADS_KEY) || "{}",
    );




    return (
      <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden w-full max-w-7xl mx-auto shadow-2xl relative pb-32 min-h-[80vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-900 bg-slate-950 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Diagnostic Results
            </h2>
            <p className="text-slate-400 text-sm">
              {teamResults
                ? "Board-Ready Team Packet"
                : "Preliminary Role Recap (Synthesis Pending)"}
            </p>
          </div>
          {/* Back Button */}
          {!teamResults && (
            <button
              onClick={() => setViewMode("ROLE_SELECT")}
              className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
            >
              Back to Roles
            </button>
          )}
        </div>

        <div className="p-8 space-y-12">
          {/* 1. Pre-Generation Recap (Only if no results yet) */}
          {!teamResults && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.keys(ROLE_LABELS) as RoleId[]).map((roleId) => {
                  const isDone = completedRoles.includes(roleId);
                  const payload = rolePayloads[roleId];
                  return (
                    <div key={roleId} className={`p-6 rounded-xl border ${isDone ? 'bg-slate-900/50 border-emerald-500/30' : 'bg-slate-900/30 border-slate-800'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-slate-200">{ROLE_LABELS[roleId]}</h4>
                        {isDone ? <span className="text-xs text-emerald-400 font-bold">READY</span> : <span className="text-xs text-slate-500">PENDING</span>}
                      </div>
                      {isDone && payload ? (
                        <div className="text-xs text-slate-500 space-y-1">
                          <p>Answers captured.</p>
                          <p>{Object.keys(payload.answers || {}).length} data points.</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 italic">Waiting for input...</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Strategy Error Banner */}
              {strategyError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <p className="text-red-400 font-medium mb-2">{strategyError}</p>
                  <button
                    onClick={handleGenerateStrategy}
                    className="text-sm text-blue-400 underline hover:text-blue-300"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Generate CTA */}
              <div className="flex justify-center pt-8">
                <button
                  onClick={handleGenerateStrategy}
                  disabled={isGeneratingStrategy || completedRoles.length < 4}
                  className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-lg shadow-2xl shadow-emerald-900/40 transition-all flex items-center gap-4"
                >
                  {isGeneratingStrategy ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Synthesizing Board Packet...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Constitutional Strategy</span>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 2. BOARD-READY PACKET (If results exist) */}
          {teamResults && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">

              {/* A. EXECUTIVE SUMMARY Panel */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="flex flex-col md:flex-row gap-8 relative z-10">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-widest rounded-full">
                        Confidence: {teamResults.team?.confidenceLabel || "High"}
                      </span>
                      <span className="text-xs font-mono text-slate-500">ID: {sessionId?.slice(0, 8)}</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-white leading-tight">
                      {teamResults.team?.headline || "Execution Constraint Identified"}
                    </h3>
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Root Constraint</h4>
                      <p className="text-amber-400 font-medium text-lg">
                        {teamResults.team?.primaryConstraint || teamResults.team?.rootConstraint || "Constraint Identifying..."}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">The organization routes decisions through a human instead of a system.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="text-[10px] uppercase text-slate-500 tracking-widest font-bold">Leaks</h5>
                        <ul className="list-disc pl-4 space-y-1">
                          {(teamResults.team?.leaks || []).slice(0, 3).map((l: string, i: number) => (
                            <li key={i} className="text-xs text-slate-400">{l}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-[10px] uppercase text-slate-500 tracking-widest font-bold">Outcomes</h5>
                        <ul className="list-disc pl-4 space-y-1">
                          {(teamResults.team?.outcomes || []).slice(0, 3).map((o: string, i: number) => (
                            <li key={i} className="text-xs text-slate-300">{o}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Alignment/Contradictions */}
                  <div className="md:w-1/3 bg-slate-900/50 rounded-xl p-5 border border-slate-800 space-y-6">
                    <div>
                      <h5 className="text-[10px] uppercase text-slate-500 tracking-widest font-bold mb-2">Alignment</h5>
                      <p className="text-sm text-slate-300 leading-relaxed">{teamResults.team?.alignment}</p>
                    </div>
                    <div>
                      <h5 className="text-[10px] uppercase text-slate-500 tracking-widest font-bold mb-2">Contradictions</h5>
                      <p className="text-sm text-slate-300 leading-relaxed">{teamResults.team?.contradictions}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* B. ROLE SYNTHESIS GRID */}
              <div>
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Role Synthesis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Ensure we render 4 items safe */}
                  {(teamResults.roleSummaries || []).map((role: any, idx: number) => {
                    const verdicts: any = {
                      owner: "You are absorbing system failures instead of enforcing structure.",
                      sales: "Revenue depends on heroics instead of enforced follow-up.",
                      ops: "Execution speed exceeds system control.",
                      delivery: "Momentum decays after handoff due to unclear ownership."
                    };
                    return (
                      <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
                        <h4 className="text-sm font-black text-white uppercase tracking-wide mb-3">{role.roleName}</h4>
                        <p className="text-xs font-bold text-white mb-3 bg-white/5 p-2 rounded border-l-2 border-emerald-500">
                          {verdicts[role.roleId]}
                        </p>
                        <div className="min-h-[60px] mb-4">
                          <p className="text-sm font-bold text-blue-400 leading-snug">{role.headline}</p>
                        </div>
                        <div className="space-y-3 mb-4">
                          {(role.signals || []).slice(0, 2).map((s: string, si: number) => (
                            <div key={si} className="text-[10px] py-1 px-2 bg-slate-950 rounded border border-slate-800 text-slate-400">
                              {s}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 italic border-t border-slate-800 pt-3">
                          "{role.diagnosis}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* C. THE BOARD (NOW / NEXT / LATER) */}
              <div>
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  The Board
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* NOW */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-emerald-500 pb-2">
                      <h4 className="font-black text-emerald-500 uppercase tracking-widest text-sm">NOW (Leverage)</h4>
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded">P0</span>
                    </div>
                    <div className="space-y-3">
                      {(teamResults.board?.now || []).map((t: any, i: number) => (
                        <div key={i} className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
                          <p className="text-sm font-bold text-white mb-2">{t.title}</p>
                          <p className="text-xs text-slate-400 mb-2">{t.why}</p>
                          {t.owner && <span className="text-[9px] uppercase font-bold text-emerald-600 bg-emerald-900/20 px-1.5 py-0.5 rounded">{t.owner}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* NEXT */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-blue-500 pb-2">
                      <h4 className="font-black text-blue-500 uppercase tracking-widest text-sm">NEXT (Sequence)</h4>
                      <span className="text-[10px] font-bold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded">P1</span>
                    </div>
                    <div className="space-y-3">
                      {(teamResults.board?.next || []).map((t: any, i: number) => (
                        <div key={i} className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg opacity-80">
                          <p className="text-sm font-bold text-white mb-2">{t.title}</p>
                          <p className="text-xs text-slate-400">{t.why}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* LATER */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-slate-700 pb-2">
                      <h4 className="font-black text-slate-500 uppercase tracking-widest text-sm">LATER (Scale)</h4>
                      <span className="text-[10px] font-bold bg-slate-800 text-slate-500 px-2 py-0.5 rounded">P2</span>
                    </div>
                    <div className="space-y-3">
                      {(teamResults.board?.later || []).map((t: any, i: number) => (
                        <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 border-dashed opacity-60">
                          <p className="text-sm font-bold text-slate-300 mb-1">{t.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* D. NARRATIVE LATTICE (Phase 4) */}
              {narrative && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 border-t border-slate-800 pt-8 mt-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-px flex-1 bg-slate-800"></div>
                    <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      Systemic Deep Dive
                    </h3>
                    <div className="h-px flex-1 bg-slate-800"></div>
                  </div>

                  {/* 1. Overview & Constraint */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                      <h4 className="text-emerald-500 font-bold mb-2 uppercase text-xs tracking-wider">The Situation</h4>
                      <h3 className="text-xl font-bold text-white mb-2">{narrative.overview?.content?.headline}</h3>
                      <div className="prose prose-invert prose-sm text-slate-400">
                        <ReactMarkdown>{narrative.overview?.content?.body || ''}</ReactMarkdown>
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                      <h4 className="text-amber-500 font-bold mb-2 uppercase text-xs tracking-wider">The Core Constraint</h4>
                      <h3 className="text-xl font-bold text-white mb-2">{narrative.constraint?.content?.headline}</h3>
                      <div className="prose prose-invert prose-sm text-slate-400">
                        <ReactMarkdown>{narrative.constraint?.content?.body || ''}</ReactMarkdown>
                      </div>
                      {/* Implications */}
                      {narrative.constraint?.content?.implications && (
                        <ul className="mt-4 space-y-1">
                          {narrative.constraint.content.implications.map((imp: string, i: number) => (
                            <li key={i} className="text-xs text-amber-500/80 flex gap-2">
                              <span>•</span> {imp}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* 2. Failure Mode & Gaps */}
                  <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl relative overflow-hidden">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="md:col-span-2">
                        <h4 className="text-blue-500 font-bold mb-2 uppercase text-xs tracking-wider">How You Are Compensating</h4>
                        <h3 className="text-2xl font-bold text-white mb-4">{narrative.failureMode?.content?.headline}</h3>
                        <div className="prose prose-invert text-slate-300">
                          <ReactMarkdown>{narrative.failureMode?.content?.body || ''}</ReactMarkdown>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {(narrative.gaps || []).map((gap: any, i: number) => (
                          <div key={i} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                            <h5 className="font-bold text-slate-200 text-sm mb-1">{gap.content?.headline}</h5>
                            <div className="prose prose-invert prose-xs text-slate-500 text-xs">
                              <ReactMarkdown>{gap.content?.body || ''}</ReactMarkdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. Role Patterns Highlights (If Any) */}
                  {Object.keys(narrative.roleSections || {}).length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-slate-500 font-bold uppercase text-xs tracking-wider">Role-Specific Patterns</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {['owner', 'sales', 'ops', 'delivery'].map(role => {
                          const blocks = narrative.roleSections?.[role] || [];
                          if (blocks.length === 0) return null;
                          return (
                            <div key={role} className="space-y-3">
                              <div className="text-xs font-bold text-slate-600 uppercase border-b border-slate-800 pb-1">{role}</div>
                              {blocks.map((b: any, i: number) => (
                                <div key={i} className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                                  <p className="text-sm font-bold text-white mb-1">{b.content?.headline?.replace(/^\w+ Pattern: /, '')}</p>
                                  <p className="text-xs text-slate-400 italic">"{b.content?.implications?.[0]?.replace('Tell: ', '').replace(/"/g, '')}"</p>
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4. Trajectory (Timing/Outcome) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                      <h4 className="text-[10px] uppercase text-slate-500 font-bold mb-2">Timing</h4>
                      <p className="text-lg font-bold text-white">{narrative.timing?.content?.headline}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                      <h4 className="text-[10px] uppercase text-slate-500 font-bold mb-2">Severity</h4>
                      <p className="text-lg font-bold text-amber-500">{narrative.severity?.content?.headline}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                      <h4 className="text-[10px] uppercase text-slate-500 font-bold mb-2">Projected Outcome</h4>
                      <p className="text-lg font-bold text-red-400">{narrative.outcome?.content?.headline}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* D. CONTRACTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-800">
                <div>
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="text-lg">🛡️</span> Guardrails
                  </h4>
                  <ul className="space-y-3">
                    {(teamResults.contracts?.guardrails || []).map((g: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-400">
                        <span className="w-1.5 h-1.5 mt-2 bg-amber-500 rounded-full shrink-0"></span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="text-lg">⚖️</span> Operating Rules
                  </h4>
                  <ul className="space-y-3">
                    {(teamResults.contracts?.operatingRules || []).map((r: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-400">
                        <span className="w-1.5 h-1.5 mt-2 bg-blue-500 rounded-full shrink-0"></span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          )}

          {/* DEBUG PANEL (Phase 4D) */}
          {showDebug && narrative && (
            <div className="mx-8 mb-32 p-6 bg-black/80 font-mono text-xs text-green-400 border border-green-900 rounded-xl overflow-x-auto">
              <h4 className="font-bold text-green-500 mb-2">[DEBUG] Narrative Lattice State</h4>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-slate-500 mb-1">Selected IDs ({narrative.selectedIds?.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {narrative.selectedIds?.map((id: string) => (
                      <span key={id} className="px-1.5 py-0.5 bg-green-900/30 rounded border border-green-900/50">{id}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Taxonomy</p>
                  <pre className="text-[10px] text-green-600/80">{JSON.stringify({
                    constraint: narrative.constraint?.id,
                    failure: narrative.failureMode?.id,
                    timing: narrative.timing?.id,
                    severity: narrative.severity?.id,
                    outcome: narrative.outcome?.id
                  }, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STICKY FOOTER CTA */}
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700 p-4 px-8 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded border ${showDebug ? 'bg-green-900/20 text-green-400 border-green-900' : 'bg-transparent text-slate-700 border-slate-800 hover:border-slate-600'}`}
            >
              Lattice Debug
            </button>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${completedRoles.length === 4 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`}></div>
              <span className="text-sm font-bold text-white tracking-wide">
                {completedRoles.length}/4 Roles Complete
              </span>
            </div>
            {teamResults && (
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="rounded bg-slate-800 border-slate-600 text-emerald-500 focus:ring-emerald-500" defaultChecked />
                <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">Email me a copy</span>
              </label>
            )}
          </div>

          <button
            onClick={teamResults ? handleGeneratePdf : handleGenerateStrategy}
            disabled={completedRoles.length < 4 || isGeneratingStrategy || isPdfGenerating}
            className={`
                   px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center gap-3
                   ${teamResults
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              }
                   disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed
                `}
          >
            {isGeneratingStrategy || isPdfGenerating ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>{isPdfGenerating ? 'Generating PDF...' : 'Synthesizing...'}</span>
              </>
            ) : (
              teamResults ? (
                <>
                  <span>Download Board Packet (PDF)</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </>
              ) : (
                <>
                  <span>Create Board Packet</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </>
              )
            )}
          </button>
        </div>
      </div>
    );
  }

  // Role Complete View
  if (viewMode === "ROLE_COMPLETE") {
    const latestReveal = [...messages].reverse().find((m) => m.reveal)?.reveal;
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden max-w-2xl w-full">
        <div className="p-8 text-center border-b border-slate-800 bg-slate-950">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Role Assessment Complete
          </h2>
          <p className="text-slate-400">
            {ROLE_LABELS[selectedRole as RoleId]} findings captured.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {latestReveal && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-3">
                {latestReveal.headline}
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                {latestReveal.diagnosis}
              </p>
              <div className="flex flex-wrap gap-2">
                {latestReveal.signals.map((signal: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-slate-700"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {completedRoles.length === 4 ? (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setViewMode("RESULTS")}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3"
                >
                  <span>View Full Diagnostic Results</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() =>
                    handleCta({
                      type: "generate_full_roadmap",
                      label: "Convert to Strategy",
                    })
                  }
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-xl shadow-emerald-900/20"
                >
                  Convert to Full Fixing Strategy
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setViewMode("ROLE_SELECT");
                  setSelectedRole(null);
                  setMessages([]);
                  setAnswers({});
                }}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3"
              >
                <span>Continue to Next Role</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Diagnostic chat
  if (viewMode === "CHAT" && selectedRole) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden max-w-4xl w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              {ROLE_LABELS[selectedRole as RoleId]} Diagnostic
            </h3>
            <p className="text-xs text-slate-400">Role-specific assessment</p>
          </div>
        </div>

        {/* Messages */}
        <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
          {messages.map((msg: Message) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-4 ${msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-950 text-slate-200"
                  }`}
              >
                {msg.role === "agent" ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>

                    {/* Reveal */}
                    {msg.reveal && (
                      <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 px-4 py-4">
                        <h4 className="text-base font-semibold text-white mb-2">
                          {msg.reveal.headline}
                        </h4>
                        <ul className="mb-3 list-disc pl-5 text-sm text-slate-300 space-y-1">
                          {msg.reveal.signals.map(
                            (signal: string, i: number) => (
                              <li key={i}>{signal}</li>
                            ),
                          )}
                        </ul>
                        <p className="text-sm text-slate-400 font-medium">
                          {msg.reveal.diagnosis}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm">{msg.text}</div>
                )}

                {/* Options */}
                {msg.options && msg.options.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    {msg.options.map(
                      (option: { id: string; label: string }) => (
                        <button
                          key={option.id}
                          onClick={() =>
                            handleOptionClick(option.id, option.label)
                          }
                          className="w-full px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-left text-slate-100 rounded-lg border border-slate-700 transition-colors"
                        >
                          {option.label}
                        </button>
                      ),
                    )}
                  </div>
                )}

                {/* CTA / Completion Gating */}
                {(msg.cta || msg.isCompletionStep) && (
                  <div className="mt-3 flex flex-col gap-2">
                    {/* Gated PDF + Convert + Backend CTA until 4/4 Roles Complete */}
                    {completedRoles.length === 4 ? (
                      <div className="flex gap-2">
                        {msg.cta && (
                          <button
                            onClick={() => handleCta(msg.cta)}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                          >
                            {msg.cta.label}
                          </button>
                        )}
                        <button
                          onClick={() => setViewMode("RESULTS")}
                          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                          View Results
                        </button>
                      </div>
                    ) : (
                      /* 4-Role Progression CTA (Role 1, 2, or 3 Completion) */
                      <button
                        onClick={() => {
                          setViewMode("ROLE_SELECT");
                          setSelectedRole(null);
                          setMessages([]);
                          setAnswers({});
                        }}
                        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all flex items-center justify-between"
                      >
                        <span>
                          {completedRoles.length === 3
                            ? "Continue to Final Role"
                            : "Continue to Next Role"}
                        </span>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-400 animate-pulse">
                    {isThinking ? "Thinking..." : "Processing..."}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* A3: Evidence Input UI */}
          {pendingStep && (
            <div className="flex justify-end">
              <div className="bg-slate-900 border border-blue-500/30 rounded-xl p-5 max-w-[85%] shadow-lg shadow-blue-500/5">
                <h4 className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Add Context (Optional)
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  Briefly share a quick example (1–2 sentences) to tune the
                  diagnostic.
                </p>
                <textarea
                  value={evidenceInput}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEvidenceInput(e.target.value)
                  }
                  placeholder="e.g., 'We miss follow-up because leads sit in inbox for days.'"
                  className="w-full h-24 px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 resize-none"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setPendingStep(null);
                      setEvidenceInput("");
                      processMessage(pendingStep.id, pendingStep.label);
                    }}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-lg transition-all"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleEvidenceSubmit}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  }

  return null;
}

export default WebinarDiagnostic;
