DO $$
BEGIN
    IF to_regclass('public.marriage') IS NOT NULL THEN
        ALTER TABLE marriage ADD COLUMN IF NOT EXISTS rank integer;
    END IF;
    IF to_regclass('public.marriage_children_ids') IS NOT NULL THEN
        ALTER TABLE marriage_children_ids ADD COLUMN IF NOT EXISTS child_order integer;
        -- Older snapshots have no saved child order. Keep all their links readable;
        -- sharing again writes the exact order from the source tree.
        WITH ordered AS (
            SELECT links.marriage_id, links.children_ids,
                   row_number() OVER (
                       PARTITION BY links.marriage_id
                       ORDER BY person.snapshot_order NULLS LAST, links.children_ids
                   ) - 1 AS position
            FROM marriage_children_ids links
            JOIN person ON person.id = links.children_ids
        )
        UPDATE marriage_children_ids links SET child_order = ordered.position
        FROM ordered
        WHERE links.marriage_id = ordered.marriage_id
          AND links.children_ids = ordered.children_ids
          AND links.child_order IS NULL;
    END IF;
END $$;
