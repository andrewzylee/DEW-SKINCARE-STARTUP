-- Dew — catalog seed (the mobile app's sample slice; ids match mobile/src/core so Demo Mode and
-- real mode show the same products). Run in the Supabase SQL editor after the migrations.
-- The full ~1,164-product catalog import is a follow-up (generated from the web app's data).
insert into public.products (id, brand, name, category, domain, style_tags) values
  ('cerave-foaming-cleanser', 'CeraVe', 'Foaming Facial Cleanser', 'cleanser', 'skincare', '{}'),
  ('cerave-hydrating-cleanser', 'CeraVe', 'Hydrating Facial Cleanser', 'cleanser', 'skincare', '{}'),
  ('vanicream-cleanser', 'Vanicream', 'Gentle Facial Cleanser', 'cleanser', 'skincare', '{}'),
  ('differin-adapalene', 'Differin', 'Adapalene Gel 0.1%', 'treatment', 'skincare', '{}'),
  ('paulas-choice-bha', 'Paula''s Choice', '2% BHA Liquid Exfoliant', 'treatment', 'skincare', '{}'),
  ('ordinary-niacinamide', 'The Ordinary', 'Niacinamide 10% + Zinc 1%', 'serum', 'skincare', '{}'),
  ('lrp-vitamin-c', 'La Roche-Posay', 'Pure Vitamin C Serum', 'serum', 'skincare', '{}'),
  ('krave-barrier', 'Krave Beauty', 'Great Barrier Relief', 'serum', 'skincare', '{}'),
  ('boj-relief-sun', 'Beauty of Joseon', 'Relief Sun SPF50+', 'spf', 'skincare', '{}'),
  ('lrp-anthelios-clear', 'La Roche-Posay', 'Anthelios Clear Skin SPF60', 'spf', 'skincare', '{}'),
  ('cerave-daily-lotion', 'CeraVe', 'Daily Moisturizing Lotion', 'moisturizer', 'skincare', '{}'),
  ('lrp-toleriane-moist', 'La Roche-Posay', 'Toleriane Double Repair', 'moisturizer', 'skincare', '{}'),
  ('rare-beauty-blush', 'Rare Beauty', 'Soft Pinch Liquid Blush', 'blush', 'makeup', '{natural,buildable,bold,viral}'),
  ('saie-dew-blush', 'Saie', 'Dew Blush', 'blush', 'makeup', '{clean,dewy,natural}'),
  ('rhode-pocket-blush', 'Rhode', 'Pocket Blush', 'blush', 'makeup', '{clean,dewy,glowy}'),
  ('glossier-skin-tint', 'Glossier', 'Perfecting Skin Tint', 'foundation', 'makeup', '{clean,dewy,minimal,skinlike}'),
  ('kosas-revealer', 'Kosas', 'Revealer Concealer', 'concealer', 'makeup', '{clean,skinlike,natural}'),
  ('ilia-limitless-lash', 'ILIA', 'Limitless Lash Mascara', 'mascara', 'makeup', '{clean,natural}'),
  ('maybelline-sky-high', 'Maybelline', 'Sky High Mascara', 'mascara', 'makeup', '{budget,viral}'),
  ('nyx-butter-gloss', 'NYX', 'Butter Gloss', 'lip', 'makeup', '{budget,glowy,natural}'),
  ('rhode-peptide-lip', 'Rhode', 'Peptide Lip Treatment', 'lip', 'makeup', '{clean,dewy,glowy,minimal}'),
  ('summer-fridays-lip', 'Summer Fridays', 'Lip Butter Balm', 'lip', 'makeup', '{clean,glowy,natural}'),
  ('ctilbury-pillowtalk', 'Charlotte Tilbury', 'Matte Revolution Pillow Talk', 'lip', 'makeup', '{glam,matte,bold}'),
  ('chanel-bleu', 'Chanel', 'Bleu de Chanel EDP', 'fragrance', 'fragrance', '{luxe,bold}'),
  ('lelabo-santal33', 'Le Labo', 'Santal 33 EDP', 'fragrance', 'fragrance', '{clean,luxe}'),
  ('tomford-tobacco-vanille', 'Tom Ford', 'Tobacco Vanille EDP', 'fragrance', 'fragrance', '{luxe,bold,glam}'),
  ('glossier-you', 'Glossier', 'You EDP', 'fragrance', 'fragrance', '{clean,skinlike,minimal}')
on conflict (id) do nothing;
