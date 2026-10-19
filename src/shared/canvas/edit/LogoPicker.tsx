import { useEffect, useMemo, useRef, useState } from "react";
import { Link2, Upload, X } from "lucide-react";
import { sidebarInputClass } from "@/shared/components/SidebarLayout";
import { InitialsLogo } from "../logos/InitialsLogo";
import { useLogoSources } from "../logos/LogoSourcesContext";
import { LogoProbe, probeLogo } from "../logos/resolve";
import { domainFrom, domainInLogoUrl, INITIALS, isHostingSite, PICKER_SOURCES, sourceOf, sourceUrl } from "../logos/sources";

const labelClass = "block text-[11px] font-medium text-text-dim uppercase tracking-wide mb-1";
const iconButtonClass =
  "relative w-10 h-10 shrink-0 rounded-lg border flex items-center justify-center overflow-hidden transition-colors";
const ring = (selected: boolean) =>
  selected ? "border-brand ring-2 ring-brand/60" : "border-border-subtle hover:border-brand";

/**
 * Picks a company's logo in the edit popover: one icon per logo service that
 * has a logo for its website (services without one are hidden), the initials
 * logo, and Custom URL (paste or upload). Clicking an icon uses it. An empty
 * logo means automatic: the best one found (see resolveLogo).
 */
export function LogoPicker({
  name,
  logoUrl,
  website,
  onLogoChange,
  onWebsiteChange,
}: {
  name: string;
  logoUrl: string;
  website: string;
  onLogoChange: (logoUrl: string) => void;
  onWebsiteChange: (website: string) => void;
}) {
  const { logoDevToken } = useLogoSources();
  // The website field starts from the company's website, else the domain in its logo URL.
  const [websiteText, setWebsiteText] = useState(website || domainFrom(undefined, logoUrl) || "");
  // Logos are for the typed website, unless it's a hosting site (a GitHub repo, an
  // app store): then for the domain the logo cell already points at.
  const typed = domainFrom(websiteText, undefined);
  const typedIsHosting = typed !== null && isHostingSite(typed);
  // As the popover opened: picking Initials or a custom logo mustn't make the services' icons vanish.
  const [logoDomain] = useState(() => domainInLogoUrl(logoUrl));
  const domainFor = (text: string) => {
    const t = domainFrom(text, undefined);
    return t && !isHostingSite(t) ? t : logoDomain;
  };
  const [domain, setDomain] = useState(() => domainFor(websiteText));
  useEffect(() => {
    const timer = setTimeout(() => setDomain(domainFor(websiteText)), 400);
    return () => clearTimeout(timer);
  }, [websiteText]);

  const options = useMemo(
    () =>
      domain
        ? PICKER_SOURCES.flatMap((s) => {
            const url = sourceUrl(s.id, domain, logoDevToken);
            return url ? [{ ...s, url }] : [];
          })
        : [],
    [domain, logoDevToken],
  );
  const [probes, setProbes] = useState<Record<string, LogoProbe>>({});
  useEffect(() => {
    let live = true;
    for (const o of options) {
      void probeLogo(o.url).then((probe) => {
        if (live) setProbes((prev) => ({ ...prev, [o.url]: probe }));
      });
    }
    return () => {
      live = false;
    };
  }, [options]);

  const isInitials = logoUrl.trim().toLowerCase() === INITIALS;
  // A service's icon is selected for its own URL, or any URL of that service for this domain
  // (a sheet's Logo.dev URL has other parameters than the picker's).
  const selectedId = options.find(
    (o) => o.url === logoUrl || (sourceOf(logoUrl) === o.id && domainFrom(undefined, logoUrl) === domain),
  )?.id;
  const isCustom = !!logoUrl && !isInitials && !selectedId;
  const [showCustom, setShowCustom] = useState(isCustom);

  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onLogoChange(reader.result as string);
    reader.readAsDataURL(file);
  };
  const uploaded = logoUrl.startsWith("data:");

  return (
    <div className="space-y-2">
      <label className="block">
        <span className={labelClass}>Website</span>
        <input
          value={websiteText}
          placeholder="example.com"
          onChange={(e) => {
            setWebsiteText(e.target.value);
            onWebsiteChange(e.target.value.trim());
          }}
          className={`${sidebarInputClass} py-1.5`}
        />
      </label>

      <div>
        <span className={labelClass}>Logo</span>
        <div className="flex flex-wrap gap-1.5">
          {options.map((o) => {
            const probe = probes[o.url];
            // Hidden once a service turns out to have no logo (or only a placeholder).
            if (probe && (!probe.ok || probe.width <= 16)) return null;
            return probe ? (
              <button
                key={o.id}
                type="button"
                title={`${o.label} · ${probe.width}px`}
                onClick={() => onLogoChange(o.url)}
                className={`${iconButtonClass} bg-white ${ring(selectedId === o.id)}`}
              >
                <img src={o.url} alt={o.label} className="w-8 h-8 object-contain" />
              </button>
            ) : (
              <div key={o.id} title={`${o.label}: checking…`} className={`${iconButtonClass} border-border-subtle bg-surface-2 animate-pulse`} />
            );
          })}
          <button
            type="button"
            title="Initials"
            onClick={() => onLogoChange(INITIALS)}
            className={`${iconButtonClass} bg-surface-2 ${ring(isInitials)}`}
          >
            <InitialsLogo name={name || "?"} size={30} />
          </button>
          <button
            type="button"
            title="Custom URL or upload"
            onClick={() => setShowCustom((v) => !v)}
            className={`${iconButtonClass} ${isCustom ? "bg-white" : "bg-surface-2"} ${ring(isCustom)}`}
          >
            {isCustom ? (
              <img src={logoUrl} alt="Custom" className="w-8 h-8 object-contain" />
            ) : (
              <Link2 className="w-4 h-4 text-text-dim" />
            )}
          </button>
        </div>
        {!logoUrl && <p className="mt-1 text-[11px] text-text-dim">Automatic: the sharpest logo found for the website.</p>}
        {typedIsHosting && (
          <p className="mt-1 text-[11px] text-text-dim">
            {domain
              ? `${typed} hosts many projects, so these are logos for ${domain}.`
              : `${typed} hosts many projects. Add the company's own website to see logos.`}
          </p>
        )}
        {!domain && !typedIsHosting && (
          <p className="mt-1 text-[11px] text-text-dim">Add a website to see logos from logo services.</p>
        )}
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            value={uploaded ? "Uploaded image" : isCustom ? logoUrl : ""}
            readOnly={uploaded}
            placeholder="Paste a logo URL"
            onChange={(e) => onLogoChange(e.target.value.trim())}
            className={`${sidebarInputClass} py-1.5 min-w-0`}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title="Upload an image"
            className="shrink-0 p-2 text-text-dim border border-border-subtle rounded-md hover:text-text-primary hover:border-brand transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          {logoUrl && (
            <button
              type="button"
              onClick={() => onLogoChange("")}
              title="Clear: pick the logo automatically"
              className="shrink-0 p-2 text-text-dim border border-border-subtle rounded-md hover:text-text-primary hover:border-brand transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
      )}
    </div>
  );
}
