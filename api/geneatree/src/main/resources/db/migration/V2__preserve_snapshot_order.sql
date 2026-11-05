DO $$
BEGIN
    IF to_regclass('public.person') IS NOT NULL THEN
        ALTER TABLE person ADD COLUMN IF NOT EXISTS snapshot_order integer;
    END IF;
    IF to_regclass('public.marriage') IS NOT NULL THEN
        ALTER TABLE marriage ADD COLUMN IF NOT EXISTS snapshot_order integer;
    END IF;
END $$;
