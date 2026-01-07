/*
  # Add Visual Effects Setting

  1. Changes to user_settings table
    - Add `enable_visual_effects` column (boolean, default true)
    - Controls whether visual animations (6/4/wicket effects) are shown

  2. Security
    - No RLS changes needed (existing policies cover this column)
*/

-- Add enable_visual_effects column to user_settings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'enable_visual_effects'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN enable_visual_effects boolean DEFAULT true;
  END IF;
END $$;
