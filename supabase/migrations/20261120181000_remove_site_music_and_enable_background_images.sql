-- Re-purpose the existing site-media bucket for administrator-managed site backgrounds.
-- Music settings are no longer used by the storefront.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']::text[],
    file_size_limit = 5242880
WHERE id = 'site-media';

DELETE FROM public.site_settings
WHERE key IN ('music_url','music_title','music_volume','music_autoplay');