--
-- PostgreSQL database dump
--

\restrict ZZpLTNWdVeLKuUyseoeG4DYAiSaqqyg7V5zuSq2kOI0yuDrFr2kxjQRDPpUf7sk

-- Dumped from database version 17.8 (6108b59)
-- Dumped by pg_dump version 17.8 (Ubuntu 17.8-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: core; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA core;


--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA drizzle;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: intake_phase; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.intake_phase AS ENUM (
    'OPEN_INITIAL',
    'CLOSED_V1',
    'REOPEN_EXECUTIVE',
    'CLOSED_V2',
    'LOCKED_FINAL'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: diagnostics; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.diagnostics (
    id uuid NOT NULL,
    tenant_id uuid,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: entities; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.entities (
    id uuid NOT NULL,
    tenant_id uuid,
    entity_type text NOT NULL,
    external_id text,
    vertical text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: roadmaps; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.roadmaps (
    id uuid NOT NULL,
    tenant_id uuid,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: tenants; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.tenants (
    id uuid NOT NULL,
    name text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.users (
    id uuid NOT NULL,
    tenant_id uuid,
    email text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: -
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: -
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: -
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: __drizzle_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint NOT NULL
);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.__drizzle_migrations_id_seq OWNED BY public.__drizzle_migrations.id;


--
-- Name: agent_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    system_identity text NOT NULL,
    business_context text,
    custom_instructions text,
    role_playbook text NOT NULL,
    tool_context json DEFAULT '{"tools":[]}'::json,
    is_active boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    openai_assistant_id character varying(128),
    openai_vector_store_id character varying(128),
    openai_model character varying(64) DEFAULT 'gpt-4-1106-preview'::character varying,
    last_provisioned_at timestamp without time zone,
    roadmap_metadata json DEFAULT '{}'::json,
    agent_type text DEFAULT 'roadmap_coach'::text NOT NULL,
    config_version integer DEFAULT 1 NOT NULL,
    instructions_hash text,
    last_updated_by uuid
);


--
-- Name: TABLE agent_configs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.agent_configs IS 'Agent configurations - one assistant per tenant with versioned prompts';


--
-- Name: COLUMN agent_configs.system_identity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.agent_configs.system_identity IS 'Locked system identity and mission (Tony controls)';


--
-- Name: COLUMN agent_configs.business_context; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.agent_configs.business_context IS 'Auto-generated from intake + roadmap data';


--
-- Name: COLUMN agent_configs.custom_instructions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.agent_configs.custom_instructions IS 'Owner-editable preferences and communication style';


--
-- Name: COLUMN agent_configs.role_playbook; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.agent_configs.role_playbook IS 'Role-specific workflows, priorities, guardrails (Tony IP)';


--
-- Name: COLUMN agent_configs.tool_context; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.agent_configs.tool_context IS 'JSON array of {key, enabled, verifiedCompute} for each tool';


--
-- Name: COLUMN agent_configs.roadmap_metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.agent_configs.roadmap_metadata IS 'Extracted roadmap metadata: pain points, goals, systems, timeline';


--
-- Name: COLUMN agent_configs.agent_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.agent_configs.agent_type IS 'Type of assistant: roadmap_coach (default), exec_overview (future)';


--
-- Name: COLUMN agent_configs.config_version; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.agent_configs.config_version IS 'Version number for tracking prompt iterations';


--
-- Name: COLUMN agent_configs.instructions_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.agent_configs.instructions_hash IS 'SHA-256 hash of composed instructions for change detection';


--
-- Name: agent_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_config_id uuid,
    event_type character varying(100) NOT NULL,
    metadata json DEFAULT '{}'::json,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    interaction_mode text
);


--
-- Name: TABLE agent_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.agent_logs IS 'Event log for agent provisioning, queries, syncs, and errors';


--
-- Name: agent_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_thread_id uuid NOT NULL,
    role character varying(20) NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT agent_messages_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying])::text[])))
);


--
-- Name: TABLE agent_messages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.agent_messages IS 'Persists all agent conversation messages for history and audit';


--
-- Name: agent_routing_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_routing_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    pattern text NOT NULL,
    route_to character varying(32) NOT NULL,
    priority integer DEFAULT 10,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT agent_routing_rules_route_to_check CHECK (((route_to)::text = ANY ((ARRAY['owner'::character varying, 'ops'::character varying, 'tc'::character varying, 'agent_support'::character varying])::text[])))
);


--
-- Name: TABLE agent_routing_rules; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.agent_routing_rules IS 'Pattern-based routing rules for intelligent agent selection';


--
-- Name: agent_strategy_contexts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_strategy_contexts (
    tenant_id uuid NOT NULL,
    context json NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE agent_strategy_contexts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.agent_strategy_contexts IS 'Stores runtime StrategyContext (roadmap signals, tactical frame, objectives) for each tenant. Used for debugging and auditing assistant behavior.';


--
-- Name: COLUMN agent_strategy_contexts.context; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.agent_strategy_contexts.context IS 'JSONB containing StrategyContext: { tenantId, personaRole, roadmapSignals, tacticalFrame, objectives }';


--
-- Name: agent_threads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_threads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    agent_config_id uuid NOT NULL,
    role_type character varying(32) NOT NULL,
    openai_thread_id character varying(128) NOT NULL,
    actor_user_id uuid NOT NULL,
    actor_role character varying(32) NOT NULL,
    visibility character varying(32) DEFAULT 'owner'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    last_activity_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: assisted_synthesis_agent_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assisted_synthesis_agent_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: assisted_synthesis_agent_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assisted_synthesis_agent_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    stage text DEFAULT 'assisted_synthesis'::text NOT NULL,
    phase text DEFAULT 'current_facts'::text NOT NULL,
    context_version text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    actor_user_id uuid,
    actor_role character varying(20),
    event_type character varying(100) NOT NULL,
    entity_type character varying(50),
    entity_id uuid,
    metadata json DEFAULT '{}'::json,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: baseline_review_cycles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.baseline_review_cycles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    cycle_label character varying(20) NOT NULL,
    weekly_revenue numeric,
    peak_hour_revenue_pct numeric,
    labor_pct numeric,
    overtime_pct numeric,
    gross_margin_pct numeric,
    average_ticket numeric,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: diagnostic_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnostic_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    firm_id uuid NOT NULL,
    created_by_user_id uuid,
    status character varying(20) DEFAULT 'queued'::character varying NOT NULL,
    progress integer DEFAULT 0,
    error_message text,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: diagnostic_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnostic_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    email character varying(255),
    org_name character varying(255),
    team_session_id character varying(255) NOT NULL,
    payload json NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: diagnostics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnostics (
    id character varying(255) NOT NULL,
    tenant_id uuid NOT NULL,
    sop_version character varying(20) DEFAULT 'SOP-01'::character varying NOT NULL,
    status character varying(20) DEFAULT 'generated'::character varying NOT NULL,
    overview json NOT NULL,
    ai_opportunities json NOT NULL,
    roadmap_skeleton json NOT NULL,
    discovery_questions json NOT NULL,
    generated_by_user_id uuid,
    approved_by_user_id uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: discovery_call_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discovery_call_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    created_by_user_id uuid,
    notes text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    diagnostic_id character varying(50),
    synthesis_json jsonb,
    approval_state character varying(20) DEFAULT 'pending'::character varying,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejection_reason text,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    CONSTRAINT check_approval_state CHECK (((approval_state)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'changes_requested'::character varying])::text[])))
);


--
-- Name: discovery_notes_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discovery_notes_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    source character varying(50) NOT NULL,
    delta text NOT NULL,
    created_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: evidence_artifacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evidence_artifacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kind character varying(50) DEFAULT 'image'::character varying NOT NULL,
    storage_provider character varying(50) NOT NULL,
    storage_key text NOT NULL,
    public_url text,
    mime_type character varying(100),
    bytes integer,
    width integer,
    height integer,
    caption text,
    source character varying(100),
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: evidence_bindings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evidence_bindings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_session_id character varying(128) NOT NULL,
    role character varying(50) NOT NULL,
    slot_key character varying(100) NOT NULL,
    artifact_id uuid NOT NULL,
    strength integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: executive_brief_artifacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.executive_brief_artifacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    executive_brief_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    artifact_type character varying(50) NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer NOT NULL,
    checksum text NOT NULL,
    is_immutable boolean DEFAULT true NOT NULL,
    metadata jsonb,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: executive_briefs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.executive_briefs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    version character varying(10) DEFAULT 'v0'::character varying NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    synthesis jsonb NOT NULL,
    signals jsonb NOT NULL,
    sources jsonb NOT NULL,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    brief_mode character varying(30) DEFAULT 'EXECUTIVE_SYNTHESIS'::character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(100) NOT NULL,
    description text,
    default_enabled boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: firm_baseline_intake; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.firm_baseline_intake (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    monthly_lead_volume integer,
    avg_response_time_minutes integer,
    close_rate_percent integer,
    avg_job_value integer,
    current_tools jsonb DEFAULT '[]'::jsonb,
    sales_reps_count integer,
    ops_admin_count integer,
    primary_bottleneck text,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    weekly_revenue numeric,
    peak_hour_revenue_pct numeric,
    labor_pct numeric,
    overtime_pct numeric,
    gross_margin_pct numeric,
    average_ticket numeric,
    economic_confidence_level character varying(50),
    baseline_locked_at timestamp with time zone,
    locked_by_user_id uuid,
    max_throughput_per_hour integer,
    avg_throughput_per_hour integer
);


--
-- Name: impersonation_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.impersonation_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    super_admin_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    owner_user_id uuid,
    reason text,
    started_at timestamp without time zone DEFAULT now() NOT NULL,
    ended_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: implementation_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.implementation_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    roadmap_id uuid,
    snapshot_date timestamp with time zone NOT NULL,
    label character varying(20) NOT NULL,
    source character varying(20) NOT NULL,
    metrics json DEFAULT '{}'::json NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_impl_snapshots_label CHECK (((label)::text = ANY ((ARRAY['baseline'::character varying, '30d'::character varying, '60d'::character varying, '90d'::character varying, 'custom'::character varying])::text[]))),
    CONSTRAINT check_impl_snapshots_source CHECK (((source)::text = ANY ((ARRAY['manual'::character varying, 'ghl_export'::character varying, 'api'::character varying])::text[])))
);


--
-- Name: TABLE implementation_snapshots; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.implementation_snapshots IS 'Point-in-time metrics for roadmap implementation';


--
-- Name: intake_clarifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intake_clarifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    intake_id uuid NOT NULL,
    question_id text NOT NULL,
    original_response text,
    clarification_prompt text NOT NULL,
    clarification_response text,
    status text DEFAULT 'requested'::text NOT NULL,
    token text NOT NULL,
    blocking boolean DEFAULT false NOT NULL,
    requested_by_user_id uuid,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    responded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    email_status character varying(20) DEFAULT 'NOT_SENT'::character varying NOT NULL,
    email_error text,
    last_email_attempt_at timestamp without time zone
);


--
-- Name: intake_vectors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intake_vectors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    role_label character varying(255) NOT NULL,
    role_type character varying(50) NOT NULL,
    perceived_constraints text NOT NULL,
    anticipated_blind_spots text,
    recipient_email character varying(255),
    recipient_name character varying(255),
    invite_status character varying(20) DEFAULT 'NOT_SENT'::character varying NOT NULL,
    intake_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata json DEFAULT '{}'::json
);


--
-- Name: intakes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intakes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role character varying(20) NOT NULL,
    answers json NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    tenant_id uuid NOT NULL,
    status character varying(20) DEFAULT 'in_progress'::character varying NOT NULL,
    completed_at timestamp without time zone,
    coaching_feedback json DEFAULT '{}'::json
);


--
-- Name: invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    token character varying(255) NOT NULL,
    accepted boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: onboarding_states; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_states (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    percent_complete integer DEFAULT 0,
    total_points integer DEFAULT 0,
    max_points integer DEFAULT 0,
    steps json DEFAULT '[]'::json,
    badges json DEFAULT '[]'::json,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    step character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'not_started'::character varying NOT NULL,
    metadata json DEFAULT '{}'::json,
    completed_at timestamp without time zone,
    onboarding_state character varying(50) DEFAULT 'unknown'::character varying NOT NULL,
    reasons jsonb DEFAULT '[]'::jsonb NOT NULL,
    flags jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    request_ip text,
    request_ua text,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: public_agent_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.public_agent_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id character varying(128) NOT NULL,
    event_type character varying(100) NOT NULL,
    message text,
    metadata json DEFAULT '{}'::json,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: public_agent_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.public_agent_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id character varying(128) NOT NULL,
    openai_thread_id character varying(128),
    page_context json DEFAULT '{}'::json,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_activity_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: roadmap_outcomes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roadmap_outcomes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    roadmap_id uuid NOT NULL,
    baseline_snapshot_id uuid,
    at_30d_snapshot_id uuid,
    at_60d_snapshot_id uuid,
    at_90d_snapshot_id uuid,
    deltas json DEFAULT '{}'::json NOT NULL,
    realized_roi json,
    status character varying(20) DEFAULT 'on_track'::character varying NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_roadmap_outcomes_status CHECK (((status)::text = ANY ((ARRAY['on_track'::character varying, 'at_risk'::character varying, 'off_track'::character varying])::text[])))
);


--
-- Name: TABLE roadmap_outcomes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.roadmap_outcomes IS 'Real-world outcome summary and ROI for a roadmap';


--
-- Name: roadmap_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roadmap_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    roadmap_id uuid NOT NULL,
    section_number integer NOT NULL,
    section_name character varying(50) NOT NULL,
    content_markdown text NOT NULL,
    status character varying(20) DEFAULT 'planned'::character varying NOT NULL,
    last_updated_at timestamp with time zone,
    agent_cheatsheet json DEFAULT '{}'::json,
    word_count integer,
    diagrams json DEFAULT '[]'::json,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_roadmap_sections_name CHECK (((section_name)::text = ANY ((ARRAY['Summary'::character varying, 'Executive Summary'::character varying, 'Diagnostic Analysis'::character varying, 'System Architecture'::character varying, 'High-Leverage Systems'::character varying, 'Implementation Plan'::character varying, 'SOP Pack'::character varying, 'KPIs/Metrics'::character varying, 'Appendix'::character varying])::text[]))),
    CONSTRAINT check_roadmap_sections_status CHECK (((status)::text = ANY ((ARRAY['planned'::character varying, 'in_progress'::character varying, 'implemented'::character varying, 'deprecated'::character varying])::text[])))
);


--
-- Name: TABLE roadmap_sections; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.roadmap_sections IS 'Individual sections of a strategic roadmap with implementation status and AI cheatsheets';


--
-- Name: COLUMN roadmap_sections.section_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.roadmap_sections.section_number IS 'Section order (1–10)';


--
-- Name: COLUMN roadmap_sections.section_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.roadmap_sections.section_name IS 'Section type identifier';


--
-- Name: COLUMN roadmap_sections.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.roadmap_sections.status IS 'Implementation status: planned | in_progress | implemented | deprecated';


--
-- Name: COLUMN roadmap_sections.agent_cheatsheet; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.roadmap_sections.agent_cheatsheet IS 'Quick reference for AI agents (role, facts, decisions, actions, connections)';


--
-- Name: COLUMN roadmap_sections.diagrams; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.roadmap_sections.diagrams IS 'Array of Mermaid diagram definitions';


--
-- Name: CONSTRAINT check_roadmap_sections_name ON roadmap_sections; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT check_roadmap_sections_name ON public.roadmap_sections IS 'Section names for Roadmap OS (0-8)';


--
-- Name: roadmaps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roadmaps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pdf_url character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status character varying(30) DEFAULT 'draft'::character varying NOT NULL,
    tenant_id uuid NOT NULL,
    created_by_user_id uuid,
    version character varying(50) DEFAULT 'v1.0'::character varying NOT NULL,
    model_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    snapshot_id uuid,
    source_refs jsonb DEFAULT '[]'::jsonb NOT NULL,
    metadata jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    delivered_at timestamp with time zone
);


--
-- Name: sas_elections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sas_elections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    proposal_id uuid NOT NULL,
    decision character varying(10) NOT NULL,
    note text,
    decided_by_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sas_elections_decision_check CHECK (((decision)::text = ANY ((ARRAY['keep'::character varying, 'trash'::character varying])::text[])))
);


--
-- Name: sas_proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sas_proposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    sas_run_id uuid NOT NULL,
    proposal_type character varying(20) NOT NULL,
    content text NOT NULL,
    source_anchors jsonb NOT NULL,
    agent_model character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    concept_hash text,
    capability_id text,
    capability_namespace text
);


--
-- Name: sas_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sas_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    scope jsonb NOT NULL,
    source_artifact_refs jsonb NOT NULL,
    created_by_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: selection_envelopes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.selection_envelopes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    canonical_findings_hash character varying(64) NOT NULL,
    registry_version character varying(50) NOT NULL,
    envelope_version character varying(50) NOT NULL,
    execution_envelope jsonb NOT NULL,
    inventory_ids jsonb NOT NULL,
    adapter_ids jsonb NOT NULL,
    finding_ids jsonb NOT NULL,
    selection_hash character varying(64) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sop_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sop_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    diagnostic_id character varying(255),
    ticket_id character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    category character varying(100),
    pain_source text,
    description text NOT NULL,
    current_state text,
    target_state text,
    ai_design text,
    ghl_implementation text,
    implementation_steps json,
    owner character varying(100),
    dependencies json,
    time_estimate_hours integer DEFAULT 0,
    cost_estimate integer DEFAULT 0,
    success_metric text,
    roadmap_section text,
    priority character varying(50),
    sprint integer DEFAULT 1,
    projected_hours_saved_weekly integer DEFAULT 0,
    projected_leads_recovered_monthly integer DEFAULT 0,
    roi_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    tier character varying(50),
    value_category character varying(100),
    approved boolean DEFAULT false,
    admin_notes text,
    moderated_at timestamp with time zone,
    moderated_by uuid,
    moderation_status character varying(30) DEFAULT 'pending'::character varying,
    inventory_id text,
    is_sidecar boolean DEFAULT false,
    ticket_type character varying(50),
    status character varying(20) DEFAULT 'generated'::character varying NOT NULL,
    selection_envelope_id uuid,
    source_finding_ids jsonb,
    generation_event_id uuid,
    projection_hash text,
    envelope_version integer DEFAULT 1,
    capability_id text
);


--
-- Name: COLUMN sop_tickets.approved; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sop_tickets.approved IS 'Whether this ticket is approved for final roadmap generation';


--
-- Name: COLUMN sop_tickets.admin_notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sop_tickets.admin_notes IS 'SuperAdmin notes about why ticket was approved/rejected';


--
-- Name: COLUMN sop_tickets.moderated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sop_tickets.moderated_at IS 'Timestamp when ticket was moderated';


--
-- Name: COLUMN sop_tickets.moderated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sop_tickets.moderated_by IS 'User ID of SuperAdmin who moderated this ticket';


--
-- Name: COLUMN sop_tickets.inventory_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sop_tickets.inventory_id IS 'References canonical SOP inventory entry (e.g., "PIPE-001", "SIDECAR-WATCH-01")';


--
-- Name: COLUMN sop_tickets.is_sidecar; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sop_tickets.is_sidecar IS 'TRUE if this SOP requires external sidecar service, FALSE for GHL-native';


--
-- Name: tenant_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    owner_user_id uuid,
    filename character varying(255) NOT NULL,
    original_filename character varying(255) NOT NULL,
    file_path text NOT NULL,
    file_size integer NOT NULL,
    mime_type character varying(100),
    category character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    sop_number text,
    output_number text,
    uploaded_by uuid,
    is_public boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    section text,
    content text,
    storage_provider character varying(50),
    tags text,
    artifact_hash character varying(64),
    is_immutable boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE tenant_documents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tenant_documents IS 'Stores tenant-specific documents like SOP outputs, roadmaps, and reports';


--
-- Name: COLUMN tenant_documents.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenant_documents.category IS 'Document category: sop_output, roadmap, report, other';


--
-- Name: COLUMN tenant_documents.is_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenant_documents.is_public IS 'If true, all team members of tenant can access; if false, owner-only';


--
-- Name: COLUMN tenant_documents.section; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenant_documents.section IS 'Roadmap section name: executive, diagnostic, architecture, systems, implementation, sop_pack, metrics, appendix';


--
-- Name: tenant_feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_feature_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    feature_flag_id uuid NOT NULL,
    enabled boolean NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_metrics_daily; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_metrics_daily (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    metric_date date NOT NULL,
    intake_started_count integer DEFAULT 0 NOT NULL,
    intake_completed_count integer DEFAULT 0 NOT NULL,
    roadmap_created_count integer DEFAULT 0 NOT NULL,
    roadmap_delivered_count integer DEFAULT 0 NOT NULL,
    pilot_open_count integer DEFAULT 0 NOT NULL,
    pilot_won_count integer DEFAULT 0 NOT NULL,
    last_activity_at timestamp without time zone,
    metrics_json json DEFAULT '{}'::json,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_stage6_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_stage6_config (
    tenant_id uuid NOT NULL,
    vertical character varying(40) NOT NULL,
    allowed_namespaces text[] NOT NULL,
    allowed_adapters text[] NOT NULL,
    max_complexity_tier character varying(10) NOT NULL,
    custom_dev_allowed boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT tenant_stage6_config_max_complexity_tier_check CHECK (((max_complexity_tier)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[])))
);


--
-- Name: tenant_vector_stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_vector_stores (
    tenant_id uuid NOT NULL,
    vector_store_id character varying(128) NOT NULL,
    last_refreshed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_user_id uuid,
    name character varying(255) NOT NULL,
    cohort_label character varying(50),
    segment character varying(255),
    region character varying(255),
    status character varying(20) DEFAULT 'prospect'::character varying NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    discovery_complete boolean DEFAULT false NOT NULL,
    last_diagnostic_id character varying(255),
    team_headcount integer DEFAULT 5,
    baseline_monthly_leads integer DEFAULT 40,
    firm_size_tier character varying(20) DEFAULT 'small'::character varying,
    business_type text DEFAULT 'default'::text NOT NULL,
    intake_window_state character varying(20) DEFAULT 'OPEN'::character varying NOT NULL,
    intake_snapshot_id character varying(255),
    intake_closed_at timestamp with time zone,
    knowledge_base_ready_at timestamp with time zone,
    roles_validated_at timestamp with time zone,
    exec_ready_at timestamp with time zone,
    readiness_notes text,
    discovery_acknowledged_at timestamp with time zone,
    slug character varying(255),
    domain character varying(255),
    intake_locked_at timestamp with time zone,
    intake_locked_by_user_id uuid,
    exec_ready_by_user_id uuid,
    intake_phase public.intake_phase DEFAULT 'OPEN_INITIAL'::public.intake_phase NOT NULL,
    intake_version integer DEFAULT 1 NOT NULL,
    intake_reopened_by uuid,
    intake_reopen_reason text,
    intake_reopened_at timestamp with time zone,
    CONSTRAINT tenants_status_check CHECK (((status)::text = ANY ((ARRAY['prospect'::character varying, 'engaged'::character varying, 'qualified'::character varying, 'pilot_candidate'::character varying, 'pilot_active'::character varying, 'active'::character varying, 'paused'::character varying, 'churned'::character varying, 'no_fit'::character varying])::text[])))
);


--
-- Name: COLUMN tenants.team_headcount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenants.team_headcount IS 'Number of people on the team for ROI capacity calculations';


--
-- Name: COLUMN tenants.baseline_monthly_leads; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenants.baseline_monthly_leads IS 'Typical monthly lead volume for ROI guardrails';


--
-- Name: COLUMN tenants.firm_size_tier; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenants.firm_size_tier IS 'Firm size: micro (3-7), small (8-20), mid (20-50), large (50+)';


--
-- Name: COLUMN tenants.business_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenants.business_type IS 'Business type profile: default (professional services) or chamber (chamber of commerce)';


--
-- Name: ticket_instances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_instances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_pack_id uuid NOT NULL,
    ticket_id character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'not_started'::character varying NOT NULL,
    assignee character varying(255),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    section_number integer,
    CONSTRAINT check_ticket_instances_status CHECK (((status)::text = ANY ((ARRAY['not_started'::character varying, 'in_progress'::character varying, 'blocked'::character varying, 'done'::character varying, 'skipped'::character varying])::text[])))
);


--
-- Name: TABLE ticket_instances; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ticket_instances IS 'Per-firm, per-pack ticket instance with completion status';


--
-- Name: COLUMN ticket_instances.ticket_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ticket_instances.ticket_id IS 'ID from master ticket library (e.g. T1.3.1)';


--
-- Name: COLUMN ticket_instances.section_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ticket_instances.section_number IS 'Links ticket to roadmap_sections.section_number (0-8)';


--
-- Name: ticket_moderation_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_moderation_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    status character varying(50) DEFAULT 'ACTIVE'::character varying NOT NULL,
    started_by uuid,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source_doc_id uuid,
    source_doc_version character varying(255),
    selection_envelope_id uuid
);


--
-- Name: COLUMN ticket_moderation_sessions.selection_envelope_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ticket_moderation_sessions.selection_envelope_id IS 'Binds session to a SelectionEnvelope (EXEC-TICKET-MODERATION-BINDING-001). Null for legacy sessions created before enforcement. All new sessions must populate this field — activation will reject if no envelope exists.';


--
-- Name: ticket_packs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_packs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    roadmap_id uuid,
    version character varying(20) DEFAULT 'v1.0'::character varying NOT NULL,
    status character varying(20) DEFAULT 'not_started'::character varying NOT NULL,
    total_tickets integer DEFAULT 0 NOT NULL,
    total_sprints integer DEFAULT 0 NOT NULL,
    sprint_assignments json DEFAULT '[]'::json NOT NULL,
    totals json DEFAULT '{}'::json NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_ticket_packs_status CHECK (((status)::text = ANY ((ARRAY['not_started'::character varying, 'in_progress'::character varying, 'completed'::character varying])::text[])))
);


--
-- Name: TABLE ticket_packs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ticket_packs IS 'Per-tenant ticket pack that organizes execution tickets into sprints';


--
-- Name: tickets_draft; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets_draft (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    finding_id character varying(255),
    finding_category character varying(100),
    title text NOT NULL,
    description text NOT NULL,
    evidence_refs jsonb,
    status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    moderation_session_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    finding_type character varying(100) DEFAULT 'CurrentFact'::character varying NOT NULL,
    ticket_type character varying(100) DEFAULT 'Diagnostic'::character varying NOT NULL,
    sprint integer DEFAULT 30,
    category character varying(100),
    tier character varying(50),
    time_estimate_hours integer DEFAULT 0,
    ghl_implementation text,
    implementation_steps jsonb,
    success_metric text,
    roi_notes text,
    pain_source text
);


--
-- Name: training_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description character varying(1000) NOT NULL,
    content character varying(10000) NOT NULL,
    "order" integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: training_modules_order_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.training_modules_order_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: training_modules_order_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.training_modules_order_seq OWNED BY public.training_modules."order";


--
-- Name: training_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    module_id uuid NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    tenant_id uuid,
    reset_token character varying(255),
    reset_token_expiry timestamp without time zone,
    is_internal boolean DEFAULT false NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['owner'::character varying, 'ops'::character varying, 'sales'::character varying, 'delivery'::character varying, 'staff'::character varying, 'superadmin'::character varying, 'exec_sponsor'::character varying, 'delegate'::character varying, 'operator'::character varying, 'agent'::character varying])::text[])))
);


--
-- Name: webinar_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webinar_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    company character varying(255) NOT NULL,
    role character varying(255) NOT NULL,
    team_size integer NOT NULL,
    current_crm character varying(255) NOT NULL,
    bottleneck text NOT NULL,
    source character varying(255),
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    metadata json DEFAULT '{}'::json
);


--
-- Name: webinar_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webinar_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    password_hash text NOT NULL,
    password_version integer DEFAULT 1 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('public.__drizzle_migrations_id_seq'::regclass);


--
-- Name: training_modules order; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_modules ALTER COLUMN "order" SET DEFAULT nextval('public.training_modules_order_seq'::regclass);


--
-- Name: diagnostics diagnostics_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.diagnostics
    ADD CONSTRAINT diagnostics_pkey PRIMARY KEY (id);


--
-- Name: entities entities_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.entities
    ADD CONSTRAINT entities_pkey PRIMARY KEY (id);


--
-- Name: roadmaps roadmaps_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.roadmaps
    ADD CONSTRAINT roadmaps_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: agent_configs agent_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_configs
    ADD CONSTRAINT agent_configs_pkey PRIMARY KEY (id);


--
-- Name: agent_logs agent_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_logs
    ADD CONSTRAINT agent_logs_pkey PRIMARY KEY (id);


--
-- Name: agent_messages agent_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_messages
    ADD CONSTRAINT agent_messages_pkey PRIMARY KEY (id);


--
-- Name: agent_routing_rules agent_routing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_routing_rules
    ADD CONSTRAINT agent_routing_rules_pkey PRIMARY KEY (id);


--
-- Name: agent_strategy_contexts agent_strategy_contexts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_strategy_contexts
    ADD CONSTRAINT agent_strategy_contexts_pkey PRIMARY KEY (tenant_id);


--
-- Name: agent_threads agent_threads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_threads
    ADD CONSTRAINT agent_threads_pkey PRIMARY KEY (id);


--
-- Name: assisted_synthesis_agent_messages assisted_synthesis_agent_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assisted_synthesis_agent_messages
    ADD CONSTRAINT assisted_synthesis_agent_messages_pkey PRIMARY KEY (id);


--
-- Name: assisted_synthesis_agent_sessions assisted_synthesis_agent_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assisted_synthesis_agent_sessions
    ADD CONSTRAINT assisted_synthesis_agent_sessions_pkey PRIMARY KEY (id);


--
-- Name: audit_events audit_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT audit_events_pkey PRIMARY KEY (id);


--
-- Name: baseline_review_cycles baseline_review_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baseline_review_cycles
    ADD CONSTRAINT baseline_review_cycles_pkey PRIMARY KEY (id);


--
-- Name: diagnostic_jobs diagnostic_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostic_jobs
    ADD CONSTRAINT diagnostic_jobs_pkey PRIMARY KEY (id);


--
-- Name: diagnostic_snapshots diagnostic_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostic_snapshots
    ADD CONSTRAINT diagnostic_snapshots_pkey PRIMARY KEY (id);


--
-- Name: diagnostics diagnostics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostics
    ADD CONSTRAINT diagnostics_pkey PRIMARY KEY (id);


--
-- Name: discovery_call_notes discovery_call_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discovery_call_notes
    ADD CONSTRAINT discovery_call_notes_pkey PRIMARY KEY (id);


--
-- Name: discovery_notes_log discovery_notes_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discovery_notes_log
    ADD CONSTRAINT discovery_notes_log_pkey PRIMARY KEY (id);


--
-- Name: evidence_artifacts evidence_artifacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_artifacts
    ADD CONSTRAINT evidence_artifacts_pkey PRIMARY KEY (id);


--
-- Name: evidence_bindings evidence_bindings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_bindings
    ADD CONSTRAINT evidence_bindings_pkey PRIMARY KEY (id);


--
-- Name: executive_brief_artifacts executive_brief_artifacts_brief_type_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executive_brief_artifacts
    ADD CONSTRAINT executive_brief_artifacts_brief_type_unique UNIQUE (executive_brief_id, artifact_type);


--
-- Name: executive_brief_artifacts executive_brief_artifacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executive_brief_artifacts
    ADD CONSTRAINT executive_brief_artifacts_pkey PRIMARY KEY (id);


--
-- Name: executive_briefs executive_briefs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executive_briefs
    ADD CONSTRAINT executive_briefs_pkey PRIMARY KEY (id);


--
-- Name: executive_briefs executive_briefs_tenant_id_version_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executive_briefs
    ADD CONSTRAINT executive_briefs_tenant_id_version_unique UNIQUE (tenant_id, version);


--
-- Name: feature_flags feature_flags_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_key_unique UNIQUE (key);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: firm_baseline_intake firm_baseline_intake_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_baseline_intake
    ADD CONSTRAINT firm_baseline_intake_pkey PRIMARY KEY (id);


--
-- Name: firm_baseline_intake firm_baseline_intake_tenant_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_baseline_intake
    ADD CONSTRAINT firm_baseline_intake_tenant_id_unique UNIQUE (tenant_id);


--
-- Name: impersonation_sessions impersonation_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.impersonation_sessions
    ADD CONSTRAINT impersonation_sessions_pkey PRIMARY KEY (id);


--
-- Name: implementation_snapshots implementation_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.implementation_snapshots
    ADD CONSTRAINT implementation_snapshots_pkey PRIMARY KEY (id);


--
-- Name: intake_clarifications intake_clarifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intake_clarifications
    ADD CONSTRAINT intake_clarifications_pkey PRIMARY KEY (id);


--
-- Name: intake_clarifications intake_clarifications_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intake_clarifications
    ADD CONSTRAINT intake_clarifications_token_key UNIQUE (token);


--
-- Name: intake_vectors intake_vectors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intake_vectors
    ADD CONSTRAINT intake_vectors_pkey PRIMARY KEY (id);


--
-- Name: intakes intakes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intakes
    ADD CONSTRAINT intakes_pkey PRIMARY KEY (id);


--
-- Name: invites invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_pkey PRIMARY KEY (id);


--
-- Name: invites invites_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_token_unique UNIQUE (token);


--
-- Name: webinar_registrations lead_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webinar_registrations
    ADD CONSTRAINT lead_requests_pkey PRIMARY KEY (id);


--
-- Name: onboarding_states onboarding_states_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_states
    ADD CONSTRAINT onboarding_states_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: public_agent_events public_agent_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.public_agent_events
    ADD CONSTRAINT public_agent_events_pkey PRIMARY KEY (id);


--
-- Name: public_agent_sessions public_agent_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.public_agent_sessions
    ADD CONSTRAINT public_agent_sessions_pkey PRIMARY KEY (id);


--
-- Name: public_agent_sessions public_agent_sessions_session_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.public_agent_sessions
    ADD CONSTRAINT public_agent_sessions_session_id_unique UNIQUE (session_id);


--
-- Name: roadmap_outcomes roadmap_outcomes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmap_outcomes
    ADD CONSTRAINT roadmap_outcomes_pkey PRIMARY KEY (id);


--
-- Name: roadmap_sections roadmap_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmap_sections
    ADD CONSTRAINT roadmap_sections_pkey PRIMARY KEY (id);


--
-- Name: roadmaps roadmaps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmaps
    ADD CONSTRAINT roadmaps_pkey PRIMARY KEY (id);


--
-- Name: sas_elections sas_elections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sas_elections
    ADD CONSTRAINT sas_elections_pkey PRIMARY KEY (id);


--
-- Name: sas_proposals sas_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sas_proposals
    ADD CONSTRAINT sas_proposals_pkey PRIMARY KEY (id);


--
-- Name: sas_runs sas_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sas_runs
    ADD CONSTRAINT sas_runs_pkey PRIMARY KEY (id);


--
-- Name: selection_envelopes selection_envelopes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_envelopes
    ADD CONSTRAINT selection_envelopes_pkey PRIMARY KEY (id);


--
-- Name: sop_tickets sop_ticket_envelope_inventory_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sop_tickets
    ADD CONSTRAINT sop_ticket_envelope_inventory_unique UNIQUE (selection_envelope_id, inventory_id);


--
-- Name: sop_tickets sop_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sop_tickets
    ADD CONSTRAINT sop_tickets_pkey PRIMARY KEY (id);


--
-- Name: tenant_documents tenant_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_documents
    ADD CONSTRAINT tenant_documents_pkey PRIMARY KEY (id);


--
-- Name: tenant_feature_flags tenant_feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_feature_flags
    ADD CONSTRAINT tenant_feature_flags_pkey PRIMARY KEY (id);


--
-- Name: tenant_metrics_daily tenant_metrics_daily_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_metrics_daily
    ADD CONSTRAINT tenant_metrics_daily_pkey PRIMARY KEY (id);


--
-- Name: tenant_stage6_config tenant_stage6_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_stage6_config
    ADD CONSTRAINT tenant_stage6_config_pkey PRIMARY KEY (tenant_id);


--
-- Name: tenant_vector_stores tenant_vector_stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_vector_stores
    ADD CONSTRAINT tenant_vector_stores_pkey PRIMARY KEY (tenant_id);


--
-- Name: tenants tenants_owner_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_owner_user_id_unique UNIQUE (owner_user_id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: ticket_instances ticket_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_instances
    ADD CONSTRAINT ticket_instances_pkey PRIMARY KEY (id);


--
-- Name: ticket_moderation_sessions ticket_moderation_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_moderation_sessions
    ADD CONSTRAINT ticket_moderation_sessions_pkey PRIMARY KEY (id);


--
-- Name: ticket_packs ticket_packs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_packs
    ADD CONSTRAINT ticket_packs_pkey PRIMARY KEY (id);


--
-- Name: tickets_draft tickets_draft_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets_draft
    ADD CONSTRAINT tickets_draft_pkey PRIMARY KEY (id);


--
-- Name: training_modules training_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_modules
    ADD CONSTRAINT training_modules_pkey PRIMARY KEY (id);


--
-- Name: training_progress training_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_progress
    ADD CONSTRAINT training_progress_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_reset_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_reset_token_unique UNIQUE (reset_token);


--
-- Name: webinar_settings webinar_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webinar_settings
    ADD CONSTRAINT webinar_settings_pkey PRIMARY KEY (id);


--
-- Name: idx_entities_external; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX idx_entities_external ON core.entities USING btree (external_id);


--
-- Name: idx_entities_tenant; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX idx_entities_tenant ON core.entities USING btree (tenant_id);


--
-- Name: idx_entities_type; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX idx_entities_type ON core.entities USING btree (entity_type);


--
-- Name: idx_entities_vertical; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX idx_entities_vertical ON core.entities USING btree (vertical);


--
-- Name: __drizzle_migrations_hash_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX __drizzle_migrations_hash_unique ON public.__drizzle_migrations USING btree (hash);


--
-- Name: as_agent_messages_session_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX as_agent_messages_session_idx ON public.assisted_synthesis_agent_messages USING btree (session_id);


--
-- Name: as_agent_sessions_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX as_agent_sessions_tenant_idx ON public.assisted_synthesis_agent_sessions USING btree (tenant_id);


--
-- Name: diagnostic_jobs_firm_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX diagnostic_jobs_firm_id_idx ON public.diagnostic_jobs USING btree (firm_id);


--
-- Name: discovery_notes_log_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX discovery_notes_log_tenant_idx ON public.discovery_notes_log USING btree (tenant_id, created_at DESC);


--
-- Name: executive_brief_artifacts_brief_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX executive_brief_artifacts_brief_id_idx ON public.executive_brief_artifacts USING btree (executive_brief_id);


--
-- Name: executive_brief_artifacts_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX executive_brief_artifacts_tenant_id_idx ON public.executive_brief_artifacts USING btree (tenant_id);


--
-- Name: executive_briefs_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX executive_briefs_tenant_id_idx ON public.executive_briefs USING btree (tenant_id);


--
-- Name: idx_discovery_call_notes_diagnostic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discovery_call_notes_diagnostic_id ON public.discovery_call_notes USING btree (diagnostic_id);


--
-- Name: idx_discovery_call_notes_tenant_diagnostic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discovery_call_notes_tenant_diagnostic ON public.discovery_call_notes USING btree (tenant_id, diagnostic_id);


--
-- Name: idx_firm_baseline_intake_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_firm_baseline_intake_tenant_id ON public.firm_baseline_intake USING btree (tenant_id);


--
-- Name: idx_intake_clarifications_intake_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intake_clarifications_intake_id ON public.intake_clarifications USING btree (intake_id);


--
-- Name: idx_intake_clarifications_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intake_clarifications_tenant_id ON public.intake_clarifications USING btree (tenant_id);


--
-- Name: idx_intake_clarifications_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intake_clarifications_token ON public.intake_clarifications USING btree (token);


--
-- Name: idx_password_reset_tokens_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens USING btree (expires_at);


--
-- Name: idx_password_reset_tokens_token_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_token_hash ON public.password_reset_tokens USING btree (token_hash);


--
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_roadmaps_tenant_delivered_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_roadmaps_tenant_delivered_at ON public.roadmaps USING btree (tenant_id, delivered_at DESC);


--
-- Name: idx_sas_proposals_capability; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sas_proposals_capability ON public.sas_proposals USING btree (tenant_id, capability_id);


--
-- Name: idx_sas_proposals_concept_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sas_proposals_concept_hash ON public.sas_proposals USING btree (tenant_id, concept_hash);


--
-- Name: moderation_session_finding_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX moderation_session_finding_idx ON public.tickets_draft USING btree (moderation_session_id, finding_id);


--
-- Name: one_published_diagnostic_per_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX one_published_diagnostic_per_tenant ON public.diagnostics USING btree (tenant_id) WHERE ((status)::text = 'published'::text);


--
-- Name: sas_elections_proposal_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sas_elections_proposal_idx ON public.sas_elections USING btree (proposal_id);


--
-- Name: sas_elections_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sas_elections_tenant_idx ON public.sas_elections USING btree (tenant_id);


--
-- Name: sas_proposals_run_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sas_proposals_run_idx ON public.sas_proposals USING btree (sas_run_id);


--
-- Name: sas_proposals_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sas_proposals_tenant_idx ON public.sas_proposals USING btree (tenant_id);


--
-- Name: sas_runs_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sas_runs_tenant_idx ON public.sas_runs USING btree (tenant_id);


--
-- Name: selection_envelopes_selection_hash_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX selection_envelopes_selection_hash_idx ON public.selection_envelopes USING btree (selection_hash);


--
-- Name: selection_envelopes_unique_binding; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX selection_envelopes_unique_binding ON public.selection_envelopes USING btree (tenant_id, canonical_findings_hash, registry_version, envelope_version);


--
-- Name: tenant_doc_sop_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenant_doc_sop_idx ON public.tenant_documents USING btree (tenant_id, category, sop_number, output_number);


--
-- Name: tenant_documents_canonical_findings_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenant_documents_canonical_findings_unique ON public.tenant_documents USING btree (tenant_id) WHERE ((category)::text = 'findings_canonical'::text);


--
-- Name: tenant_stage6_config_vertical_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_stage6_config_vertical_idx ON public.tenant_stage6_config USING btree (vertical);


--
-- Name: tms_selection_envelope_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tms_selection_envelope_id_idx ON public.ticket_moderation_sessions USING btree (selection_envelope_id) WHERE (selection_envelope_id IS NOT NULL);


--
-- Name: diagnostics diagnostics_tenant_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.diagnostics
    ADD CONSTRAINT diagnostics_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES core.tenants(id);


--
-- Name: entities entities_tenant_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.entities
    ADD CONSTRAINT entities_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES core.tenants(id);


--
-- Name: roadmaps roadmaps_tenant_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.roadmaps
    ADD CONSTRAINT roadmaps_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES core.tenants(id);


--
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES core.tenants(id);


--
-- Name: agent_configs agent_configs_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_configs
    ADD CONSTRAINT agent_configs_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: agent_configs agent_configs_last_updated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_configs
    ADD CONSTRAINT agent_configs_last_updated_by_users_id_fk FOREIGN KEY (last_updated_by) REFERENCES public.users(id);


--
-- Name: agent_configs agent_configs_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_configs
    ADD CONSTRAINT agent_configs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: agent_configs agent_configs_updated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_configs
    ADD CONSTRAINT agent_configs_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: agent_logs agent_logs_agent_config_id_agent_configs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_logs
    ADD CONSTRAINT agent_logs_agent_config_id_agent_configs_id_fk FOREIGN KEY (agent_config_id) REFERENCES public.agent_configs(id) ON DELETE CASCADE;


--
-- Name: agent_messages agent_messages_agent_thread_id_agent_threads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_messages
    ADD CONSTRAINT agent_messages_agent_thread_id_agent_threads_id_fk FOREIGN KEY (agent_thread_id) REFERENCES public.agent_threads(id) ON DELETE CASCADE;


--
-- Name: agent_routing_rules agent_routing_rules_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_routing_rules
    ADD CONSTRAINT agent_routing_rules_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: agent_strategy_contexts agent_strategy_contexts_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_strategy_contexts
    ADD CONSTRAINT agent_strategy_contexts_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: agent_threads agent_threads_actor_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_threads
    ADD CONSTRAINT agent_threads_actor_user_id_users_id_fk FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: agent_threads agent_threads_agent_config_id_agent_configs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_threads
    ADD CONSTRAINT agent_threads_agent_config_id_agent_configs_id_fk FOREIGN KEY (agent_config_id) REFERENCES public.agent_configs(id) ON DELETE CASCADE;


--
-- Name: agent_threads agent_threads_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_threads
    ADD CONSTRAINT agent_threads_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: assisted_synthesis_agent_messages assisted_synthesis_agent_messages_session_id_assisted_synthesis; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assisted_synthesis_agent_messages
    ADD CONSTRAINT assisted_synthesis_agent_messages_session_id_assisted_synthesis FOREIGN KEY (session_id) REFERENCES public.assisted_synthesis_agent_sessions(id) ON DELETE CASCADE;


--
-- Name: assisted_synthesis_agent_messages assisted_synthesis_agent_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assisted_synthesis_agent_messages
    ADD CONSTRAINT assisted_synthesis_agent_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.assisted_synthesis_agent_sessions(id) ON DELETE CASCADE;


--
-- Name: audit_events audit_events_actor_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT audit_events_actor_user_id_users_id_fk FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: audit_events audit_events_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT audit_events_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;


--
-- Name: diagnostic_jobs diagnostic_jobs_created_by_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostic_jobs
    ADD CONSTRAINT diagnostic_jobs_created_by_user_id_users_id_fk FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: diagnostic_jobs diagnostic_jobs_firm_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostic_jobs
    ADD CONSTRAINT diagnostic_jobs_firm_id_tenants_id_fk FOREIGN KEY (firm_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: diagnostic_snapshots diagnostic_snapshots_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostic_snapshots
    ADD CONSTRAINT diagnostic_snapshots_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: diagnostics diagnostics_approved_by_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostics
    ADD CONSTRAINT diagnostics_approved_by_user_id_users_id_fk FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id);


--
-- Name: diagnostics diagnostics_generated_by_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostics
    ADD CONSTRAINT diagnostics_generated_by_user_id_users_id_fk FOREIGN KEY (generated_by_user_id) REFERENCES public.users(id);


--
-- Name: diagnostics diagnostics_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostics
    ADD CONSTRAINT diagnostics_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: discovery_call_notes discovery_call_notes_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discovery_call_notes
    ADD CONSTRAINT discovery_call_notes_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: discovery_call_notes discovery_call_notes_created_by_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discovery_call_notes
    ADD CONSTRAINT discovery_call_notes_created_by_user_id_users_id_fk FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: discovery_call_notes discovery_call_notes_diagnostic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discovery_call_notes
    ADD CONSTRAINT discovery_call_notes_diagnostic_id_fkey FOREIGN KEY (diagnostic_id) REFERENCES public.diagnostics(id) ON DELETE CASCADE;


--
-- Name: discovery_call_notes discovery_call_notes_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discovery_call_notes
    ADD CONSTRAINT discovery_call_notes_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: discovery_notes_log discovery_notes_log_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discovery_notes_log
    ADD CONSTRAINT discovery_notes_log_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: discovery_notes_log discovery_notes_log_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discovery_notes_log
    ADD CONSTRAINT discovery_notes_log_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: evidence_bindings evidence_bindings_artifact_id_evidence_artifacts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_bindings
    ADD CONSTRAINT evidence_bindings_artifact_id_evidence_artifacts_id_fk FOREIGN KEY (artifact_id) REFERENCES public.evidence_artifacts(id) ON DELETE CASCADE;


--
-- Name: executive_brief_artifacts executive_brief_artifacts_executive_brief_id_executive_briefs_i; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executive_brief_artifacts
    ADD CONSTRAINT executive_brief_artifacts_executive_brief_id_executive_briefs_i FOREIGN KEY (executive_brief_id) REFERENCES public.executive_briefs(id) ON DELETE CASCADE;


--
-- Name: executive_brief_artifacts executive_brief_artifacts_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executive_brief_artifacts
    ADD CONSTRAINT executive_brief_artifacts_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: executive_briefs executive_briefs_approved_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executive_briefs
    ADD CONSTRAINT executive_briefs_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: executive_briefs executive_briefs_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executive_briefs
    ADD CONSTRAINT executive_briefs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: firm_baseline_intake firm_baseline_intake_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_baseline_intake
    ADD CONSTRAINT firm_baseline_intake_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: firm_baseline_intake firm_baseline_intake_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_baseline_intake
    ADD CONSTRAINT firm_baseline_intake_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: assisted_synthesis_agent_sessions fk_agent_sessions_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assisted_synthesis_agent_sessions
    ADD CONSTRAINT fk_agent_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: impersonation_sessions impersonation_sessions_owner_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.impersonation_sessions
    ADD CONSTRAINT impersonation_sessions_owner_user_id_users_id_fk FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: impersonation_sessions impersonation_sessions_super_admin_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.impersonation_sessions
    ADD CONSTRAINT impersonation_sessions_super_admin_id_users_id_fk FOREIGN KEY (super_admin_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: impersonation_sessions impersonation_sessions_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.impersonation_sessions
    ADD CONSTRAINT impersonation_sessions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: implementation_snapshots implementation_snapshots_roadmap_id_roadmaps_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.implementation_snapshots
    ADD CONSTRAINT implementation_snapshots_roadmap_id_roadmaps_id_fk FOREIGN KEY (roadmap_id) REFERENCES public.roadmaps(id) ON DELETE SET NULL;


--
-- Name: implementation_snapshots implementation_snapshots_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.implementation_snapshots
    ADD CONSTRAINT implementation_snapshots_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: intake_clarifications intake_clarifications_intake_id_intakes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intake_clarifications
    ADD CONSTRAINT intake_clarifications_intake_id_intakes_id_fk FOREIGN KEY (intake_id) REFERENCES public.intakes(id) ON DELETE CASCADE;


--
-- Name: intake_clarifications intake_clarifications_requested_by_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intake_clarifications
    ADD CONSTRAINT intake_clarifications_requested_by_user_id_users_id_fk FOREIGN KEY (requested_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: intake_clarifications intake_clarifications_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intake_clarifications
    ADD CONSTRAINT intake_clarifications_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: intake_vectors intake_vectors_intake_id_intakes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intake_vectors
    ADD CONSTRAINT intake_vectors_intake_id_intakes_id_fk FOREIGN KEY (intake_id) REFERENCES public.intakes(id) ON DELETE SET NULL;


--
-- Name: intake_vectors intake_vectors_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intake_vectors
    ADD CONSTRAINT intake_vectors_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: intakes intakes_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intakes
    ADD CONSTRAINT intakes_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: intakes intakes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intakes
    ADD CONSTRAINT intakes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: invites invites_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: onboarding_states onboarding_states_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_states
    ADD CONSTRAINT onboarding_states_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: onboarding_states onboarding_states_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_states
    ADD CONSTRAINT onboarding_states_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: roadmap_outcomes roadmap_outcomes_at_30d_snapshot_id_implementation_snapshots_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmap_outcomes
    ADD CONSTRAINT roadmap_outcomes_at_30d_snapshot_id_implementation_snapshots_id FOREIGN KEY (at_30d_snapshot_id) REFERENCES public.implementation_snapshots(id) ON DELETE SET NULL;


--
-- Name: roadmap_outcomes roadmap_outcomes_at_60d_snapshot_id_implementation_snapshots_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmap_outcomes
    ADD CONSTRAINT roadmap_outcomes_at_60d_snapshot_id_implementation_snapshots_id FOREIGN KEY (at_60d_snapshot_id) REFERENCES public.implementation_snapshots(id) ON DELETE SET NULL;


--
-- Name: roadmap_outcomes roadmap_outcomes_at_90d_snapshot_id_implementation_snapshots_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmap_outcomes
    ADD CONSTRAINT roadmap_outcomes_at_90d_snapshot_id_implementation_snapshots_id FOREIGN KEY (at_90d_snapshot_id) REFERENCES public.implementation_snapshots(id) ON DELETE SET NULL;


--
-- Name: roadmap_outcomes roadmap_outcomes_baseline_snapshot_id_implementation_snapshots_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmap_outcomes
    ADD CONSTRAINT roadmap_outcomes_baseline_snapshot_id_implementation_snapshots_ FOREIGN KEY (baseline_snapshot_id) REFERENCES public.implementation_snapshots(id) ON DELETE SET NULL;


--
-- Name: roadmap_outcomes roadmap_outcomes_roadmap_id_roadmaps_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmap_outcomes
    ADD CONSTRAINT roadmap_outcomes_roadmap_id_roadmaps_id_fk FOREIGN KEY (roadmap_id) REFERENCES public.roadmaps(id) ON DELETE CASCADE;


--
-- Name: roadmap_outcomes roadmap_outcomes_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmap_outcomes
    ADD CONSTRAINT roadmap_outcomes_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: roadmap_sections roadmap_sections_roadmap_id_roadmaps_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmap_sections
    ADD CONSTRAINT roadmap_sections_roadmap_id_roadmaps_id_fk FOREIGN KEY (roadmap_id) REFERENCES public.roadmaps(id) ON DELETE CASCADE;


--
-- Name: roadmaps roadmaps_created_by_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmaps
    ADD CONSTRAINT roadmaps_created_by_user_id_users_id_fk FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: roadmaps roadmaps_snapshot_id_implementation_snapshots_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmaps
    ADD CONSTRAINT roadmaps_snapshot_id_implementation_snapshots_id_fk FOREIGN KEY (snapshot_id) REFERENCES public.implementation_snapshots(id) ON DELETE SET NULL;


--
-- Name: roadmaps roadmaps_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmaps
    ADD CONSTRAINT roadmaps_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: sas_elections sas_elections_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sas_elections
    ADD CONSTRAINT sas_elections_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.sas_proposals(id) ON DELETE CASCADE;


--
-- Name: sas_elections sas_elections_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sas_elections
    ADD CONSTRAINT sas_elections_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: sas_proposals sas_proposals_sas_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sas_proposals
    ADD CONSTRAINT sas_proposals_sas_run_id_fkey FOREIGN KEY (sas_run_id) REFERENCES public.sas_runs(id) ON DELETE CASCADE;


--
-- Name: sas_proposals sas_proposals_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sas_proposals
    ADD CONSTRAINT sas_proposals_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: sas_runs sas_runs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sas_runs
    ADD CONSTRAINT sas_runs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: selection_envelopes selection_envelopes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_envelopes
    ADD CONSTRAINT selection_envelopes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: sop_tickets sop_tickets_diagnostic_id_diagnostics_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sop_tickets
    ADD CONSTRAINT sop_tickets_diagnostic_id_diagnostics_id_fk FOREIGN KEY (diagnostic_id) REFERENCES public.diagnostics(id) ON DELETE CASCADE;


--
-- Name: sop_tickets sop_tickets_moderated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sop_tickets
    ADD CONSTRAINT sop_tickets_moderated_by_users_id_fk FOREIGN KEY (moderated_by) REFERENCES public.users(id);


--
-- Name: sop_tickets sop_tickets_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sop_tickets
    ADD CONSTRAINT sop_tickets_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_documents tenant_documents_owner_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_documents
    ADD CONSTRAINT tenant_documents_owner_user_id_users_id_fk FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tenant_documents tenant_documents_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_documents
    ADD CONSTRAINT tenant_documents_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_documents tenant_documents_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_documents
    ADD CONSTRAINT tenant_documents_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tenant_feature_flags tenant_feature_flags_feature_flag_id_feature_flags_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_feature_flags
    ADD CONSTRAINT tenant_feature_flags_feature_flag_id_feature_flags_id_fk FOREIGN KEY (feature_flag_id) REFERENCES public.feature_flags(id) ON DELETE CASCADE;


--
-- Name: tenant_feature_flags tenant_feature_flags_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_feature_flags
    ADD CONSTRAINT tenant_feature_flags_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_metrics_daily tenant_metrics_daily_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_metrics_daily
    ADD CONSTRAINT tenant_metrics_daily_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_stage6_config tenant_stage6_config_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_stage6_config
    ADD CONSTRAINT tenant_stage6_config_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_vector_stores tenant_vector_stores_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_vector_stores
    ADD CONSTRAINT tenant_vector_stores_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenants tenants_intake_locked_by_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_intake_locked_by_user_id_users_id_fk FOREIGN KEY (intake_locked_by_user_id) REFERENCES public.users(id);


--
-- Name: ticket_instances ticket_instances_ticket_pack_id_ticket_packs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_instances
    ADD CONSTRAINT ticket_instances_ticket_pack_id_ticket_packs_id_fk FOREIGN KEY (ticket_pack_id) REFERENCES public.ticket_packs(id) ON DELETE CASCADE;


--
-- Name: ticket_moderation_sessions ticket_moderation_sessions_selection_envelope_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_moderation_sessions
    ADD CONSTRAINT ticket_moderation_sessions_selection_envelope_id_fkey FOREIGN KEY (selection_envelope_id) REFERENCES public.selection_envelopes(id) ON DELETE RESTRICT;


--
-- Name: ticket_moderation_sessions ticket_moderation_sessions_source_doc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_moderation_sessions
    ADD CONSTRAINT ticket_moderation_sessions_source_doc_id_fkey FOREIGN KEY (source_doc_id) REFERENCES public.tenant_documents(id);


--
-- Name: ticket_moderation_sessions ticket_moderation_sessions_source_doc_id_tenant_documents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_moderation_sessions
    ADD CONSTRAINT ticket_moderation_sessions_source_doc_id_tenant_documents_id_fk FOREIGN KEY (source_doc_id) REFERENCES public.tenant_documents(id);


--
-- Name: ticket_moderation_sessions ticket_moderation_sessions_started_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_moderation_sessions
    ADD CONSTRAINT ticket_moderation_sessions_started_by_fkey FOREIGN KEY (started_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ticket_moderation_sessions ticket_moderation_sessions_started_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_moderation_sessions
    ADD CONSTRAINT ticket_moderation_sessions_started_by_users_id_fk FOREIGN KEY (started_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ticket_moderation_sessions ticket_moderation_sessions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_moderation_sessions
    ADD CONSTRAINT ticket_moderation_sessions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ticket_moderation_sessions ticket_moderation_sessions_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_moderation_sessions
    ADD CONSTRAINT ticket_moderation_sessions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ticket_packs ticket_packs_roadmap_id_roadmaps_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_packs
    ADD CONSTRAINT ticket_packs_roadmap_id_roadmaps_id_fk FOREIGN KEY (roadmap_id) REFERENCES public.roadmaps(id) ON DELETE SET NULL;


--
-- Name: ticket_packs ticket_packs_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_packs
    ADD CONSTRAINT ticket_packs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tickets_draft tickets_draft_moderation_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets_draft
    ADD CONSTRAINT tickets_draft_moderation_session_id_fkey FOREIGN KEY (moderation_session_id) REFERENCES public.ticket_moderation_sessions(id) ON DELETE CASCADE;


--
-- Name: tickets_draft tickets_draft_moderation_session_id_ticket_moderation_sessions_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets_draft
    ADD CONSTRAINT tickets_draft_moderation_session_id_ticket_moderation_sessions_ FOREIGN KEY (moderation_session_id) REFERENCES public.ticket_moderation_sessions(id) ON DELETE CASCADE;


--
-- Name: tickets_draft tickets_draft_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets_draft
    ADD CONSTRAINT tickets_draft_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tickets_draft tickets_draft_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets_draft
    ADD CONSTRAINT tickets_draft_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: training_progress training_progress_module_id_training_modules_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_progress
    ADD CONSTRAINT training_progress_module_id_training_modules_id_fk FOREIGN KEY (module_id) REFERENCES public.training_modules(id) ON DELETE CASCADE;


--
-- Name: training_progress training_progress_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_progress
    ADD CONSTRAINT training_progress_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict ZZpLTNWdVeLKuUyseoeG4DYAiSaqqyg7V5zuSq2kOI0yuDrFr2kxjQRDPpUf7sk

