ALTER TABLE schools
  ALTER COLUMN main_color SET DEFAULT '#c62828',
  ALTER COLUMN accent_color SET DEFAULT '#38bdf8';

UPDATE schools
SET main_color = '#c62828',
    accent_color = '#38bdf8'
WHERE main_color = '#142b4f'
  AND accent_color = '#b68d32';
