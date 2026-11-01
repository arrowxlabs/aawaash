ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_letter_check;
UPDATE public.teams SET letter = '1', name = CASE WHEN name = 'Team A' THEN 'Team 1' ELSE name END WHERE letter = 'A';
UPDATE public.teams SET letter = '2', name = CASE WHEN name = 'Team B' THEN 'Team 2' ELSE name END WHERE letter = 'B';
UPDATE public.teams SET letter = '3', name = CASE WHEN name = 'Team C' THEN 'Team 3' ELSE name END WHERE letter = 'C';
ALTER TABLE public.teams ADD CONSTRAINT teams_letter_check CHECK (letter ~ '^([1-9][0-9]{0,4}|[A-Z]{1,3})$');