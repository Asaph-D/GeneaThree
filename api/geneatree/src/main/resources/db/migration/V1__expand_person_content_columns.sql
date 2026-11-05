DO $$
BEGIN
    IF to_regclass('public.person') IS NOT NULL THEN
        ALTER TABLE person ALTER COLUMN photo_url TYPE text USING photo_url::text;
        ALTER TABLE person ALTER COLUMN biography TYPE text USING biography::text;
        ALTER TABLE person ALTER COLUMN notes TYPE text USING notes::text;
    END IF;
END $$;
