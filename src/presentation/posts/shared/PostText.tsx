import { Fragment, useMemo } from "react";

import styles from "./PostText.module.scss";

const URL_REGEX = /(https?:\/\/\S+|www\.\S+)/g;
const TRAILING_PUNCTUATION = new Set([".", ",", ";", ":", "!", "?", ")", '"', "'"]);

interface PostTextProps {
  text: string;
  className?: string;
}

interface TextSegment {
  key: string;
  content: string;
  url: string | null;
}

function splitIntoSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let matchIndex = 0;

  for (const match of text.matchAll(URL_REGEX)) {
    const matchStart = match.index ?? 0;
    if (matchStart > lastIndex) {
      segments.push({ key: `text-${matchIndex}`, content: text.slice(lastIndex, matchStart), url: null });
    }

    let rawUrl = match[0];
    let trailing = "";
    while (rawUrl.length > 0 && TRAILING_PUNCTUATION.has(rawUrl[rawUrl.length - 1])) {
      trailing = rawUrl[rawUrl.length - 1] + trailing;
      rawUrl = rawUrl.slice(0, -1);
    }
    const normalizedUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

    segments.push({ key: `url-${matchIndex}`, content: rawUrl, url: normalizedUrl });
    if (trailing.length > 0) {
      segments.push({ key: `trailing-${matchIndex}`, content: trailing, url: null });
    }

    lastIndex = matchStart + match[0].length;
    matchIndex += 1;
  }

  if (lastIndex < text.length) {
    segments.push({ key: `text-${matchIndex}`, content: text.slice(lastIndex), url: null });
  }

  return segments;
}

export function PostText({ text, className }: PostTextProps) {
  const segments = useMemo(() => splitIntoSegments(text), [text]);

  return (
    <p className={className}>
      {segments.map((segment) =>
        segment.url ? (
          <a key={segment.key} className={styles.link} href={segment.url} target="_blank" rel="noreferrer">
            {segment.content}
          </a>
        ) : (
          <Fragment key={segment.key}>{segment.content}</Fragment>
        )
      )}
    </p>
  );
}