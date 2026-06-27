"use client";

import { useEffect } from 'react';

interface CustomTagInjectorProps {
  headCode?: string;
  bodyStartCode?: string;
  bodyEndCode?: string;
}

function injectHtml(target: HTMLElement, html: string, position: 'append' | 'prepend' = 'append') {
  if (!html.trim()) return;

  const template = document.createElement('template');
  template.innerHTML = html;
  const nodes = Array.from(template.content.childNodes).filter((node) => {
    return node.nodeType === Node.ELEMENT_NODE || node.nodeName.toLowerCase() === 'script';
  });
  const preparedNodes = nodes.map((node) => {
    if (node.nodeName.toLowerCase() !== 'script') {
      const clone = node.cloneNode(true) as HTMLElement;
      if (clone.nodeType === Node.ELEMENT_NODE) {
        clone.setAttribute('data-custom-tag-injector', 'true');
      }
      return clone;
    }

    const originalScript = node as HTMLScriptElement;
    const script = document.createElement('script');
    Array.from(originalScript.attributes).forEach((attr) => {
      script.setAttribute(attr.name, attr.value);
    });
    script.text = originalScript.text;
    script.setAttribute('data-custom-tag-injector', 'true');
    return script;
  });

  if (position === 'prepend') {
    preparedNodes.reverse().forEach((node) => target.prepend(node));
    return;
  }

  preparedNodes.forEach((node) => target.appendChild(node));
}

export default function CustomTagInjector({
  headCode = '',
  bodyStartCode = '',
  bodyEndCode = ''
}: CustomTagInjectorProps) {
  useEffect(() => {
    document.querySelectorAll('[data-custom-tag-injector="true"]').forEach((node) => node.remove());

    injectHtml(document.head, headCode);
    injectHtml(document.body, bodyStartCode, 'prepend');
    injectHtml(document.body, bodyEndCode);

    return () => {
      document.querySelectorAll('[data-custom-tag-injector="true"]').forEach((node) => node.remove());
    };
  }, [headCode, bodyStartCode, bodyEndCode]);

  return null;
}
