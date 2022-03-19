-- This file is human-edited and should be version-controlled.
-- If it's edited, be sure to run Taskfile.ts generate-db-schema-ts task to
-- regenerate the companion publication-db-schema.auto.ts file.

CREATE TABLE IF NOT EXISTS publ_host (
    publ_host_id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    host TEXT NOT NULL,
    host_identity JSON,
    mutation_count INTEGER,
    UNIQUE(host)
);

CREATE TABLE IF NOT EXISTS publ_build_event (
    publ_build_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    publ_host_id INTEGER NOT NULL,
    iteration_index INTEGER NOT NULL,
    build_initiated_at DATETIME NOT NULL,
    build_completed_at DATETIME NOT NULL,
    build_duration_ms INTEGER NOT NULL,
    resources_originated_count INTEGER NOT NULL,
    resources_persisted_count INTEGER NOT NULL,
    resources_memoized_count INTEGER, -- NULL if not memoizing, non-zero if memoized
    FOREIGN KEY(publ_host_id) REFERENCES publ_host(publ_host_id)
);

CREATE TABLE IF NOT EXISTS publ_server_service (
    publ_server_service_id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    service_started_at DATETIME,
    listen_host TEXT NOT NULL,
    listen_port INTEGER NOT NULL,
    publish_url TEXT NOT NULL,
    publ_build_event_id INTEGER NOT NULL,
    FOREIGN KEY(publ_build_event_id) REFERENCES publ_build_event(publ_build_event_id)
);

-- TODO: add indexes to improve query performance
CREATE TABLE IF NOT EXISTS publ_server_static_access_log (
    publ_server_static_access_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status INTEGER NOT NULL,
    asset_nature TEXT NOT NULL,
    location_href TEXT NOT NULL,
    filesys_target_path TEXT NOT NULL,
    filesys_target_symlink TEXT,
    publ_server_service_id INTEGER NOT NULL,
    FOREIGN KEY(publ_server_service_id) REFERENCES publ_server_service(publ_server_service_id)
);

CREATE TABLE IF NOT EXISTS publ_server_error_log (
    publ_server_error_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    location_href TEXT NOT NULL,
    error_summary TEXT NOT NULL,
    error_elaboration JSON,
    publ_server_service_id INTEGER NOT NULL,
    FOREIGN KEY(publ_server_service_id) REFERENCES publ_server_service(publ_server_service_id)
);
