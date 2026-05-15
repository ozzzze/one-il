-- Distinct icons for Leave / Welfare (planned items) in sidebar + home cards.
update public.menu_items
set icon_key = 'calendar_fold'
where id = 'office-leave';

update public.menu_items
set icon_key = 'square_activity'
where id = 'office-welfare';
