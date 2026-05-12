-- Refresh PostgREST schema cache after DDL so new tables (e.g. asset_categories) are visible to the API immediately.
notify pgrst, 'reload schema';
