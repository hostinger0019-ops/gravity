-- Smart E-commerce Scraper: Products Table

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  chatbot_id uuid not null references public.chatbots(id) on delete cascade,
  
  -- Core product data
  name text not null,
  description text,
  price decimal(10,2),
  original_price decimal(10,2),
  currency text default 'USD',
  category text,
  brand text,
  sku text,
  
  -- Media
  image_url text,
  image_urls text[] default '{}',
  
  -- Availability
  stock_status text default 'in_stock',
  
  -- Variants
  variants jsonb default '[]',
  
  -- Ratings
  rating decimal(2,1),
  review_count integer default 0,
  
  -- Metadata
  url text not null,
  source_platform text,
  raw_json jsonb,
  scraped_at timestamptz default now(),
  
  -- For semantic search (optional - remove if vector extension not enabled)
  -- embedding vector(1536),
  search_text text,
  
  unique(chatbot_id, url)
);

-- Indexes for efficient queries
create index if not exists products_chatbot_id_idx on public.products (chatbot_id);
create index if not exists products_price_idx on public.products (chatbot_id, price);
create index if not exists products_category_idx on public.products (chatbot_id, category);
create index if not exists products_stock_idx on public.products (chatbot_id, stock_status);

-- RLS policies
alter table public.products enable row level security;

drop policy if exists "dev anon products select" on public.products;
drop policy if exists "dev anon products insert" on public.products;
drop policy if exists "dev anon products update" on public.products;
drop policy if exists "dev anon products delete" on public.products;

create policy "dev anon products select" on public.products for select to anon using (true);
create policy "dev anon products insert" on public.products for insert to anon with check (true);
create policy "dev anon products update" on public.products for update to anon using (true) with check (true);
create policy "dev anon products delete" on public.products for delete to anon using (true);
