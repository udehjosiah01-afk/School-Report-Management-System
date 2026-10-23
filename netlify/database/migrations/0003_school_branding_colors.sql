ALTER TABLE schools
  ADD COLUMN main_color text NOT NULL DEFAULT '#142b4f',
  ADD COLUMN accent_color text NOT NULL DEFAULT '#b68d32',
  ADD CONSTRAINT schools_main_color_check CHECK (main_color ~ '^#[0-9A-Fa-f]{6}$'),
  ADD CONSTRAINT schools_accent_color_check CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$');
