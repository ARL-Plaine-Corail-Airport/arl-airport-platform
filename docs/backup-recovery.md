# Backup and Recovery

## Database Backups

ARL Airport Platform uses Supabase PostgreSQL for application data.

- Supabase Pro includes daily automated backups with 7-day retention and Point-in-Time Recovery (PITR).
- Automated backups protect the database only. Supabase Storage buckets are not included.
- Use `DATABASE_DIRECT_URL` for manual dumps and restores. This must be the direct PostgreSQL connection on port `5432`, not the pooled runtime connection.

### Manual backup via Supabase dashboard

1. Open the Supabase project dashboard.
2. Go to the database backup or recovery section for the project.
3. Trigger a manual backup before major releases, schema changes, or risky maintenance.
4. Record the backup timestamp and operator in the operations log.

### Restore via Supabase dashboard

1. Open the Supabase project dashboard.
2. Go to the backup or recovery section.
3. Select the desired automated or manual backup.
4. Confirm the restore target and timing.
5. Validate application health and critical admin flows after restore.

### Manual `pg_dump`

Example command:

```bash
pg_dump "$DATABASE_DIRECT_URL" --format=custom --file=backup_$(date +%Y%m%d).dump
```

The repository includes [`scripts/backup-db.sh`](/c:/Users/kelvi/Desktop/AirportPWA/arl-airport-platform/scripts/backup-db.sh) to wrap this command and save dumps into `./backups/`.

### Manual restore

Example command:

```bash
pg_restore --clean --if-exists -d "$DATABASE_DIRECT_URL" backup_YYYYMMDD.dump
```

## Storage Backups

Supabase Storage is not included in Supabase PostgreSQL backups. The media bucket must be mirrored separately.

- Preferred approach: scheduled `rclone sync` against the S3-compatible endpoint.
- Alternative: `aws s3 sync` against the Supabase Storage S3 endpoint.
- Back up at least the public media bucket `arl-public-media`. Include protected document buckets if they contain operationally required files.

Example:

```bash
rclone sync supabase:arl-public-media ./backups/media/
```

## Recovery Targets

- RPO: 24 hours
- RTO: 1 hour

## Disaster Recovery Runbook

1. Declare an incident and freeze non-essential content changes.
2. Identify whether the failure affects PostgreSQL, Storage, or both.
3. Confirm the latest healthy backup timestamp and target recovery point.
4. Restore the database from Supabase backup tooling or from the latest manual `pg_dump`.
5. Mirror back Storage assets from the latest `rclone` or `aws s3 sync` snapshot if media loss is involved.
6. Verify app startup, `/api/health`, dashboard access, and public content pages.
7. Validate critical content collections, uploaded media, and flight or weather integrations.
8. Re-enable content changes once verification is complete.
9. Document root cause, recovery point used, recovery duration, and follow-up actions.
