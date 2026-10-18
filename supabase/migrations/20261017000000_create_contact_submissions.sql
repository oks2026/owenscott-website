create table public.contact_submissions (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(btrim(name)) between 1 and 100),
    email text not null check (char_length(btrim(email)) between 3 and 254),
    message text not null check (char_length(btrim(message)) between 1 and 5000),
    created_at timestamptz not null default now()
);

alter table public.contact_submissions enable row level security;

revoke all on table public.contact_submissions from public, anon, authenticated;
grant insert (name, email, message) on table public.contact_submissions to anon;

create policy "Allow anonymous contact submissions"
on public.contact_submissions
for insert
to anon
with check (
    char_length(btrim(name)) between 1 and 100
    and char_length(btrim(email)) between 3 and 254
    and char_length(btrim(message)) between 1 and 5000
);
