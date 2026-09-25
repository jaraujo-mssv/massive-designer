import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import "@hyperframes/player";

export interface HfPlayerHandle {
  seek: (seconds: number) => void;
  play: () => void;
  pause: () => void;
}

interface HfPlayerProps {
  src: string;
  width: number;
  height: number;
  controls?: boolean;
  muted?: boolean;
  /** Seek here once the composition is ready (thumbnails stay paused on this frame). */
  at?: number;
  className?: string;
}

type PlayerElement = HTMLElement & {
  ready: boolean;
  seek: (s: number) => void;
  play: () => void;
  pause: () => void;
};

/** React wrapper for the <hyperframes-player> web component (loads the composition in an iframe). */
export const HfPlayer = forwardRef<HfPlayerHandle, HfPlayerProps>(function HfPlayer(
  { src, width, height, controls = false, muted = false, at, className },
  ref,
) {
  const el = useRef<PlayerElement>(null);

  useImperativeHandle(ref, () => ({
    seek: (s) => el.current?.seek(s),
    play: () => el.current?.play(),
    pause: () => el.current?.pause(),
  }));

  useEffect(() => {
    const player = el.current;
    if (!player || at === undefined) return;
    const seek = () => player.seek(at);
    if (player.ready) seek();
    player.addEventListener("ready", seek);
    return () => player.removeEventListener("ready", seek);
  }, [at, src]);

  // Boolean attributes on custom elements must be absent, not "false".
  const flags = {
    ...(controls ? { controls: "" } : {}),
    ...(muted ? { muted: "" } : {}),
  };

  return (
    <hyperframes-player
      ref={el}
      src={src}
      width={width}
      height={height}
      {...flags}
      className={className}
      style={{ display: "block", width: "100%", aspectRatio: `${width} / ${height}` }}
    />
  );
});
