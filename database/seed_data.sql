-- GravitySeries - Seed Data (Testdata)
-- Kör detta EFTER schema.sql för att få testdata

-- ============================================
-- VENUES
-- ============================================
INSERT INTO venues (id, name, city, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Järvsö Bergscykelpark', 'Järvsö', 'En av Sveriges största bike parks'),
('550e8400-e29b-41d4-a716-446655440002', 'Åre Bike Park', 'Åre', 'Alpint cykelområde i världsklass'),
('550e8400-e29b-41d4-a716-446655440003', 'Gesunda', 'Mora', 'Klassiskt spår med utmanande terräng');

-- ============================================
-- CYCLISTS
-- ============================================
INSERT INTO cyclists (id, uci_id, first_name, last_name, club, birth_date, gender) VALUES
('650e8400-e29b-41d4-a716-446655440001', '10138828101', 'Edvin', 'Ernfors', 'Järfälla Cykel Klubb', '2009-04-01', 'Men'),
('650e8400-e29b-41d4-a716-446655440002', '10138828102', 'Anna', 'Andersson', 'Stockholm CK', '1995-06-15', 'Women'),
('650e8400-e29b-41d4-a716-446655440003', '10138828103', 'Erik', 'Eriksson', 'Göteborg MTB', '1998-03-22', 'Men'),
('650e8400-e29b-41d4-a716-446655440004', '10138828104', 'Sara', 'Svensson', 'Malmö Cykel', '2000-11-08', 'Women'),
('650e8400-e29b-41d4-a716-446655440005', NULL, 'Johan', 'Johansson', 'Uppsala CK', '1992-07-30', 'Men');

-- ============================================
-- COMPETITIONS
-- ============================================
INSERT INTO competitions (id, name, date, competition_format, venue_id, status, published) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'Järvsö DH #1', '2024-05-15', 'DH', '550e8400-e29b-41d4-a716-446655440001', 'completed', TRUE),
('750e8400-e29b-41d4-a716-446655440002', 'Åre Enduro Classic', '2024-06-10', 'ENDURO', '550e8400-e29b-41d4-a716-446655440002', 'completed', TRUE),
('750e8400-e29b-41d4-a716-446655440003', 'Gesunda DH Finals', '2024-09-01', 'DH', '550e8400-e29b-41d4-a716-446655440003', 'upcoming', FALSE);

-- ============================================
-- SERIES
-- ============================================
INSERT INTO series (id, name, year, type, point_system, count_best_results, published) VALUES
(
    '850e8400-e29b-41d4-a716-446655440001',
    'Swedish DH Cup 2024',
    2024,
    'individual',
    '[420,370,365,345,330,315,300,285,270,260,242,224,206,188,180,171,162,153,144,135,131,127,123,119,115,110,105,100,95,90,85,80,75,70,65,60,55,50,45,40,35,30,25,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1]',
    4,
    TRUE
),
(
    '850e8400-e29b-41d4-a716-446655440002',
    'Enduro Series 2024',
    2024,
    'individual',
    '[500,450,425,400,380,360,340,320,300,280,260,240,220,200,190,180,170,160,150,140,135,130,125,120,115,110,105,100,95,90,85,80,75,70,65,60,55,50,45,40,35,30,25,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1]',
    NULL,
    TRUE
),
(
    '850e8400-e29b-41d4-a716-446655440003',
    'Club Championship 2024',
    2024,
    'club',
    '[420,370,365,345,330,315,300,285,270,260,242,224,206,188,180,171,162,153,144,135,131,127,123,119,115,110,105,100,95,90,85,80,75,70,65,60,55,50,45,40,35,30,25,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1]',
    4,
    TRUE
);

-- ============================================
-- SERIES_COMPETITIONS (Koppla tävlingar till serier)
-- ============================================
INSERT INTO series_competitions (series_id, competition_id, point_multiplier) VALUES
-- Swedish DH Cup
('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 1.0),
('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440003', 1.5), -- Finals med bonus

-- Enduro Series
('850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', 1.0),

-- Club Championship (båda DH-tävlingarna)
('850e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001', 1.0),
('850e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440003', 1.0);

-- ============================================
-- RESULTS - Järvsö DH #1
-- ============================================
-- Elite Men
INSERT INTO results (competition_id, cyclist_id, class_id, position, total_time, status) VALUES
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', (SELECT id FROM competition_classes WHERE name = 'Elite Men'), 1, '00:02:34.567', 'FIN'),
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440005', (SELECT id FROM competition_classes WHERE name = 'Elite Men'), 2, '00:02:36.123', 'FIN');

-- Elite Women
INSERT INTO results (competition_id, cyclist_id, class_id, position, total_time, status) VALUES
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', (SELECT id FROM competition_classes WHERE name = 'Elite Women'), 1, '00:02:45.890', 'FIN'),
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440004', (SELECT id FROM competition_classes WHERE name = 'Elite Women'), 2, '00:02:48.234', 'FIN');

-- Youth Men
INSERT INTO results (competition_id, cyclist_id, class_id, position, total_time, status) VALUES
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', (SELECT id FROM competition_classes WHERE name = 'Youth Men'), 1, '00:02:52.456', 'FIN');

-- ============================================
-- RESULTS - Åre Enduro Classic
-- ============================================
INSERT INTO results (competition_id, cyclist_id, class_id, position, total_time, stage_times, status) VALUES
(
    '750e8400-e29b-41d4-a716-446655440002',
    '650e8400-e29b-41d4-a716-446655440003',
    (SELECT id FROM competition_classes WHERE name = 'Elite Men'),
    1,
    '00:12:34.567',
    '[{"stage": 1, "time": "00:04:12.345"}, {"stage": 2, "time": "00:03:45.678"}, {"stage": 3, "time": "00:04:36.544"}]',
    'FIN'
),
(
    '750e8400-e29b-41d4-a716-446655440002',
    '650e8400-e29b-41d4-a716-446655440002',
    (SELECT id FROM competition_classes WHERE name = 'Elite Women'),
    1,
    '00:13:45.890',
    '[{"stage": 1, "time": "00:04:45.890"}, {"stage": 2, "time": "00:04:12.000"}, {"stage": 3, "time": "00:04:48.000"}]',
    'FIN'
);

-- ============================================
-- SERIES_RESULTS (Beräknade poäng)
-- ============================================
-- Swedish DH Cup - Järvsö DH #1
INSERT INTO series_results (series_id, result_id, cyclist_id, points, adjusted_points, club_name, counts_for_club) VALUES
(
    '850e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM results WHERE competition_id = '750e8400-e29b-41d4-a716-446655440001' AND cyclist_id = '650e8400-e29b-41d4-a716-446655440003'),
    '650e8400-e29b-41d4-a716-446655440003',
    420,
    420.0,
    'Göteborg MTB',
    TRUE
),
(
    '850e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM results WHERE competition_id = '750e8400-e29b-41d4-a716-446655440001' AND cyclist_id = '650e8400-e29b-41d4-a716-446655440005'),
    '650e8400-e29b-41d4-a716-446655440005',
    370,
    370.0,
    'Uppsala CK',
    TRUE
),
(
    '850e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM results WHERE competition_id = '750e8400-e29b-41d4-a716-446655440001' AND cyclist_id = '650e8400-e29b-41d4-a716-446655440002'),
    '650e8400-e29b-41d4-a716-446655440002',
    420,
    420.0,
    'Stockholm CK',
    TRUE
);

-- Enduro Series - Åre Enduro Classic
INSERT INTO series_results (series_id, result_id, cyclist_id, points, adjusted_points, club_name, counts_for_club) VALUES
(
    '850e8400-e29b-41d4-a716-446655440002',
    (SELECT id FROM results WHERE competition_id = '750e8400-e29b-41d4-a716-446655440002' AND cyclist_id = '650e8400-e29b-41d4-a716-446655440003'),
    '650e8400-e29b-41d4-a716-446655440003',
    500,
    500.0,
    'Göteborg MTB',
    FALSE
),
(
    '850e8400-e29b-41d4-a716-446655440002',
    (SELECT id FROM results WHERE competition_id = '750e8400-e29b-41d4-a716-446655440002' AND cyclist_id = '650e8400-e29b-41d4-a716-446655440002'),
    '650e8400-e29b-41d4-a716-446655440002',
    500,
    500.0,
    'Stockholm CK',
    FALSE
);

-- Club Championship - samma som Swedish DH Cup för Järvsö
INSERT INTO series_results (series_id, result_id, cyclist_id, points, adjusted_points, club_name, counts_for_club) VALUES
(
    '850e8400-e29b-41d4-a716-446655440003',
    (SELECT id FROM results WHERE competition_id = '750e8400-e29b-41d4-a716-446655440001' AND cyclist_id = '650e8400-e29b-41d4-a716-446655440003'),
    '650e8400-e29b-41d4-a716-446655440003',
    420,
    420.0,
    'Göteborg MTB',
    TRUE
),
(
    '850e8400-e29b-41d4-a716-446655440003',
    (SELECT id FROM results WHERE competition_id = '750e8400-e29b-41d4-a716-446655440001' AND cyclist_id = '650e8400-e29b-41d4-a716-446655440005'),
    '650e8400-e29b-41d4-a716-446655440005',
    370,
    370.0,
    'Uppsala CK',
    TRUE
),
(
    '850e8400-e29b-41d4-a716-446655440003',
    (SELECT id FROM results WHERE competition_id = '750e8400-e29b-41d4-a716-446655440001' AND cyclist_id = '650e8400-e29b-41d4-a716-446655440002'),
    '650e8400-e29b-41d4-a716-446655440002',
    420,
    420.0,
    'Stockholm CK',
    TRUE
);

-- ============================================
-- Verifiera data
-- ============================================
SELECT 'Venues created:' as info, COUNT(*) as count FROM venues;
SELECT 'Cyclists created:' as info, COUNT(*) as count FROM cyclists;
SELECT 'Competitions created:' as info, COUNT(*) as count FROM competitions;
SELECT 'Series created:' as info, COUNT(*) as count FROM series;
SELECT 'Results created:' as info, COUNT(*) as count FROM results;
SELECT 'Series results created:' as info, COUNT(*) as count FROM series_results;

-- Visa serieställning
SELECT
    s.name as series_name,
    c.first_name,
    c.last_name,
    c.club,
    SUM(sr.adjusted_points) as total_points
FROM series_results sr
JOIN series s ON sr.series_id = s.id
JOIN cyclists c ON sr.cyclist_id = c.id
WHERE s.type = 'individual'
GROUP BY s.name, c.first_name, c.last_name, c.club
ORDER BY s.name, total_points DESC;

-- Visa klubbställning
SELECT
    s.name as series_name,
    sr.club_name,
    SUM(sr.adjusted_points) as total_points
FROM series_results sr
JOIN series s ON sr.series_id = s.id
WHERE s.type = 'club' AND sr.counts_for_club = TRUE
GROUP BY s.name, sr.club_name
ORDER BY s.name, total_points DESC;
