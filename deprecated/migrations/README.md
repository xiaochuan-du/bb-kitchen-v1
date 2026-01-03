# Database Migrations

This folder contains numbered database migration files for TableMate.

## Migration Naming Convention

Migrations are numbered sequentially with a two-digit prefix:
- `01_initial_schema.sql` - Initial database setup
- `02_add_recipe_to_dishes.sql` - Add recipe field
- `03_your_migration_name.sql` - Next migration

## Running Migrations

### Option 1: Manual (Supabase SQL Editor)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in numerical order
4. Verify success before proceeding to next migration

### Option 2: Supabase CLI

```bash
# Initialize Supabase locally (first time only)
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Generate a new migration
supabase migration new your_migration_name

# Push migrations to remote
supabase db push

# Or apply migrations locally
supabase db reset
```

## Creating New Migrations

When adding new migrations:

1. **Use sequential numbering**: Next available number (e.g., `03_`)
2. **Descriptive names**: Use snake_case (e.g., `add_notes_to_events`)
3. **Idempotent when possible**: Use `IF NOT EXISTS`, `IF EXISTS` for safety
4. **One concern per migration**: Don't mix unrelated changes
5. **Include rollback notes**: Add comments on how to reverse if needed

### Example Migration Template

```sql
-- Migration XX: [Description]
-- Date: YYYY-MM-DD
-- Description: What this migration does and why
--
-- Rollback: How to undo this migration if needed

-- Your SQL here
ALTER TABLE table_name ADD COLUMN new_column TEXT;

-- Add indexes if needed
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column_name);

-- Update RLS policies if needed
CREATE POLICY "policy_name" ON table_name
  FOR SELECT USING (condition);
```

## Migration History

- **01_initial_schema.sql** - Base database schema with all tables, RLS policies, triggers, and storage bucket
- **02_add_recipe_to_dishes.sql** - Added optional `recipe` field to dishes table for host-only cooking notes

## Best Practices

1. **Always test locally first** if using Supabase CLI
2. **Backup before production migrations**
3. **Run during low-traffic periods** for production
4. **Never edit existing migrations** - create new ones instead
5. **Document breaking changes** in migration comments
6. **Keep migrations small** - easier to debug and rollback

## Notes

- All tables use Row Level Security (RLS)
- UUID primary keys generated with `uuid_generate_v4()`
- Timestamps use `timezone('utc'::text, now())`
- Array columns use PostgreSQL array type `TEXT[]`
