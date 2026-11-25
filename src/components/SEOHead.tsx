import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  noIndex?: boolean;
}

export function SEOHead({ title, description, noIndex = false }: SEOHeadProps) {
  useEffect(() => {
    const fullTitle = title.includes('DayTech Solutions')
      ? title
      : `${title} – DayTech Solutions`;
    document.title = fullTitle;

    const setMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    const canonicalHref = window.location.origin + window.location.pathname;
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalHref);

    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (noIndex) {
      if (!robots) {
        robots = document.createElement('meta');
        robots.setAttribute('name', 'robots');
        document.head.appendChild(robots);
      }
      robots.setAttribute('content', 'noindex, nofollow');
    } else if (robots) {
      robots.setAttribute('content', 'index, follow');
    }
  }, [title, description, noIndex]);

  return null;
}
