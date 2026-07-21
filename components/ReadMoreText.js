'use client';

import { useState } from 'react';

export default function ReadMoreText({ text, lines = 3, color = 'var(--color-primary)' }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  return (
    <div>
      <div
        style={{
          display: isExpanded ? 'block' : '-webkit-box',
          WebkitLineClamp: isExpanded ? 'unset' : lines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        dangerouslySetInnerHTML={{ __html: String(text).replace(/\n/g, '<br/>') }}
      />
      {text.length > 100 && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            color: color,
            padding: '4px 0',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.9em',
            marginTop: '4px'
          }}
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
