-- Script to fix broken artwork image URLs
-- This updates existing signed URLs to use the public URL format

-- Create a function to extract the file path from a signed URL
CREATE OR REPLACE FUNCTION extract_filepath_from_url(url TEXT)
RETURNS TEXT AS $$
DECLARE
  path_match TEXT;
BEGIN
  -- Extract path after 'artifacts/' and before '?'
  -- Example: https://xxx.supabase.co/storage/v1/object/sign/artifacts/private/1234-image.jpg?token=xxx
  -- Should return: private/1234-image.jpg
  
  -- First try to match signed URL pattern
  path_match := regexp_replace(url, '.*\/artifacts\/(.*?)\?.*', '\1');
  
  -- If no query string, try without it
  IF path_match = url THEN
    path_match := regexp_replace(url, '.*\/artifacts\/(.*?)$', '\1');
  END IF;
  
  -- If still no match, return NULL
  IF path_match = url THEN
    RETURN NULL;
  END IF;
  
  RETURN path_match;
END;
$$ LANGUAGE plpgsql;

-- Update existing artwork assets to use public URLs
DO $$
DECLARE
  artwork_record RECORD;
  asset_item JSONB;
  updated_assets JSONB[];
  file_path TEXT;
  public_url TEXT;
  bucket_url TEXT;
BEGIN
  -- Get the base storage URL from the first signed URL we find
  SELECT substring(url FROM '(https://[^/]+/storage/v1/)') INTO bucket_url
  FROM artworks 
  CROSS JOIN LATERAL jsonb_array_elements(assets) AS asset_item(url)
  WHERE assets IS NOT NULL 
  AND jsonb_typeof(assets) = 'array'
  AND asset_item->>'url' LIKE '%/storage/v1/%'
  LIMIT 1;
  
  IF bucket_url IS NULL THEN
    RAISE NOTICE 'Could not determine storage URL pattern';
    RETURN;
  END IF;
  
  -- Process each artwork with assets
  FOR artwork_record IN 
    SELECT id, assets 
    FROM artworks 
    WHERE assets IS NOT NULL 
    AND jsonb_typeof(assets) = 'array'
  LOOP
    updated_assets := ARRAY[]::JSONB[];
    
    -- Process each asset in the artwork
    FOR asset_item IN SELECT * FROM jsonb_array_elements(artwork_record.assets)
    LOOP
      -- Extract file path from the URL
      file_path := extract_filepath_from_url(asset_item->>'url');
      
      IF file_path IS NOT NULL THEN
        -- Replace 'private/' prefix with 'artworks/' for new structure
        IF file_path LIKE 'private/%' THEN
          file_path := regexp_replace(file_path, '^private/', 'artworks/');
        END IF;
        
        -- Build public URL
        public_url := bucket_url || 'object/public/artifacts/' || file_path;
        
        -- Update the asset with new URL
        asset_item := jsonb_set(asset_item, '{url}', to_jsonb(public_url));
      END IF;
      
      updated_assets := array_append(updated_assets, asset_item);
    END LOOP;
    
    -- Update the artwork with fixed URLs
    UPDATE artworks 
    SET assets = array_to_json(updated_assets)::jsonb
    WHERE id = artwork_record.id;
    
    RAISE NOTICE 'Updated artwork %', artwork_record.id;
  END LOOP;
END $$;

-- Clean up the temporary function
DROP FUNCTION IF EXISTS extract_filepath_from_url(TEXT);

-- Notify completion
DO $$
BEGIN
  RAISE NOTICE 'Artwork image URLs have been updated to use public URLs';
END $$;