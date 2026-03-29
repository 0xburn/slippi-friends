alter table profiles
  add column if not exists disable_friend_requests boolean not null default false;
