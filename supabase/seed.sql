INSERT INTO slippi_cache (connect_code, display_name, slippi_uid, rating_ordinal, wins, losses, characters, fetched_at)
VALUES
  ('MANG#0', 'Mang0', 'test-uid-mango', 2350.50, 450, 200, '[{"character": 2, "gameCount": 500}, {"character": 20, "gameCount": 150}]', NOW()),
  ('ZAIN#0', 'Zain', 'test-uid-zain', 2400.75, 500, 180, '[{"character": 9, "gameCount": 680}]', NOW()),
  ('HUNG#0', 'Hungrybox', 'test-uid-hbox', 2280.30, 420, 210, '[{"character": 15, "gameCount": 630}]', NOW()),
  ('CODY#0', 'Cody', 'test-uid-cody', 2320.10, 380, 190, '[{"character": 2, "gameCount": 570}]', NOW()),
  ('PLUP#0', 'Plup', 'test-uid-plup', 2250.60, 350, 200, '[{"character": 19, "gameCount": 400}, {"character": 2, "gameCount": 150}]', NOW())
ON CONFLICT (connect_code) DO NOTHING;
