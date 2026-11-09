-- PHẬT TẠI TÂM v0.4 (đã chạy, KHÔNG cần chạy lại)
alter table public.posts add column if not exists updated_at timestamptz;
alter table public.songs add column if not exists updated_at timestamptz;
update public.posts set updated_at = created_at where updated_at is null;
update public.songs set updated_at = created_at where updated_at is null;
alter table public.posts alter column updated_at set default now(), alter column updated_at set not null;
alter table public.songs alter column updated_at set default now(), alter column updated_at set not null;

create or replace function public.touch_post_updated_at()
returns trigger language plpgsql as $$
begin
  if (new.title, new.category, new.excerpt, new.content, new.file_path)
     is distinct from (old.title, old.category, old.excerpt, old.content, old.file_path) then
    new.updated_at := now();
  else
    new.updated_at := old.updated_at;
  end if;
  return new;
end; $$;

create or replace function public.touch_song_updated_at()
returns trigger language plpgsql as $$
begin
  if (new.title, new.artist, new.album, new.audio_path, new.cover_path)
     is distinct from (old.title, old.artist, old.album, old.audio_path, old.cover_path) then
    new.updated_at := now();
  else
    new.updated_at := old.updated_at;
  end if;
  return new;
end; $$;

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at before update on public.posts
  for each row execute procedure public.touch_post_updated_at();
drop trigger if exists songs_touch_updated_at on public.songs;
create trigger songs_touch_updated_at before update on public.songs
  for each row execute procedure public.touch_song_updated_at();
