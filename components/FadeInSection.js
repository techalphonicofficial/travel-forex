'use client';
import { useEffect, useRef, useState } from 'react';

export default function FadeInSection({ children, delay = 0, className = '' }) {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div
      className={`fade-in-section ${isVisible ? 'is-visible' : ''} ${className}`}
      ref={domRef}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
      <style jsx>{`
        .fade-in-section {
          opacity: 0;
          transform: translateY(30px);
          visibility: hidden;
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
          will-change: opacity, visibility;
        }
        .fade-in-section.is-visible {
          opacity: 1;
          transform: none;
          visibility: visible;
        }
      `}</style>
    </div>
  );
}
