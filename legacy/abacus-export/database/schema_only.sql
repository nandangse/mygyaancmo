--
-- PostgreSQL database dump
--

\restrict 3GMIWNhgn0ZAIUOe8retkNRpUMrqRF9xpLaMw1wA9mBAFbfITRdFVKLJi0IvW8g

-- Dumped from database version 17.9 (Ubuntu 17.9-1.pgdg24.04+1)
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg12+2)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    domain text,
    vertical text,
    region text,
    "sizeBand" text,
    enrichment jsonb,
    "icpFit" double precision,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: agencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agencies (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    branding jsonb,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    prefix text NOT NULL,
    "keyHash" text NOT NULL,
    scopes text[] DEFAULT ARRAY['read'::text],
    "lastUsedAt" timestamp(3) without time zone,
    revoked boolean DEFAULT false NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "actorId" text NOT NULL,
    "companyId" text,
    "agencyId" text,
    action text NOT NULL,
    "resourceType" text NOT NULL,
    "resourceId" text,
    before jsonb,
    after jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: auth_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_accounts (
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: authenticators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.authenticators (
    "credentialID" text NOT NULL,
    "userId" text NOT NULL,
    "providerAccountId" text NOT NULL,
    "credentialPublicKey" text NOT NULL,
    counter integer NOT NULL,
    "credentialDeviceType" text NOT NULL,
    "credentialBackedUp" boolean NOT NULL,
    transports text
);


--
-- Name: balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.balances (
    id text NOT NULL,
    "companyId" text NOT NULL,
    type text NOT NULL,
    amount integer DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: book_summaries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_summaries (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    author text NOT NULL,
    year integer,
    "coverUrl" text,
    summary text NOT NULL,
    "whatsUnique" text,
    ideas text,
    resources jsonb,
    "metaTitle" text,
    "metaDescription" text,
    published boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: brain_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brain_entries (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "authorId" text NOT NULL,
    type text DEFAULT 'note'::text NOT NULL,
    title text NOT NULL,
    content text,
    url text,
    "filePath" text,
    tags text[] DEFAULT ARRAY[]::text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: call_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.call_logs (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "contactId" text,
    "integrationKey" text,
    "fromNumber" text,
    "toNumber" text NOT NULL,
    direction text DEFAULT 'outbound'::text NOT NULL,
    status text DEFAULT 'initiated'::text NOT NULL,
    "durationSec" integer DEFAULT 0 NOT NULL,
    "recordingUrl" text,
    notes text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaigns (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    theme text,
    "startsOn" timestamp(3) without time zone,
    "endsOn" timestamp(3) without time zone,
    kpi jsonb,
    status text DEFAULT 'draft'::text NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.channels (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    config jsonb,
    health jsonb,
    status text DEFAULT 'active'::text NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: commission_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commission_plans (
    id text NOT NULL,
    "partnerId" text NOT NULL,
    type text NOT NULL,
    rate double precision NOT NULL,
    scope text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id text NOT NULL,
    "agencyId" text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "planId" text,
    settings jsonb,
    "icpSentence" text,
    "strategyStatus" text,
    "sendingIdentityEmail" text,
    "whatsappNumber" text,
    "platformVersion" text DEFAULT '1.0'::text NOT NULL,
    "pendingVersion" text,
    "lockReason" text,
    "lockedAt" timestamp(3) without time zone,
    "primaryContactName" text,
    "primaryContactEmail" text,
    "primaryContactPhone" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "websiteUrl" text
);


--
-- Name: competitors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competitors (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    site text,
    positioning text,
    wins text,
    loses text,
    confirmed boolean DEFAULT false NOT NULL,
    "generatedBy" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    clients text,
    documents jsonb,
    facility text,
    "learnClientsNeg" text,
    "learnClientsPos" text,
    "learnFacilityNeg" text,
    "learnFacilityPos" text,
    "learnProductsNeg" text,
    "learnProductsPos" text,
    products text,
    "segmentId" text
);


--
-- Name: contact_industries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_industries (
    id text NOT NULL,
    "contactId" text NOT NULL,
    "industryId" text NOT NULL
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    title text,
    "accountId" text,
    "personaId" text,
    layer text,
    source text,
    "icpFit" double precision,
    "optInEmail" boolean DEFAULT false NOT NULL,
    "optInWhatsapp" boolean DEFAULT false NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "leadBand" text,
    "leadScore" integer,
    "scoreUpdatedAt" timestamp(3) without time zone
);


--
-- Name: course_enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_enrollments (
    id text NOT NULL,
    "userId" text NOT NULL,
    "courseId" text NOT NULL,
    progress double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'enrolled'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    category text,
    status text DEFAULT 'draft'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: credit_ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_ledger (
    id text NOT NULL,
    "companyId" text NOT NULL,
    type text NOT NULL,
    amount integer NOT NULL,
    reason text,
    "refType" text,
    "refId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: credit_packs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_packs (
    id text NOT NULL,
    "companyId" text NOT NULL,
    type text NOT NULL,
    amount integer NOT NULL,
    price double precision,
    "purchasedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: crm_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_tasks (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "dealId" text,
    title text NOT NULL,
    description text,
    "assigneeId" text,
    "dueAt" timestamp(3) without time zone,
    status text DEFAULT 'open'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: deal_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deal_activities (
    id text NOT NULL,
    "dealId" text NOT NULL,
    type text NOT NULL,
    content text,
    "actorId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deals (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "accountId" text,
    "contactId" text,
    "stageId" text,
    value double precision,
    "rmId" text,
    "sourceHandoffId" text,
    "wonAt" timestamp(3) without time zone,
    "lostReason" text,
    status text DEFAULT 'open'::text NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: debriefs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debriefs (
    id text NOT NULL,
    "companyId" text NOT NULL,
    kind text NOT NULL,
    "refId" text,
    outcome jsonb,
    "followUps" jsonb,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: demo_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demo_requests (
    id text NOT NULL,
    name text NOT NULL,
    company text NOT NULL,
    role text,
    email text NOT NULL,
    phone text,
    "whatMake" text,
    status text DEFAULT 'new'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "topProblem" text
);


--
-- Name: email_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_campaigns (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    preheader text,
    body text,
    "fromName" text,
    audience text DEFAULT 'all'::text NOT NULL,
    "audienceLabel" text,
    "listId" text,
    status text DEFAULT 'draft'::text NOT NULL,
    "scheduledAt" timestamp(3) without time zone,
    "sentAt" timestamp(3) without time zone,
    "draftId" text,
    recipients integer DEFAULT 0 NOT NULL,
    sent integer DEFAULT 0 NOT NULL,
    delivered integer DEFAULT 0 NOT NULL,
    opened integer DEFAULT 0 NOT NULL,
    clicked integer DEFAULT 0 NOT NULL,
    replied integer DEFAULT 0 NOT NULL,
    bounced integer DEFAULT 0 NOT NULL,
    unsubscribed integer DEFAULT 0 NOT NULL,
    "metricsSource" text DEFAULT 'manual'::text NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: email_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_drafts (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "authorId" text,
    intent text,
    tone text,
    "icpContext" text,
    subject text,
    body text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: email_personalizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_personalizations (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "draftId" text NOT NULL,
    "contactId" text,
    subject text,
    body text,
    status text DEFAULT 'draft'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: email_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_providers (
    id text NOT NULL,
    "companyId" text,
    type text NOT NULL,
    config jsonb,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: enrichment_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrichment_jobs (
    id text NOT NULL,
    "companyId" text NOT NULL,
    provider text,
    status text DEFAULT 'pending'::text NOT NULL,
    results jsonb,
    "creditsUsed" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrollments (
    id text NOT NULL,
    "sequenceId" text NOT NULL,
    "contactId" text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "currentStep" integer DEFAULT 1 NOT NULL,
    "enrolledAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flags (
    id text NOT NULL,
    "companyId" text NOT NULL,
    flag text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: gift_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gift_events (
    id text NOT NULL,
    "giftId" text NOT NULL,
    "contactId" text,
    "eventType" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: gifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gifts (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    "fileUrl" text,
    persona text,
    "stepTag" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: icp_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.icp_profiles (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "minDealSize" text,
    "typicalDealSize" text,
    "primaryBuyer" text,
    "buyerRanking" text,
    "strongVerticals" text,
    "companySize" text,
    "topRegions" text,
    "salesCycleLength" text,
    "ltvVsDealSize" text,
    "antiIcp" text,
    "icpSentence" text,
    version integer DEFAULT 1 NOT NULL,
    "confirmedBy" text,
    "confirmedAt" timestamp(3) without time zone,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: inbox_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inbox_messages (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "contactId" text,
    direction text NOT NULL,
    channel text,
    subject text,
    body text,
    classification text,
    "isMql" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: industries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.industries (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    description text,
    "buyingTriggers" text,
    "painPoints" text,
    "keyRoles" text,
    regulations text,
    notes text,
    documents jsonb,
    "generatedBy" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: industry_segments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.industry_segments (
    id text NOT NULL,
    "industryId" text NOT NULL,
    "segmentId" text NOT NULL
);


--
-- Name: integration_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integration_configs (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "integrationKey" text NOT NULL,
    config jsonb,
    active boolean DEFAULT false NOT NULL,
    status text DEFAULT 'configured'::text NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: integration_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integration_requests (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    category text,
    description text,
    status text DEFAULT 'requested'::text NOT NULL,
    "adminNote" text,
    "requestedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integrations (
    id text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    description text,
    logo text,
    fields jsonb,
    status text DEFAULT 'available'::text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: interview_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interview_questions (
    id text NOT NULL,
    "interviewId" text NOT NULL,
    question text NOT NULL,
    source text,
    answer text,
    "appliedTo" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: interviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interviews (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "scheduledAt" timestamp(3) without time zone,
    "conductedBy" text,
    "transcriptPath" text,
    status text DEFAULT 'scheduled'::text NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: invoice_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_records (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "dealId" text,
    amount double precision NOT NULL,
    "gstAmount" double precision,
    reference text,
    status text DEFAULT 'draft'::text NOT NULL,
    "issuedAt" timestamp(3) without time zone,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id text NOT NULL,
    "companyId" text NOT NULL,
    amount double precision NOT NULL,
    "gstAmount" double precision,
    status text DEFAULT 'draft'::text NOT NULL,
    "issuedAt" timestamp(3) without time zone,
    "paidAt" timestamp(3) without time zone,
    reference text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: kb_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kb_documents (
    id text NOT NULL,
    "companyId" text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    "sourceUrl" text,
    "storagePath" text,
    "isPublic" boolean DEFAULT false NOT NULL,
    mime text,
    "extractedText" text,
    tags text[] DEFAULT ARRAY[]::text[],
    version integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: keywords; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.keywords (
    id text NOT NULL,
    "companyId" text NOT NULL,
    keyword text NOT NULL,
    layer text,
    intent text,
    "monthlyVolume" integer,
    "targetUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: kpi_measurements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_measurements (
    id text NOT NULL,
    "kpiId" text NOT NULL,
    "companyId" text NOT NULL,
    "weekStart" timestamp(3) without time zone NOT NULL,
    value double precision NOT NULL,
    note text,
    "isAuto" boolean DEFAULT false NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: kpis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpis (
    id text NOT NULL,
    "companyId" text NOT NULL,
    key text NOT NULL,
    label text NOT NULL,
    unit text,
    category text,
    source text DEFAULT 'manual'::text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    hidden boolean DEFAULT false NOT NULL,
    "higherIsBetter" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: lead_score_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_score_events (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "contactId" text NOT NULL,
    score integer NOT NULL,
    band text,
    reason text,
    factors jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id text NOT NULL,
    "courseId" text NOT NULL,
    title text NOT NULL,
    content text,
    "position" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: list_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.list_contacts (
    id text NOT NULL,
    "listId" text NOT NULL,
    "contactId" text NOT NULL,
    "addedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lists (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    source text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: lock_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lock_events (
    id text NOT NULL,
    "companyId" text NOT NULL,
    type text NOT NULL,
    reason text,
    "actorId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: mailbox_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mailbox_connections (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "userId" text NOT NULL,
    provider text NOT NULL,
    "emailAddress" text,
    status text DEFAULT 'pending'::text NOT NULL,
    scope text,
    "accessToken" text,
    "refreshToken" text,
    "tokenExpiry" timestamp(3) without time zone,
    "lastSyncAt" timestamp(3) without time zone,
    "contactsImported" integer DEFAULT 0 NOT NULL,
    meta jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: marketing_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketing_plans (
    id text NOT NULL,
    "companyId" text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    sections jsonb,
    "generatedBy" text,
    "lastReviewedAt" timestamp(3) without time zone,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.memberships (
    id text NOT NULL,
    "userId" text NOT NULL,
    "scopeType" text NOT NULL,
    "scopeId" text,
    role text NOT NULL,
    "allocatedCompanyIds" text[] DEFAULT ARRAY[]::text[],
    "grantedBy" text,
    "companyId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: mql_handoffs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mql_handoffs (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "contactId" text,
    "accountId" text,
    "threadRef" text,
    score double precision,
    "sourceCampaignId" text,
    notes text,
    "crmDealId" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: opportunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunities (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "accountId" text,
    "contactId" text,
    value double precision,
    stage text DEFAULT 'new'::text NOT NULL,
    "sourceCampaignId" text,
    "ownerId" text,
    notes text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "opportunityId" text,
    value double precision,
    "orderDate" timestamp(3) without time zone,
    reference text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: partner_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_applications (
    id text NOT NULL,
    "agencyName" text NOT NULL,
    "companyName" text NOT NULL,
    email text NOT NULL,
    mobile text NOT NULL,
    website text,
    "numCustomers" text,
    "yearsInOperation" text,
    "numEmployees" text,
    regions text[],
    message text,
    status text DEFAULT 'open'::text NOT NULL,
    source text DEFAULT 'partner_page'::text NOT NULL,
    "assignedToId" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: partners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partners (
    id text NOT NULL,
    "userId" text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    scope text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: password_set_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_set_tokens (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: payment_ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_ledger (
    id text NOT NULL,
    "entryType" text NOT NULL,
    amount double precision NOT NULL,
    "invoiceId" text,
    "partnerId" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "invoiceId" text,
    amount double precision NOT NULL,
    method text,
    reference text,
    "paidAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: payouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payouts (
    id text NOT NULL,
    "partnerId" text NOT NULL,
    period text NOT NULL,
    amount double precision NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: personas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personas (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    family text,
    pains text,
    kpis text,
    "pyramidLayers" text[] DEFAULT ARRAY[]::text[],
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: pipeline_stages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pipeline_stages (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    color text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id text NOT NULL,
    name text NOT NULL,
    tier text NOT NULL,
    price double precision,
    features jsonb,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_comments (
    id text NOT NULL,
    "postId" text NOT NULL,
    "authorName" text NOT NULL,
    "authorUrl" text,
    "authorAvatar" text,
    body text NOT NULL,
    "linkedinId" text,
    sentiment text,
    featured boolean DEFAULT false NOT NULL,
    "capturedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: post_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_metrics (
    id text NOT NULL,
    "postId" text NOT NULL,
    "capturedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    impressions integer DEFAULT 0 NOT NULL,
    reactions integer DEFAULT 0 NOT NULL,
    comments integer DEFAULT 0 NOT NULL,
    clicks integer DEFAULT 0 NOT NULL,
    source text DEFAULT 'manual'::text NOT NULL
);


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "campaignId" text,
    "channelId" text,
    body text,
    media jsonb,
    layer text,
    "personaId" text,
    topic text,
    status text DEFAULT 'idea'::text NOT NULL,
    "scheduledAt" timestamp(3) without time zone,
    "publishedAt" timestamp(3) without time zone,
    "publishedUrl" text,
    "approvedBy" text,
    "generatedBy" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    category text,
    specs jsonb,
    usp text,
    "targetBuyer" text,
    "priceBand" text,
    confirmed boolean DEFAULT false NOT NULL,
    "generatedBy" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: projection_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projection_leads (
    id text NOT NULL,
    name text NOT NULL,
    company text NOT NULL,
    email text NOT NULL,
    mobile text NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    "requiredRevenue" double precision NOT NULL,
    "avgDealSize" double precision NOT NULL,
    "prospectToEnquiry" double precision NOT NULL,
    "enquiryToQuote" double precision NOT NULL,
    "quoteToOrder" double precision NOT NULL,
    "dealsNeeded" double precision NOT NULL,
    "quotesNeeded" double precision NOT NULL,
    "enquiriesNeeded" double precision NOT NULL,
    "prospectsNeeded" double precision NOT NULL,
    results jsonb,
    status text DEFAULT 'prospect'::text NOT NULL,
    source text DEFAULT 'projection_calculator'::text NOT NULL,
    notes text,
    "emailedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: proposal_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposal_versions (
    id text NOT NULL,
    "proposalId" text NOT NULL,
    version integer NOT NULL,
    body jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: proposal_view_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposal_view_events (
    id text NOT NULL,
    "proposalId" text NOT NULL,
    "viewerIp" text,
    "userAgent" text,
    "viewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposals (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "dealId" text,
    title text NOT NULL,
    body jsonb,
    version integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    token text,
    "tokenExpiresAt" timestamp(3) without time zone,
    noindex boolean DEFAULT true NOT NULL,
    "generatedBy" text,
    "promptVersion" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: releases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.releases (
    id text NOT NULL,
    version text NOT NULL,
    changelog text NOT NULL,
    "eligibleCompanyIds" text[] DEFAULT ARRAY[]::text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: rule_of_ones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rule_of_ones (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    "currentStep" integer DEFAULT 0 NOT NULL,
    document jsonb,
    review jsonb,
    audience jsonb,
    "generatedBy" text,
    "createdBy" text,
    "updatedBy" text,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: segments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.segments (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    description text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: seo_audits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_audits (
    id text NOT NULL,
    "companyId" text NOT NULL,
    url text NOT NULL,
    "overallScore" integer DEFAULT 0 NOT NULL,
    "subScores" jsonb,
    issues jsonb,
    keywords jsonb,
    summary text,
    "isAuto" boolean DEFAULT false NOT NULL,
    "createdBy" text,
    "auditedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: sequence_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sequence_steps (
    id text NOT NULL,
    "sequenceId" text NOT NULL,
    "stepNumber" integer NOT NULL,
    "channelType" text NOT NULL,
    "delayDays" integer DEFAULT 0 NOT NULL,
    "templateId" text,
    config jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: sequences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sequences (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    "cadenceType" text,
    status text DEFAULT 'draft'::text NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: statements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.statements (
    id text NOT NULL,
    "partnerId" text NOT NULL,
    period text NOT NULL,
    data jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: strategies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.strategies (
    id text NOT NULL,
    "companyId" text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    "signedBy" text,
    "signedAt" timestamp(3) without time zone,
    sections jsonb,
    "generatedBy" text,
    "promptVersion" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "planId" text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "startsAt" timestamp(3) without time zone,
    "endsAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.templates (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    persona text,
    angle text,
    body text NOT NULL,
    variables jsonb,
    "whyItWorks" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: touches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.touches (
    id text NOT NULL,
    "enrollmentId" text NOT NULL,
    "stepId" text NOT NULL,
    "sentAt" timestamp(3) without time zone,
    "openedAt" timestamp(3) without time zone,
    "repliedAt" timestamp(3) without time zone,
    "bouncedAt" timestamp(3) without time zone,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: trainings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trainings (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "scheduledAt" timestamp(3) without time zone,
    topic text,
    attendees jsonb,
    status text DEFAULT 'scheduled'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: triggers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.triggers (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "accountId" text,
    type text NOT NULL,
    config jsonb,
    "expiresAt" timestamp(3) without time zone,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    phone text,
    "avatarUrl" text,
    "passwordHash" text,
    "emailVerified" timestamp(3) without time zone,
    image text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_tokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


--
-- Name: version_agreements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.version_agreements (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "releaseId" text NOT NULL,
    "userId" text NOT NULL,
    decision text NOT NULL,
    "decidedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: voice_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voice_leads (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text,
    phone text NOT NULL,
    email text,
    "companyName" text,
    message text,
    source text,
    campaign text,
    keyword text,
    "utmSource" text,
    "utmMedium" text,
    "utmCampaign" text,
    "landingPage" text,
    "formReceivedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "firstCallAt" timestamp(3) without time zone,
    "secondsToCall" integer,
    "lastAttemptAt" timestamp(3) without time zone,
    attempts integer DEFAULT 0 NOT NULL,
    "nextRetryAt" timestamp(3) without time zone,
    status text DEFAULT 'new'::text NOT NULL,
    outcome text,
    "callProvider" text,
    "providerCallId" text,
    "recordingUrl" text,
    transcript text,
    summary text,
    extracted jsonb,
    score integer,
    band text,
    "scoreReason" text,
    "pushedToCrm" boolean DEFAULT false NOT NULL,
    "crmRef" text,
    "alertsSent" jsonb,
    "attemptLog" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: whatsapp_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_messages (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "providerId" text,
    "contactId" text,
    "toNumber" text NOT NULL,
    body text,
    "attachmentUrl" text,
    status text DEFAULT 'queued'::text NOT NULL,
    "providerMessageId" text,
    error text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: whatsapp_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_providers (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    endpoint text,
    "apiKey" text,
    "senderNumber" text,
    config jsonb,
    active boolean DEFAULT false NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: whatsapp_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_templates (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    body text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: workflow_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_campaigns (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    goal text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: workflow_run_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_run_versions (
    id text NOT NULL,
    "runId" text NOT NULL,
    version integer NOT NULL,
    output text,
    inputs jsonb,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: workflow_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_runs (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "campaignId" text,
    "workflowKey" text NOT NULL,
    "workflowTitle" text NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    "currentStep" integer DEFAULT 0 NOT NULL,
    inputs jsonb,
    output text,
    "verifiedFacts" jsonb,
    "stressTest" text,
    version integer DEFAULT 0 NOT NULL,
    "pushedTo" jsonb,
    "generatedBy" text,
    "createdBy" text,
    "updatedBy" text,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: agencies agencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agencies
    ADD CONSTRAINT agencies_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auth_accounts auth_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_accounts
    ADD CONSTRAINT auth_accounts_pkey PRIMARY KEY (provider, "providerAccountId");


--
-- Name: authenticators authenticators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authenticators
    ADD CONSTRAINT authenticators_pkey PRIMARY KEY ("userId", "credentialID");


--
-- Name: balances balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balances
    ADD CONSTRAINT balances_pkey PRIMARY KEY (id);


--
-- Name: book_summaries book_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_summaries
    ADD CONSTRAINT book_summaries_pkey PRIMARY KEY (id);


--
-- Name: brain_entries brain_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brain_entries
    ADD CONSTRAINT brain_entries_pkey PRIMARY KEY (id);


--
-- Name: call_logs call_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_logs
    ADD CONSTRAINT call_logs_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: channels channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_pkey PRIMARY KEY (id);


--
-- Name: commission_plans commission_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_plans
    ADD CONSTRAINT commission_plans_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: competitors competitors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitors
    ADD CONSTRAINT competitors_pkey PRIMARY KEY (id);


--
-- Name: contact_industries contact_industries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_industries
    ADD CONSTRAINT contact_industries_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: course_enrollments course_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: credit_ledger credit_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_ledger
    ADD CONSTRAINT credit_ledger_pkey PRIMARY KEY (id);


--
-- Name: credit_packs credit_packs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_packs
    ADD CONSTRAINT credit_packs_pkey PRIMARY KEY (id);


--
-- Name: crm_tasks crm_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_tasks
    ADD CONSTRAINT crm_tasks_pkey PRIMARY KEY (id);


--
-- Name: deal_activities deal_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_activities
    ADD CONSTRAINT deal_activities_pkey PRIMARY KEY (id);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (id);


--
-- Name: debriefs debriefs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debriefs
    ADD CONSTRAINT debriefs_pkey PRIMARY KEY (id);


--
-- Name: demo_requests demo_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demo_requests
    ADD CONSTRAINT demo_requests_pkey PRIMARY KEY (id);


--
-- Name: email_campaigns email_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_campaigns
    ADD CONSTRAINT email_campaigns_pkey PRIMARY KEY (id);


--
-- Name: email_drafts email_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_drafts
    ADD CONSTRAINT email_drafts_pkey PRIMARY KEY (id);


--
-- Name: email_personalizations email_personalizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_personalizations
    ADD CONSTRAINT email_personalizations_pkey PRIMARY KEY (id);


--
-- Name: email_providers email_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_providers
    ADD CONSTRAINT email_providers_pkey PRIMARY KEY (id);


--
-- Name: enrichment_jobs enrichment_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrichment_jobs
    ADD CONSTRAINT enrichment_jobs_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: gift_events gift_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_events
    ADD CONSTRAINT gift_events_pkey PRIMARY KEY (id);


--
-- Name: gifts gifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gifts
    ADD CONSTRAINT gifts_pkey PRIMARY KEY (id);


--
-- Name: icp_profiles icp_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.icp_profiles
    ADD CONSTRAINT icp_profiles_pkey PRIMARY KEY (id);


--
-- Name: inbox_messages inbox_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbox_messages
    ADD CONSTRAINT inbox_messages_pkey PRIMARY KEY (id);


--
-- Name: industries industries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.industries
    ADD CONSTRAINT industries_pkey PRIMARY KEY (id);


--
-- Name: industry_segments industry_segments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.industry_segments
    ADD CONSTRAINT industry_segments_pkey PRIMARY KEY (id);


--
-- Name: integration_configs integration_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_configs
    ADD CONSTRAINT integration_configs_pkey PRIMARY KEY (id);


--
-- Name: integration_requests integration_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_requests
    ADD CONSTRAINT integration_requests_pkey PRIMARY KEY (id);


--
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- Name: interview_questions interview_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_questions
    ADD CONSTRAINT interview_questions_pkey PRIMARY KEY (id);


--
-- Name: interviews interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_pkey PRIMARY KEY (id);


--
-- Name: invoice_records invoice_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_records
    ADD CONSTRAINT invoice_records_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: kb_documents kb_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_documents
    ADD CONSTRAINT kb_documents_pkey PRIMARY KEY (id);


--
-- Name: keywords keywords_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.keywords
    ADD CONSTRAINT keywords_pkey PRIMARY KEY (id);


--
-- Name: kpi_measurements kpi_measurements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_measurements
    ADD CONSTRAINT kpi_measurements_pkey PRIMARY KEY (id);


--
-- Name: kpis kpis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpis
    ADD CONSTRAINT kpis_pkey PRIMARY KEY (id);


--
-- Name: lead_score_events lead_score_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_score_events
    ADD CONSTRAINT lead_score_events_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: list_contacts list_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.list_contacts
    ADD CONSTRAINT list_contacts_pkey PRIMARY KEY (id);


--
-- Name: lists lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT lists_pkey PRIMARY KEY (id);


--
-- Name: lock_events lock_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lock_events
    ADD CONSTRAINT lock_events_pkey PRIMARY KEY (id);


--
-- Name: mailbox_connections mailbox_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mailbox_connections
    ADD CONSTRAINT mailbox_connections_pkey PRIMARY KEY (id);


--
-- Name: marketing_plans marketing_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_plans
    ADD CONSTRAINT marketing_plans_pkey PRIMARY KEY (id);


--
-- Name: memberships memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_pkey PRIMARY KEY (id);


--
-- Name: mql_handoffs mql_handoffs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mql_handoffs
    ADD CONSTRAINT mql_handoffs_pkey PRIMARY KEY (id);


--
-- Name: opportunities opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: partner_applications partner_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_applications
    ADD CONSTRAINT partner_applications_pkey PRIMARY KEY (id);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: password_set_tokens password_set_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_set_tokens
    ADD CONSTRAINT password_set_tokens_pkey PRIMARY KEY (id);


--
-- Name: payment_ledger payment_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_ledger
    ADD CONSTRAINT payment_ledger_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payouts payouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_pkey PRIMARY KEY (id);


--
-- Name: personas personas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_pkey PRIMARY KEY (id);


--
-- Name: pipeline_stages pipeline_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT pipeline_stages_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_metrics post_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_metrics
    ADD CONSTRAINT post_metrics_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: projection_leads projection_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projection_leads
    ADD CONSTRAINT projection_leads_pkey PRIMARY KEY (id);


--
-- Name: proposal_versions proposal_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_versions
    ADD CONSTRAINT proposal_versions_pkey PRIMARY KEY (id);


--
-- Name: proposal_view_events proposal_view_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_view_events
    ADD CONSTRAINT proposal_view_events_pkey PRIMARY KEY (id);


--
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- Name: releases releases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.releases
    ADD CONSTRAINT releases_pkey PRIMARY KEY (id);


--
-- Name: rule_of_ones rule_of_ones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rule_of_ones
    ADD CONSTRAINT rule_of_ones_pkey PRIMARY KEY (id);


--
-- Name: segments segments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.segments
    ADD CONSTRAINT segments_pkey PRIMARY KEY (id);


--
-- Name: seo_audits seo_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_audits
    ADD CONSTRAINT seo_audits_pkey PRIMARY KEY (id);


--
-- Name: sequence_steps sequence_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sequence_steps
    ADD CONSTRAINT sequence_steps_pkey PRIMARY KEY (id);


--
-- Name: sequences sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sequences
    ADD CONSTRAINT sequences_pkey PRIMARY KEY (id);


--
-- Name: statements statements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statements
    ADD CONSTRAINT statements_pkey PRIMARY KEY (id);


--
-- Name: strategies strategies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategies
    ADD CONSTRAINT strategies_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: touches touches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.touches
    ADD CONSTRAINT touches_pkey PRIMARY KEY (id);


--
-- Name: trainings trainings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT trainings_pkey PRIMARY KEY (id);


--
-- Name: triggers triggers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triggers
    ADD CONSTRAINT triggers_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verification_tokens verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token);


--
-- Name: version_agreements version_agreements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_agreements
    ADD CONSTRAINT version_agreements_pkey PRIMARY KEY (id);


--
-- Name: voice_leads voice_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_leads
    ADD CONSTRAINT voice_leads_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_messages whatsapp_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT whatsapp_messages_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_providers whatsapp_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_providers
    ADD CONSTRAINT whatsapp_providers_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_templates whatsapp_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_templates
    ADD CONSTRAINT whatsapp_templates_pkey PRIMARY KEY (id);


--
-- Name: workflow_campaigns workflow_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_campaigns
    ADD CONSTRAINT workflow_campaigns_pkey PRIMARY KEY (id);


--
-- Name: workflow_run_versions workflow_run_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_run_versions
    ADD CONSTRAINT workflow_run_versions_pkey PRIMARY KEY (id);


--
-- Name: workflow_runs workflow_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_runs
    ADD CONSTRAINT workflow_runs_pkey PRIMARY KEY (id);


--
-- Name: accounts_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_companyId_idx" ON public.accounts USING btree ("companyId");


--
-- Name: agencies_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX agencies_slug_key ON public.agencies USING btree (slug);


--
-- Name: api_keys_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "api_keys_companyId_idx" ON public.api_keys USING btree ("companyId");


--
-- Name: api_keys_keyHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "api_keys_keyHash_key" ON public.api_keys USING btree ("keyHash");


--
-- Name: audit_logs_actorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_actorId_idx" ON public.audit_logs USING btree ("actorId");


--
-- Name: audit_logs_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_companyId_idx" ON public.audit_logs USING btree ("companyId");


--
-- Name: audit_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_createdAt_idx" ON public.audit_logs USING btree ("createdAt");


--
-- Name: auth_accounts_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "auth_accounts_userId_idx" ON public.auth_accounts USING btree ("userId");


--
-- Name: authenticators_credentialID_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "authenticators_credentialID_key" ON public.authenticators USING btree ("credentialID");


--
-- Name: balances_companyId_type_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "balances_companyId_type_key" ON public.balances USING btree ("companyId", type);


--
-- Name: book_summaries_published_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX book_summaries_published_order_idx ON public.book_summaries USING btree (published, "order");


--
-- Name: book_summaries_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX book_summaries_slug_key ON public.book_summaries USING btree (slug);


--
-- Name: brain_entries_authorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "brain_entries_authorId_idx" ON public.brain_entries USING btree ("authorId");


--
-- Name: brain_entries_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "brain_entries_companyId_idx" ON public.brain_entries USING btree ("companyId");


--
-- Name: call_logs_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "call_logs_companyId_idx" ON public.call_logs USING btree ("companyId");


--
-- Name: call_logs_contactId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "call_logs_contactId_idx" ON public.call_logs USING btree ("contactId");


--
-- Name: campaigns_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "campaigns_companyId_idx" ON public.campaigns USING btree ("companyId");


--
-- Name: channels_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "channels_companyId_idx" ON public.channels USING btree ("companyId");


--
-- Name: channels_companyId_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "channels_companyId_type_idx" ON public.channels USING btree ("companyId", type);


--
-- Name: commission_plans_partnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "commission_plans_partnerId_idx" ON public.commission_plans USING btree ("partnerId");


--
-- Name: companies_agencyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "companies_agencyId_idx" ON public.companies USING btree ("agencyId");


--
-- Name: companies_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX companies_slug_idx ON public.companies USING btree (slug);


--
-- Name: companies_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX companies_slug_key ON public.companies USING btree (slug);


--
-- Name: companies_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX companies_status_idx ON public.companies USING btree (status);


--
-- Name: competitors_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "competitors_companyId_idx" ON public.competitors USING btree ("companyId");


--
-- Name: competitors_segmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "competitors_segmentId_idx" ON public.competitors USING btree ("segmentId");


--
-- Name: contact_industries_contactId_industryId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "contact_industries_contactId_industryId_key" ON public.contact_industries USING btree ("contactId", "industryId");


--
-- Name: contact_industries_industryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "contact_industries_industryId_idx" ON public.contact_industries USING btree ("industryId");


--
-- Name: contacts_accountId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "contacts_accountId_idx" ON public.contacts USING btree ("accountId");


--
-- Name: contacts_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "contacts_companyId_idx" ON public.contacts USING btree ("companyId");


--
-- Name: course_enrollments_userId_courseId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "course_enrollments_userId_courseId_key" ON public.course_enrollments USING btree ("userId", "courseId");


--
-- Name: credit_ledger_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "credit_ledger_companyId_idx" ON public.credit_ledger USING btree ("companyId");


--
-- Name: crm_tasks_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "crm_tasks_companyId_idx" ON public.crm_tasks USING btree ("companyId");


--
-- Name: deal_activities_dealId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "deal_activities_dealId_idx" ON public.deal_activities USING btree ("dealId");


--
-- Name: deals_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "deals_companyId_idx" ON public.deals USING btree ("companyId");


--
-- Name: deals_stageId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "deals_stageId_idx" ON public.deals USING btree ("stageId");


--
-- Name: debriefs_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "debriefs_companyId_idx" ON public.debriefs USING btree ("companyId");


--
-- Name: demo_requests_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "demo_requests_createdAt_idx" ON public.demo_requests USING btree ("createdAt");


--
-- Name: demo_requests_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX demo_requests_status_idx ON public.demo_requests USING btree (status);


--
-- Name: email_campaigns_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "email_campaigns_companyId_idx" ON public.email_campaigns USING btree ("companyId");


--
-- Name: email_drafts_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "email_drafts_companyId_idx" ON public.email_drafts USING btree ("companyId");


--
-- Name: email_personalizations_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "email_personalizations_companyId_idx" ON public.email_personalizations USING btree ("companyId");


--
-- Name: email_personalizations_draftId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "email_personalizations_draftId_idx" ON public.email_personalizations USING btree ("draftId");


--
-- Name: email_providers_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "email_providers_companyId_idx" ON public.email_providers USING btree ("companyId");


--
-- Name: enrichment_jobs_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "enrichment_jobs_companyId_idx" ON public.enrichment_jobs USING btree ("companyId");


--
-- Name: enrollments_sequenceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "enrollments_sequenceId_idx" ON public.enrollments USING btree ("sequenceId");


--
-- Name: feature_flags_companyId_flag_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "feature_flags_companyId_flag_key" ON public.feature_flags USING btree ("companyId", flag);


--
-- Name: feature_flags_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "feature_flags_companyId_idx" ON public.feature_flags USING btree ("companyId");


--
-- Name: gift_events_giftId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "gift_events_giftId_idx" ON public.gift_events USING btree ("giftId");


--
-- Name: gifts_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "gifts_companyId_idx" ON public.gifts USING btree ("companyId");


--
-- Name: icp_profiles_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "icp_profiles_companyId_idx" ON public.icp_profiles USING btree ("companyId");


--
-- Name: inbox_messages_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "inbox_messages_companyId_idx" ON public.inbox_messages USING btree ("companyId");


--
-- Name: industries_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "industries_companyId_idx" ON public.industries USING btree ("companyId");


--
-- Name: industry_segments_industryId_segmentId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "industry_segments_industryId_segmentId_key" ON public.industry_segments USING btree ("industryId", "segmentId");


--
-- Name: industry_segments_segmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "industry_segments_segmentId_idx" ON public.industry_segments USING btree ("segmentId");


--
-- Name: integration_configs_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "integration_configs_companyId_idx" ON public.integration_configs USING btree ("companyId");


--
-- Name: integration_configs_companyId_integrationKey_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "integration_configs_companyId_integrationKey_key" ON public.integration_configs USING btree ("companyId", "integrationKey");


--
-- Name: integration_requests_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "integration_requests_companyId_idx" ON public.integration_requests USING btree ("companyId");


--
-- Name: integrations_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX integrations_key_key ON public.integrations USING btree (key);


--
-- Name: interview_questions_interviewId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "interview_questions_interviewId_idx" ON public.interview_questions USING btree ("interviewId");


--
-- Name: interviews_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "interviews_companyId_idx" ON public.interviews USING btree ("companyId");


--
-- Name: kb_documents_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "kb_documents_companyId_idx" ON public.kb_documents USING btree ("companyId");


--
-- Name: kb_documents_companyId_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "kb_documents_companyId_type_idx" ON public.kb_documents USING btree ("companyId", type);


--
-- Name: keywords_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "keywords_companyId_idx" ON public.keywords USING btree ("companyId");


--
-- Name: kpi_measurements_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "kpi_measurements_companyId_idx" ON public.kpi_measurements USING btree ("companyId");


--
-- Name: kpi_measurements_kpiId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "kpi_measurements_kpiId_idx" ON public.kpi_measurements USING btree ("kpiId");


--
-- Name: kpi_measurements_kpiId_weekStart_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "kpi_measurements_kpiId_weekStart_key" ON public.kpi_measurements USING btree ("kpiId", "weekStart");


--
-- Name: kpis_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "kpis_companyId_idx" ON public.kpis USING btree ("companyId");


--
-- Name: kpis_companyId_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "kpis_companyId_key_key" ON public.kpis USING btree ("companyId", key);


--
-- Name: lead_score_events_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "lead_score_events_companyId_idx" ON public.lead_score_events USING btree ("companyId");


--
-- Name: lead_score_events_contactId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "lead_score_events_contactId_idx" ON public.lead_score_events USING btree ("contactId");


--
-- Name: lessons_courseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "lessons_courseId_idx" ON public.lessons USING btree ("courseId");


--
-- Name: list_contacts_listId_contactId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "list_contacts_listId_contactId_key" ON public.list_contacts USING btree ("listId", "contactId");


--
-- Name: lists_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "lists_companyId_idx" ON public.lists USING btree ("companyId");


--
-- Name: lock_events_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "lock_events_companyId_idx" ON public.lock_events USING btree ("companyId");


--
-- Name: mailbox_connections_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "mailbox_connections_companyId_idx" ON public.mailbox_connections USING btree ("companyId");


--
-- Name: mailbox_connections_companyId_userId_provider_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "mailbox_connections_companyId_userId_provider_key" ON public.mailbox_connections USING btree ("companyId", "userId", provider);


--
-- Name: marketing_plans_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "marketing_plans_companyId_idx" ON public.marketing_plans USING btree ("companyId");


--
-- Name: marketing_plans_companyId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "marketing_plans_companyId_key" ON public.marketing_plans USING btree ("companyId");


--
-- Name: memberships_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "memberships_companyId_idx" ON public.memberships USING btree ("companyId");


--
-- Name: memberships_scopeType_scopeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "memberships_scopeType_scopeId_idx" ON public.memberships USING btree ("scopeType", "scopeId");


--
-- Name: memberships_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "memberships_userId_idx" ON public.memberships USING btree ("userId");


--
-- Name: mql_handoffs_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "mql_handoffs_companyId_idx" ON public.mql_handoffs USING btree ("companyId");


--
-- Name: opportunities_accountId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "opportunities_accountId_idx" ON public.opportunities USING btree ("accountId");


--
-- Name: opportunities_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "opportunities_companyId_idx" ON public.opportunities USING btree ("companyId");


--
-- Name: orders_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "orders_companyId_idx" ON public.orders USING btree ("companyId");


--
-- Name: partner_applications_assignedToId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "partner_applications_assignedToId_idx" ON public.partner_applications USING btree ("assignedToId");


--
-- Name: partner_applications_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "partner_applications_createdAt_idx" ON public.partner_applications USING btree ("createdAt");


--
-- Name: partner_applications_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_applications_status_idx ON public.partner_applications USING btree (status);


--
-- Name: password_set_tokens_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX password_set_tokens_token_key ON public.password_set_tokens USING btree (token);


--
-- Name: payouts_partnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "payouts_partnerId_idx" ON public.payouts USING btree ("partnerId");


--
-- Name: personas_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "personas_companyId_idx" ON public.personas USING btree ("companyId");


--
-- Name: pipeline_stages_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "pipeline_stages_companyId_idx" ON public.pipeline_stages USING btree ("companyId");


--
-- Name: post_comments_linkedinId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "post_comments_linkedinId_key" ON public.post_comments USING btree ("linkedinId");


--
-- Name: post_comments_postId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "post_comments_postId_idx" ON public.post_comments USING btree ("postId");


--
-- Name: post_metrics_postId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "post_metrics_postId_idx" ON public.post_metrics USING btree ("postId");


--
-- Name: posts_campaignId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "posts_campaignId_idx" ON public.posts USING btree ("campaignId");


--
-- Name: posts_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "posts_companyId_idx" ON public.posts USING btree ("companyId");


--
-- Name: products_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "products_companyId_idx" ON public.products USING btree ("companyId");


--
-- Name: projection_leads_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "projection_leads_createdAt_idx" ON public.projection_leads USING btree ("createdAt");


--
-- Name: projection_leads_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX projection_leads_status_idx ON public.projection_leads USING btree (status);


--
-- Name: proposal_versions_proposalId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "proposal_versions_proposalId_idx" ON public.proposal_versions USING btree ("proposalId");


--
-- Name: proposal_view_events_proposalId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "proposal_view_events_proposalId_idx" ON public.proposal_view_events USING btree ("proposalId");


--
-- Name: proposals_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "proposals_companyId_idx" ON public.proposals USING btree ("companyId");


--
-- Name: proposals_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX proposals_token_idx ON public.proposals USING btree (token);


--
-- Name: proposals_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX proposals_token_key ON public.proposals USING btree (token);


--
-- Name: releases_version_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX releases_version_key ON public.releases USING btree (version);


--
-- Name: rule_of_ones_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "rule_of_ones_companyId_idx" ON public.rule_of_ones USING btree ("companyId");


--
-- Name: segments_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "segments_companyId_idx" ON public.segments USING btree ("companyId");


--
-- Name: seo_audits_auditedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "seo_audits_auditedAt_idx" ON public.seo_audits USING btree ("auditedAt");


--
-- Name: seo_audits_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "seo_audits_companyId_idx" ON public.seo_audits USING btree ("companyId");


--
-- Name: sequence_steps_sequenceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sequence_steps_sequenceId_idx" ON public.sequence_steps USING btree ("sequenceId");


--
-- Name: sequences_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sequences_companyId_idx" ON public.sequences USING btree ("companyId");


--
-- Name: sessions_sessionToken_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "sessions_sessionToken_key" ON public.sessions USING btree ("sessionToken");


--
-- Name: sessions_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sessions_userId_idx" ON public.sessions USING btree ("userId");


--
-- Name: strategies_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "strategies_companyId_idx" ON public.strategies USING btree ("companyId");


--
-- Name: templates_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "templates_companyId_idx" ON public.templates USING btree ("companyId");


--
-- Name: touches_enrollmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "touches_enrollmentId_idx" ON public.touches USING btree ("enrollmentId");


--
-- Name: trainings_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "trainings_companyId_idx" ON public.trainings USING btree ("companyId");


--
-- Name: triggers_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "triggers_companyId_idx" ON public.triggers USING btree ("companyId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: version_agreements_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "version_agreements_companyId_idx" ON public.version_agreements USING btree ("companyId");


--
-- Name: version_agreements_releaseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "version_agreements_releaseId_idx" ON public.version_agreements USING btree ("releaseId");


--
-- Name: voice_leads_companyId_band_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "voice_leads_companyId_band_idx" ON public.voice_leads USING btree ("companyId", band);


--
-- Name: voice_leads_companyId_formReceivedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "voice_leads_companyId_formReceivedAt_idx" ON public.voice_leads USING btree ("companyId", "formReceivedAt");


--
-- Name: voice_leads_companyId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "voice_leads_companyId_status_idx" ON public.voice_leads USING btree ("companyId", status);


--
-- Name: whatsapp_messages_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "whatsapp_messages_companyId_idx" ON public.whatsapp_messages USING btree ("companyId");


--
-- Name: whatsapp_messages_contactId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "whatsapp_messages_contactId_idx" ON public.whatsapp_messages USING btree ("contactId");


--
-- Name: whatsapp_providers_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "whatsapp_providers_companyId_idx" ON public.whatsapp_providers USING btree ("companyId");


--
-- Name: whatsapp_templates_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "whatsapp_templates_companyId_idx" ON public.whatsapp_templates USING btree ("companyId");


--
-- Name: workflow_campaigns_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "workflow_campaigns_companyId_idx" ON public.workflow_campaigns USING btree ("companyId");


--
-- Name: workflow_run_versions_runId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "workflow_run_versions_runId_idx" ON public.workflow_run_versions USING btree ("runId");


--
-- Name: workflow_runs_campaignId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "workflow_runs_campaignId_idx" ON public.workflow_runs USING btree ("campaignId");


--
-- Name: workflow_runs_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "workflow_runs_companyId_idx" ON public.workflow_runs USING btree ("companyId");


--
-- Name: accounts accounts_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: api_keys api_keys_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT "api_keys_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: audit_logs audit_logs_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: audit_logs audit_logs_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: auth_accounts auth_accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_accounts
    ADD CONSTRAINT "auth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: authenticators authenticators_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authenticators
    ADD CONSTRAINT "authenticators_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: brain_entries brain_entries_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brain_entries
    ADD CONSTRAINT "brain_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: call_logs call_logs_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_logs
    ADD CONSTRAINT "call_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: call_logs call_logs_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_logs
    ADD CONSTRAINT "call_logs_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: campaigns campaigns_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT "campaigns_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: channels channels_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT "channels_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: commission_plans commission_plans_partnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_plans
    ADD CONSTRAINT "commission_plans_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES public.partners(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: companies companies_agencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "companies_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public.agencies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: competitors competitors_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitors
    ADD CONSTRAINT "competitors_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: competitors competitors_segmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitors
    ADD CONSTRAINT "competitors_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES public.segments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: contact_industries contact_industries_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_industries
    ADD CONSTRAINT "contact_industries_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contact_industries contact_industries_industryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_industries
    ADD CONSTRAINT "contact_industries_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES public.industries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contacts contacts_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "contacts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: contacts contacts_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: contacts contacts_personaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "contacts_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES public.personas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: course_enrollments course_enrollments_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT "course_enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: credit_ledger credit_ledger_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_ledger
    ADD CONSTRAINT "credit_ledger_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: crm_tasks crm_tasks_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_tasks
    ADD CONSTRAINT "crm_tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: deal_activities deal_activities_dealId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_activities
    ADD CONSTRAINT "deal_activities_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: deals deals_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "deals_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: deals deals_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "deals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: deals deals_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "deals_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: deals deals_stageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "deals_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES public.pipeline_stages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: debriefs debriefs_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debriefs
    ADD CONSTRAINT "debriefs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: email_campaigns email_campaigns_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_campaigns
    ADD CONSTRAINT "email_campaigns_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: email_drafts email_drafts_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_drafts
    ADD CONSTRAINT "email_drafts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: email_personalizations email_personalizations_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_personalizations
    ADD CONSTRAINT "email_personalizations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: email_personalizations email_personalizations_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_personalizations
    ADD CONSTRAINT "email_personalizations_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: email_personalizations email_personalizations_draftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_personalizations
    ADD CONSTRAINT "email_personalizations_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES public.email_drafts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: email_providers email_providers_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_providers
    ADD CONSTRAINT "email_providers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enrichment_jobs enrichment_jobs_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrichment_jobs
    ADD CONSTRAINT "enrichment_jobs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: enrollments enrollments_sequenceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "enrollments_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES public.sequences(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: feature_flags feature_flags_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT "feature_flags_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: gift_events gift_events_giftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_events
    ADD CONSTRAINT "gift_events_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES public.gifts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gifts gifts_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gifts
    ADD CONSTRAINT "gifts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: icp_profiles icp_profiles_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.icp_profiles
    ADD CONSTRAINT "icp_profiles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inbox_messages inbox_messages_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbox_messages
    ADD CONSTRAINT "inbox_messages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: industries industries_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.industries
    ADD CONSTRAINT "industries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: industry_segments industry_segments_industryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.industry_segments
    ADD CONSTRAINT "industry_segments_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES public.industries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: industry_segments industry_segments_segmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.industry_segments
    ADD CONSTRAINT "industry_segments_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES public.segments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: integration_configs integration_configs_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_configs
    ADD CONSTRAINT "integration_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: integration_requests integration_requests_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_requests
    ADD CONSTRAINT "integration_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: interview_questions interview_questions_interviewId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_questions
    ADD CONSTRAINT "interview_questions_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES public.interviews(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interviews interviews_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT "interviews_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kb_documents kb_documents_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_documents
    ADD CONSTRAINT "kb_documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: keywords keywords_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.keywords
    ADD CONSTRAINT "keywords_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kpi_measurements kpi_measurements_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_measurements
    ADD CONSTRAINT "kpi_measurements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kpi_measurements kpi_measurements_kpiId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_measurements
    ADD CONSTRAINT "kpi_measurements_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES public.kpis(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kpis kpis_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpis
    ADD CONSTRAINT "kpis_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lead_score_events lead_score_events_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_score_events
    ADD CONSTRAINT "lead_score_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lead_score_events lead_score_events_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_score_events
    ADD CONSTRAINT "lead_score_events_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lessons lessons_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT "lessons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: list_contacts list_contacts_listId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.list_contacts
    ADD CONSTRAINT "list_contacts_listId_fkey" FOREIGN KEY ("listId") REFERENCES public.lists(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lists lists_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT "lists_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: mailbox_connections mailbox_connections_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mailbox_connections
    ADD CONSTRAINT "mailbox_connections_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: marketing_plans marketing_plans_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_plans
    ADD CONSTRAINT "marketing_plans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: memberships memberships_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT "memberships_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: memberships memberships_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mql_handoffs mql_handoffs_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mql_handoffs
    ADD CONSTRAINT "mql_handoffs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: mql_handoffs mql_handoffs_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mql_handoffs
    ADD CONSTRAINT "mql_handoffs_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: opportunities opportunities_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT "opportunities_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: opportunities opportunities_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT "opportunities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: opportunities opportunities_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT "opportunities_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: opportunities opportunities_sourceCampaignId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT "opportunities_sourceCampaignId_fkey" FOREIGN KEY ("sourceCampaignId") REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_opportunityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES public.opportunities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: partner_applications partner_applications_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_applications
    ADD CONSTRAINT "partner_applications_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payouts payouts_partnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT "payouts_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES public.partners(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: personas personas_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT "personas_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pipeline_stages pipeline_stages_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT "pipeline_stages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: post_comments post_comments_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT "post_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_metrics post_metrics_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_metrics
    ADD CONSTRAINT "post_metrics_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: posts posts_campaignId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT "posts_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: posts posts_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT "posts_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public.channels(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: posts posts_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT "posts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: posts posts_personaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT "posts_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES public.personas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: proposal_versions proposal_versions_proposalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_versions
    ADD CONSTRAINT "proposal_versions_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES public.proposals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proposal_view_events proposal_view_events_proposalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_view_events
    ADD CONSTRAINT "proposal_view_events_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES public.proposals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proposals proposals_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT "proposals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: proposals proposals_dealId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT "proposals_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: rule_of_ones rule_of_ones_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rule_of_ones
    ADD CONSTRAINT "rule_of_ones_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: segments segments_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.segments
    ADD CONSTRAINT "segments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: seo_audits seo_audits_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_audits
    ADD CONSTRAINT "seo_audits_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sequence_steps sequence_steps_sequenceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sequence_steps
    ADD CONSTRAINT "sequence_steps_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES public.sequences(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sequences sequences_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sequences
    ADD CONSTRAINT "sequences_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: strategies strategies_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategies
    ADD CONSTRAINT "strategies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subscriptions subscriptions_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: templates templates_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT "templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: touches touches_enrollmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.touches
    ADD CONSTRAINT "touches_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES public.enrollments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: touches touches_stepId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.touches
    ADD CONSTRAINT "touches_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES public.sequence_steps(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: trainings trainings_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT "trainings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: triggers triggers_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triggers
    ADD CONSTRAINT "triggers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: version_agreements version_agreements_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_agreements
    ADD CONSTRAINT "version_agreements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: version_agreements version_agreements_releaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_agreements
    ADD CONSTRAINT "version_agreements_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES public.releases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: version_agreements version_agreements_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_agreements
    ADD CONSTRAINT "version_agreements_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: voice_leads voice_leads_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_leads
    ADD CONSTRAINT "voice_leads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: whatsapp_messages whatsapp_messages_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT "whatsapp_messages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: whatsapp_messages whatsapp_messages_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT "whatsapp_messages_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: whatsapp_messages whatsapp_messages_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT "whatsapp_messages_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public.whatsapp_providers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: whatsapp_providers whatsapp_providers_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_providers
    ADD CONSTRAINT "whatsapp_providers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: whatsapp_templates whatsapp_templates_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_templates
    ADD CONSTRAINT "whatsapp_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: workflow_campaigns workflow_campaigns_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_campaigns
    ADD CONSTRAINT "workflow_campaigns_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: workflow_run_versions workflow_run_versions_runId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_run_versions
    ADD CONSTRAINT "workflow_run_versions_runId_fkey" FOREIGN KEY ("runId") REFERENCES public.workflow_runs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workflow_runs workflow_runs_campaignId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_runs
    ADD CONSTRAINT "workflow_runs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES public.workflow_campaigns(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: workflow_runs workflow_runs_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_runs
    ADD CONSTRAINT "workflow_runs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 3GMIWNhgn0ZAIUOe8retkNRpUMrqRF9xpLaMw1wA9mBAFbfITRdFVKLJi0IvW8g

