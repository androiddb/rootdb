-- 0004_variant_search.sql — variants are first-class IN SEARCH.
-- A Verizon S23 owner searches "SM-S911U" and must land on the Verizon variant
-- row (locked bootloader, not rootable), not the international S23's happy path.
--
-- What changes:
--  1) devices_fill_search() now folds in device_variants labels + model_numbers,
--     so search_text (the trigram-indexed column every search hits) covers them.
--  2) A new AFTER trigger on device_variants re-triggers the devices search
--     recompute whenever a variant is added/renamed/removed — keeps the parent's
--     search_text honest without duplicating the formula.
--  3) Backfill every device that has variants so existing rows pick it up.

create or replace function public.devices_fill_search() returns trigger
language plpgsql as $$
begin
  new.search_text := new.brand || ' ' || new.name || ' ' || coalesce(new.model,'')
    || ' ' || coalesce(new.codename,'') || ' ' || coalesce(array_to_string(new.aliases,' '),'')
    || ' ' || coalesce((
      select string_agg(v.label || ' ' || coalesce(array_to_string(v.model_numbers,' '),''), ' ')
      from public.device_variants v where v.device_id = new.id
    ), '');
  return new;
end $$;

-- variant edits nudge the parent row (brand = brand is a no-op write that fires
-- trg_devices_search, which recomputes with the CURRENT variant set — single
-- source of truth for the formula).
create or replace function public.variants_touch_device_search() returns trigger
language plpgsql as $$
begin
  update public.devices set brand = brand
  where id = coalesce(new.device_id, old.device_id);
  return coalesce(new, old);
end $$;

create trigger trg_variants_search after insert or update or delete on public.device_variants
  for each row execute function public.variants_touch_device_search();

-- backfill
update public.devices set brand = brand;
