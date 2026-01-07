/*
  # Remove unused index from subscriptions table

  1. Changes
    - Drop the unused `idx_subscriptions_user_id` index on the subscriptions table
    - This index was created but is not being utilized by queries
    - Removing unused indexes improves write performance and reduces storage overhead

  2. Security
    - No RLS policy changes
    - No impact on data access patterns
*/

DROP INDEX IF EXISTS idx_subscriptions_user_id;
