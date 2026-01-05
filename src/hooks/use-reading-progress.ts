import { useEffect, useState } from 'react';

export function useReadingProgress(targetId: string) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const target = document.getElementById(targetId);
      if (!target) {
        setProgress(0);
        return;
      }

      const rect = target.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const total = rect.height - viewportHeight;

      if (total <= 0) {
        setProgress(100);
        return;
      }

      const distanceScrolled = Math.min(Math.max(-rect.top, 0), total);
      const percentage = (distanceScrolled / total) * 100;
      setProgress(Math.round(percentage));
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);

    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [targetId]);

  return progress;
}
