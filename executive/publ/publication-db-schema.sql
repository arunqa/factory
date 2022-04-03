-- This file is human-edited and should be version-controlled.
-- If it's edited, be sure to run Taskfile.ts generate-db-schema-ts task to
-- regenerate the companion publication-db-schema.auto.ts file.

-- Governance:
-- * stick to pure, unadulterated, non-template-driven SQL whenever possible
-- * use 3rd normal form for tables
-- * use views to wrap business logic
-- * when denormalizing is required, use views (don't denormalize tables)
-- * each table name MUST be singular (not plural) noun
-- * each table MUST have a `table_name`_id primary key
-- * each table MUST have `created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL` column
-- * if table's rows are mutable, it MUST have a `updated_at DATETIME` column (not having an updated_at means it's immutable)
-- * if table's rows are deleteable, it MUST have a `deleted_at DATETIME` column for soft deletes (not having an deleted_at means it's immutable)

-- TODO: create a govn_* set of tables that would contain business logic, assurance, presentation, and other details
--       govn_entity would be a table that stores table meta data (descriptions, immutability, presentation, migration instructions, etc.)
--       govn_entity_property would be a table that stores table column meta data (descriptions, immutability, presentation, migration instructions, etc.)
--       govn_entity_relationship would be a table that stores entity/property relationships (1:N, 1:M, etc.) for literate programming documentation, etc.
--       govn_entity_activity would be a table that stores governance history and activity data in JSON format for documentation, migration status, etc.

CREATE TABLE IF NOT EXISTS publ_host (
    publ_host_id INTEGER PRIMARY KEY AUTOINCREMENT,
    host TEXT NOT NULL,
    host_identity JSON,
    mutation_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(host)
);

CREATE TABLE IF NOT EXISTS publ_build_event (
    publ_build_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    publ_host_id INTEGER NOT NULL,
    iteration_index INTEGER NOT NULL,
    build_initiated_at DATETIME NOT NULL,
    build_completed_at DATETIME NOT NULL,
    build_duration_ms INTEGER NOT NULL,
    resources_originated_count INTEGER NOT NULL,
    resources_persisted_count INTEGER NOT NULL,
    resources_memoized_count INTEGER, -- NULL if not memoizing, non-zero if memoized
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY(publ_host_id) REFERENCES publ_host(publ_host_id)
);

CREATE TABLE IF NOT EXISTS publ_server_service (
    publ_server_service_id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_started_at DATETIME,
    listen_host TEXT NOT NULL,
    listen_port INTEGER NOT NULL,
    publish_url TEXT NOT NULL,
    publ_build_event_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY(publ_build_event_id) REFERENCES publ_build_event(publ_build_event_id)
);

-- TODO: add indexes to improve query performance
CREATE TABLE IF NOT EXISTS publ_server_static_access_log (
    publ_server_static_access_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    status INTEGER NOT NULL,
    asset_nature TEXT NOT NULL,
    location_href TEXT NOT NULL,
    filesys_target_path TEXT NOT NULL,
    filesys_target_symlink TEXT,
    publ_server_service_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY(publ_server_service_id) REFERENCES publ_server_service(publ_server_service_id)
);

CREATE TABLE IF NOT EXISTS publ_server_error_log (
    publ_server_error_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_href TEXT NOT NULL,
    error_summary TEXT NOT NULL,
    error_elaboration JSON,
    publ_server_service_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY(publ_server_service_id) REFERENCES publ_server_service(publ_server_service_id)
);
