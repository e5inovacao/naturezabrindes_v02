create table if not exists email_outbox (
  id bigserial primary key,
  recipient text not null,
  subject text not null,
  template text not null,
  payload jsonb not null,
  status text not null default 'queued',
  provider_response jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_email_outbox_created_at on email_outbox (created_at);