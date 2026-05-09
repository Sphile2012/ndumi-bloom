-- Import existing bookings
-- Run this in Supabase SQL Editor

INSERT INTO bookings (id, client_name, client_phone, preferred_date, preferred_time, status, service_category, service_detail, created_date, updated_date)
VALUES
  ('bk_import_001', 'Athandwa Mbatha',    '0662721555', '2026-05-14', '14:00', 'pending',   'General', 'Appointment', now(), now()),
  ('bk_import_002', 'Thabile Ntombela',   '0787435126', '2026-05-08', '14:00', 'confirmed', 'General', 'Appointment', now(), now()),
  ('bk_import_003', 'Asanda Thwala',      '0683295198', '2026-05-23', '12:00', 'pending',   'General', 'Appointment', now(), now()),
  ('bk_import_004', 'Nomusa Ncube',       '0838921604', '2026-05-16', '08:00', 'confirmed', 'General', 'Appointment', now(), now()),
  ('bk_import_005', 'Nozizwe Mthembu',   '0796227055', '2026-05-09', '08:00', 'pending',   'General', 'Appointment', now(), now()),
  ('bk_import_006', 'Ntombi',            '0658519562', '2026-05-08', '10:00', 'confirmed', 'General', 'Appointment', now(), now()),
  ('bk_import_007', 'Zinhle Mabaso',     '0810681071', '2026-05-08', '12:00', 'confirmed', 'General', 'Appointment', now(), now()),
  ('bk_import_008', 'Nozizwe Mthembu',   '0796227055', '2026-05-10', '10:00', 'pending',   'General', 'Appointment', now(), now()),
  ('bk_import_009', 'Thuli Zungu',       '0729969839', '2026-05-09', '14:00', 'pending',   'General', 'Appointment', now(), now()),
  ('bk_import_010', 'Akhona',            '0719357187', '2026-05-06', '12:00', 'confirmed', 'General', 'Appointment', now(), now()),
  ('bk_import_011', 'Thandeka Mtshali',  '0785913809', '2026-05-06', '16:00', 'confirmed', 'General', 'Appointment', now(), now()),
  ('bk_import_012', 'Siphokazi Mayisela','0786436762', '2026-05-07', '14:00', 'confirmed', 'General', 'Appointment', now(), now()),
  ('bk_import_013', 'Njabulo Khumalo',   '0720205103', '2026-05-13', '14:00', 'confirmed', 'General', 'Appointment', now(), now()),
  ('bk_import_014', 'Masedi Nkoe',       '0797491439', '2026-05-06', '10:00', 'confirmed', 'General', 'Appointment', now(), now()),
  ('bk_import_015', 'Nothile Dlamini',   '0694824961', '2026-05-13', '08:00', 'pending',   'General', 'Appointment', now(), now())
ON CONFLICT (id) DO NOTHING;
