-- Удаление неправильных совпадений ключевых слов
-- Удаляет только те совпадения, где нормализованный текст комментария/поста
-- не содержит нормализованное ключевое слово

-- Функция нормализации (аналог normalizeForKeywordMatch)
CREATE OR REPLACE FUNCTION normalize_text_for_match(text_value TEXT)
RETURNS TEXT AS $$
BEGIN
  IF text_value IS NULL OR text_value = '' THEN
    RETURN '';
  END IF;
  
  RETURN LOWER(
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(text_value, E'\u00a0', ' ', 'g'),
              E'[\u2000-\u200f\u2028\u2029\u202f\u205f\u3000]', ' ', 'g'
            ),
            E'\u00ad', '', 'g'
          ),
          '[ёЁ]', 'е', 'g'
        ),
        '\s+', ' ', 'g'
      )
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Диагностика: показываем пустые комментарии
SELECT 
  ckm."commentId",
  ckm."keywordId",
  ckm.source,
  'EMPTY COMMENT' as issue,
  k.word as keyword
FROM "CommentKeywordMatch" ckm
JOIN "Comment" c ON c.id = ckm."commentId"
JOIN "Keyword" k ON k.id = ckm."keywordId"
WHERE ckm.source = 'COMMENT'
  AND (c.text IS NULL OR TRIM(c.text) = '')
LIMIT 10;

-- Диагностика: показываем примеры неправильных совпадений перед удалением
SELECT 
  ckm."commentId",
  ckm."keywordId",
  ckm.source,
  LEFT(c.text, 50) as comment_text_preview,
  k.word as keyword,
  normalize_text_for_match(c.text) as normalized_comment,
  normalize_text_for_match(k.word) as normalized_keyword,
  CASE 
    WHEN normalize_text_for_match(c.text) LIKE '%' || normalize_text_for_match(k.word) || '%' 
    THEN 'MATCH' 
    ELSE 'NO MATCH' 
  END as match_status
FROM "CommentKeywordMatch" ckm
JOIN "Comment" c ON c.id = ckm."commentId"
JOIN "Keyword" k ON k.id = ckm."keywordId"
WHERE ckm.source = 'COMMENT'
  AND c.text IS NOT NULL
  AND TRIM(c.text) != ''
  AND normalize_text_for_match(c.text) NOT LIKE '%' || normalize_text_for_match(k.word) || '%'
LIMIT 10;

-- Удаление совпадений для пустых комментариев
DELETE FROM "CommentKeywordMatch" ckm
WHERE ckm.source = 'COMMENT'
  AND EXISTS (
    SELECT 1
    FROM "Comment" c
    WHERE c.id = ckm."commentId"
      AND (c.text IS NULL OR TRIM(c.text) = '')
  );

-- Удаление неправильных совпадений для source = 'COMMENT'
DELETE FROM "CommentKeywordMatch" ckm
WHERE ckm.source = 'COMMENT'
  AND NOT EXISTS (
    SELECT 1
    FROM "Comment" c
    JOIN "Keyword" k ON k.id = ckm."keywordId"
    WHERE c.id = ckm."commentId"
      AND c.text IS NOT NULL
      AND TRIM(c.text) != ''
      AND normalize_text_for_match(c.text) LIKE '%' || normalize_text_for_match(k.word) || '%'
  );

-- Диагностика для POST source
SELECT 
  ckm."commentId",
  ckm."keywordId",
  ckm.source,
  LEFT(p.text, 50) as post_text_preview,
  k.word as keyword,
  normalize_text_for_match(p.text) as normalized_post,
  normalize_text_for_match(k.word) as normalized_keyword,
  CASE 
    WHEN normalize_text_for_match(p.text) LIKE '%' || normalize_text_for_match(k.word) || '%' 
    THEN 'MATCH' 
    ELSE 'NO MATCH' 
  END as match_status
FROM "CommentKeywordMatch" ckm
JOIN "Comment" c ON c.id = ckm."commentId"
JOIN "Post" p ON p."ownerId" = c."ownerId" AND p."vkPostId" = c."postId"
JOIN "Keyword" k ON k.id = ckm."keywordId"
WHERE ckm.source = 'POST'
  AND p.text IS NOT NULL
  AND normalize_text_for_match(p.text) NOT LIKE '%' || normalize_text_for_match(k.word) || '%'
LIMIT 10;

-- Удаление совпадений для постов с пустым текстом
DELETE FROM "CommentKeywordMatch" ckm
WHERE ckm.source = 'POST'
  AND EXISTS (
    SELECT 1
    FROM "Comment" c
    JOIN "Post" p ON p."ownerId" = c."ownerId" AND p."vkPostId" = c."postId"
    WHERE c.id = ckm."commentId"
      AND (p.text IS NULL OR TRIM(p.text) = '')
  );

-- Удаление неправильных совпадений для source = 'POST'
DELETE FROM "CommentKeywordMatch" ckm
WHERE ckm.source = 'POST'
  AND NOT EXISTS (
    SELECT 1
    FROM "Comment" c
    JOIN "Post" p ON p."ownerId" = c."ownerId" AND p."vkPostId" = c."postId"
    JOIN "Keyword" k ON k.id = ckm."keywordId"
    WHERE c.id = ckm."commentId"
      AND p.text IS NOT NULL
      AND TRIM(p.text) != ''
      AND normalize_text_for_match(p.text) LIKE '%' || normalize_text_for_match(k.word) || '%'
  );

-- Показываем сколько записей осталось
SELECT COUNT(*) as remaining_matches FROM "CommentKeywordMatch";

-- Показываем статистику по источникам
SELECT 
  source,
  COUNT(*) as count
FROM "CommentKeywordMatch"
GROUP BY source;

-- Опционально: удалить функцию после использования
-- DROP FUNCTION IF EXISTS normalize_text_for_match(TEXT);
