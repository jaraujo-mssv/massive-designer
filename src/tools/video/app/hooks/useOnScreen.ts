import { RefObject, useEffect, useState } from "react";

/** True once the element has scrolled near the viewport; stays true afterwards. */
export function useOnScreen(ref: RefObject<Element>, rootMargin = "200px"): boolean {
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, seen]);

  return seen;
}
