ALTER TABLE academic_terms
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
