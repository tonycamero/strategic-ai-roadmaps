import { db } from '../db/index';
import { sql } from 'drizzle-orm';

async function main() {
    console.log("🛠️ Starting database schema fix (UUID Edition)...");

    const fixStatements = [
        // Drop existing technical graph tables to ensure clean type switch
        `DROP TABLE IF EXISTS "roadmap_graph_edges" CASCADE;`,
        `DROP TABLE IF EXISTS "roadmap_graph_nodes" CASCADE;`,
        `DROP TABLE IF EXISTS "roadmap_graphs" CASCADE;`,

        // Ensure selection_envelopes has envelope_hash
        `DO $$ BEGIN ALTER TABLE "selection_envelopes" ADD COLUMN "envelope_hash" text; EXCEPTION WHEN duplicate_column THEN NULL; END $$;`,

        // Ensure sop_tickets HAS latest Stage-6 fields
        `DO $$ BEGIN ALTER TABLE "sop_tickets" ADD COLUMN "selection_envelope_id" uuid; EXCEPTION WHEN duplicate_column THEN NULL; END $$;`,
        `DO $$ BEGIN ALTER TABLE "sop_tickets" ADD COLUMN "source_finding_ids" jsonb; EXCEPTION WHEN duplicate_column THEN NULL; END $$;`,
        `DO $$ BEGIN ALTER TABLE "sop_tickets" ADD COLUMN "envelope_version" integer; EXCEPTION WHEN duplicate_column THEN NULL; END $$;`,
        `DO $$ BEGIN ALTER TABLE "sop_tickets" ADD COLUMN "generation_event_id" uuid; EXCEPTION WHEN duplicate_column THEN NULL; END $$;`,
        `DO $$ BEGIN ALTER TABLE "sop_tickets" ADD COLUMN "projection_hash" text; EXCEPTION WHEN duplicate_column THEN NULL; END $$;`,
        `DO $$ BEGIN ALTER TABLE "sop_tickets" ADD COLUMN "ticket_key" text; EXCEPTION WHEN duplicate_column THEN NULL; END $$;`,

        // Ensure sas_runs has artifact_state
        `DO $$ BEGIN ALTER TABLE "sas_runs" ADD COLUMN "artifact_state" jsonb; EXCEPTION WHEN duplicate_column THEN NULL; END $$;`,

        // Create Stage-7 tables with UUID ticket references
        `CREATE TABLE IF NOT EXISTS "roadmap_graphs" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "tenant_id" uuid NOT NULL,
            "selection_envelope_id" uuid NOT NULL,
            "projection_hash" text,
            "node_count" integer DEFAULT 0 NOT NULL,
            "edge_count" integer DEFAULT 0 NOT NULL,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );`,
        `CREATE TABLE IF NOT EXISTS "roadmap_graph_nodes" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "graph_id" uuid NOT NULL,
            "sop_ticket_id" uuid NOT NULL, -- SWAP TO UUID
            "capability_id" text,
            "namespace" text,
            "stage" integer NOT NULL,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL
        );`,
        `CREATE TABLE IF NOT EXISTS "roadmap_graph_edges" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "graph_id" uuid NOT NULL,
            "from_ticket_id" uuid NOT NULL, -- SWAP TO UUID
            "to_ticket_id" uuid NOT NULL,   -- SWAP TO UUID
            "dependency_type" varchar(20) NOT NULL,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL
        );`,

        // Add indices and constraints
        `CREATE UNIQUE INDEX IF NOT EXISTS "roadmap_graphs_selection_envelope_unique" ON "roadmap_graphs" ("selection_envelope_id");`,
        `DO $$ BEGIN ALTER TABLE "sop_tickets" ADD CONSTRAINT "sop_tickets_ticket_key_unique" UNIQUE("ticket_key"); EXCEPTION WHEN others THEN NULL; END $$;`,

        // Add foreign keys back
        `DO $$ BEGIN ALTER TABLE "roadmap_graph_nodes" ADD CONSTRAINT "roadmap_graph_nodes_sop_ticket_id_sop_tickets_id_fk" FOREIGN KEY ("sop_ticket_id") REFERENCES "sop_tickets"("id"); EXCEPTION WHEN others THEN NULL; END $$;`,
        `DO $$ BEGIN ALTER TABLE "roadmap_graph_edges" ADD CONSTRAINT "roadmap_graph_edges_from_ticket_id_sop_tickets_id_fk" FOREIGN KEY ("from_ticket_id") REFERENCES "sop_tickets"("id"); EXCEPTION WHEN others THEN NULL; END $$;`,
        `DO $$ BEGIN ALTER TABLE "roadmap_graph_edges" ADD CONSTRAINT "roadmap_graph_edges_to_ticket_id_sop_tickets_id_fk" FOREIGN KEY ("to_ticket_id") REFERENCES "sop_tickets"("id"); EXCEPTION WHEN others THEN NULL; END $$;`
    ];

    for (const statement of fixStatements) {
        try {
            console.log(`Executing: ${statement.substring(0, 100)}...`);
            await db.execute(sql.raw(statement));
        } catch (error) {
            console.error(`Failed statement: ${statement.substring(0, 100)}`);
            console.error(error);
        }
    }

    console.log("✅ Schema fix complete.");
}

main();
