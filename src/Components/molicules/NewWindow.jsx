import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

const NewWindow = ({ children, title = 'Popout', onClose }) => {
  const [container, setContainer] = useState(null);
  const [emotionCache, setEmotionCache] = useState(null);
  const newWindow = useRef(null);

  useEffect(() => {
    // Open a new browser window
    newWindow.current = window.open(
      '',
      '',
      'width=800,height=400,left=200,top=200'
    );

    if (!newWindow.current) {
      console.error("Failed to open new window. Pop-ups might be blocked.");
      return;
    }

    // Set the title
    newWindow.current.document.title = title;

    // Set a basic style for body to match app background
    newWindow.current.document.body.style.margin = '0';
    newWindow.current.document.body.style.backgroundColor = '#f8f9fa';
    newWindow.current.document.body.style.overflowX = 'hidden';

    // Create a container div for the React tree
    const div = document.createElement('div');
    newWindow.current.document.body.appendChild(div);

    // Auto-scale content to fit the window width
    const handleResize = () => {
      if (!newWindow.current) return;
      const windowWidth = newWindow.current.innerWidth;
      const targetWidth = 1200; // The ideal width for the worm chart

      if (windowWidth < targetWidth) {
        const scale = windowWidth / targetWidth;
        div.style.transform = `scale(${scale})`;
        div.style.transformOrigin = 'top left';
        div.style.width = `${(1 / scale) * 100}%`;
      } else {
        div.style.transform = 'none';
        div.style.width = '100%';
      }
    };

    newWindow.current.addEventListener('resize', handleResize);
    handleResize(); // Initial scale


    // Copy static stylesheets from parent window
    const stylesheets = Array.from(document.styleSheets);
    stylesheets.forEach((sheet) => {
      try {
        if (sheet.cssRules) {
          const newStyle = newWindow.current.document.createElement('style');
          Array.from(sheet.cssRules).forEach((rule) => {
            newStyle.appendChild(document.createTextNode(rule.cssText));
          });
          newWindow.current.document.head.appendChild(newStyle);
        } else if (sheet.href) {
          const newLink = newWindow.current.document.createElement('link');
          newLink.rel = 'stylesheet';
          newLink.href = sheet.href;
          newWindow.current.document.head.appendChild(newLink);
        }
      } catch (e) {
        // Cross-origin stylesheet error, ignore
      }
    });

    // Copy all dynamically injected <style> tags (like Vite's dev styles)
    Array.from(document.head.querySelectorAll('style')).forEach((styleNode) => {
      // Do not copy existing emotion styles because we are creating a new cache
      if (!styleNode.hasAttribute('data-emotion')) {
        const newStyleNode = styleNode.cloneNode(true);
        newWindow.current.document.head.appendChild(newStyleNode);
      }
    });

    // Create a new Emotion cache that targets the new window's head
    const cache = createCache({
      key: 'external-window',
      container: newWindow.current.document.head,
    });
    setEmotionCache(cache);
    setContainer(div);

    // Handle window close
    newWindow.current.addEventListener('beforeunload', () => {
      if (onClose) onClose();
    });

    return () => {
      if (newWindow.current) {
        newWindow.current.close();
      }
    };
  }, [title, onClose]);

  if (!container || !emotionCache) {
    return null;
  }

  // Wrap the portal children in the new CacheProvider
  return createPortal(
    <CacheProvider value={emotionCache}>
      {children}
    </CacheProvider>,
    container
  );
};

export default NewWindow;
