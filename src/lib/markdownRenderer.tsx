/**
 * Robust Markdown-to-React renderer.
 * Handles cases where headings and paragraphs are separated by single newlines (\n)
 * instead of double newlines (\n\n), which was causing heading styles to bleed
 * into following paragraph text.
 */

import React from 'react';

interface RenderOptions {
  headingColor?: string;       // Tailwind class e.g. "text-emerald-400"
  h2Color?: string;            // Override for h2 specifically
  h3Color?: string;            // Override for h3 specifically
  paragraphColor?: string;     // Tailwind class e.g. "text-gray-300"
  printColor?: string;         // Tailwind class for print e.g. "print:text-black"
}

const defaultOptions: RenderOptions = {
  headingColor: 'text-cyan-400',
  h2Color: 'text-cyan-400',
  h3Color: 'text-amber-400',
  paragraphColor: 'text-gray-300 dark:text-gray-300',
  printColor: 'print:text-black',
};

/**
 * Renders Markdown content as React elements with proper parsing.
 * Handles:
 * - # ## ### headings
 * - Paragraphs (separated by \n or \n\n)
 * - Bullet lists (- or *)
 * - **bold** and *italic* inline formatting
 * - Source/attribution lines
 */
export function renderMarkdownContent(
  content: string,
  options: RenderOptions = {}
): React.ReactNode[] {
  const opts = { ...defaultOptions, ...options };

  if (!content) return [];

  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into individual lines first for proper parsing
  const lines = normalized.split('\n');

  const elements: React.ReactNode[] = [];
  let currentParagraphLines: string[] = [];
  let currentListItems: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join(' ').trim();
      if (text) {
        elements.push(
          <p
            key={`p-${key++}`}
            className={`mb-4 leading-relaxed ${opts.paragraphColor} ${opts.printColor}`}
          >
            {renderInline(text)}
          </p>
        );
      }
      currentParagraphLines = [];
    }
  };

  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`ul-${key++}`} className="list-disc list-inside mb-4 space-y-1 pl-2">
          {currentListItems.map((item, i) => (
            <li key={i} className={`${opts.paragraphColor} ${opts.printColor} leading-relaxed`}>
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      currentListItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line = paragraph break
    if (trimmed === '') {
      flushParagraph();
      flushList();
      continue;
    }

    // ### Heading 3
    if (trimmed.startsWith('### ') || trimmed.startsWith('###\t')) {
      flushParagraph();
      flushList();
      const text = trimmed.replace(/^###\s*/, '');
      elements.push(
        <h3
          key={`h3-${key++}`}
          className={`text-xl font-bold mt-6 mb-2 ${opts.h3Color || opts.headingColor} ${opts.printColor}`}
        >
          {renderInline(text)}
        </h3>
      );
      continue;
    }

    // ## Heading 2
    if (trimmed.startsWith('## ') || trimmed.startsWith('##\t')) {
      flushParagraph();
      flushList();
      const text = trimmed.replace(/^##\s*/, '');
      elements.push(
        <h2
          key={`h2-${key++}`}
          className={`text-2xl font-extrabold mt-8 mb-3 ${opts.h2Color || opts.headingColor} ${opts.printColor}`}
        >
          {renderInline(text)}
        </h2>
      );
      continue;
    }

    // # Heading 1 (rare in content body, but handle it)
    if (trimmed.startsWith('# ') || trimmed.startsWith('#\t')) {
      flushParagraph();
      flushList();
      const text = trimmed.replace(/^#\s*/, '');
      elements.push(
        <h2
          key={`h1-${key++}`}
          className={`text-2xl font-extrabold mt-8 mb-3 ${opts.headingColor} ${opts.printColor}`}
        >
          {renderInline(text)}
        </h2>
      );
      continue;
    }

    // Bullet list item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushParagraph();
      const text = trimmed.replace(/^[-*]\s+/, '');
      currentListItems.push(text);
      continue;
    }

    // Regular text line — accumulate as paragraph
    flushList();
    currentParagraphLines.push(trimmed);
  }

  // Flush any remaining
  flushParagraph();
  flushList();

  return elements;
}

/**
 * Renders inline Markdown: **bold**, *italic*, `code`
 */
function renderInline(text: string): React.ReactNode {
  if (!text.includes('**') && !text.includes('*') && !text.includes('`')) {
    return text;
  }

  // Simple inline parser for bold/italic/code
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let idx = 0;

  while (remaining.length > 0) {
    // Bold **text**
    const boldMatch = remaining.match(/^([\s\S]*?)\*\*([\s\S]*?)\*\*([\s\S]*)/);
    // Italic *text*
    const italicMatch = remaining.match(/^([\s\S]*?)\*([\s\S]*?)\*([\s\S]*)/);
    // Code `text`
    const codeMatch = remaining.match(/^([\s\S]*?)`([\s\S]*?)`([\s\S]*)/);

    // Find which comes first
    const boldPos = boldMatch ? remaining.indexOf('**') : Infinity;
    const italicPos = italicMatch ? remaining.indexOf('*') : Infinity;
    const codePos = codeMatch ? remaining.indexOf('`') : Infinity;

    const minPos = Math.min(boldPos, italicPos, codePos);

    if (minPos === Infinity) {
      parts.push(<span key={idx++}>{remaining}</span>);
      break;
    }

    if (minPos === boldPos && boldMatch) {
      if (boldMatch[1]) parts.push(<span key={idx++}>{boldMatch[1]}</span>);
      parts.push(<strong key={idx++} className="font-bold">{boldMatch[2]}</strong>);
      remaining = boldMatch[3];
    } else if (minPos === codePos && codeMatch) {
      if (codeMatch[1]) parts.push(<span key={idx++}>{codeMatch[1]}</span>);
      parts.push(<code key={idx++} className="bg-slate-800 px-1 py-0.5 rounded text-amber-300 text-sm">{codeMatch[2]}</code>);
      remaining = codeMatch[3];
    } else if (italicMatch) {
      if (italicMatch[1]) parts.push(<span key={idx++}>{italicMatch[1]}</span>);
      parts.push(<em key={idx++} className="italic">{italicMatch[2]}</em>);
      remaining = italicMatch[3];
    } else {
      parts.push(<span key={idx++}>{remaining}</span>);
      break;
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
