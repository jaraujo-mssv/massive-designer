import { Column, Settings } from "../App";

interface ThumbnailCanvasProps {
  columns: Column[];
  title: string;
  date: string;
  settings: Settings;
}

export function ThumbnailCanvas({ columns, title, date, settings }: ThumbnailCanvasProps) {
  // Extract all logos from all columns
  const allLogos = columns.flatMap(col => col.companies.map(c => c.logoUrl));
  
  // Create a repeating pattern of logos (repeat enough times to fill the space)
  const logoPattern: string[] = [];
  if (allLogos.length > 0) {
    // Repeat logos to create a long pattern
    for (let i = 0; i < 100; i++) {
      logoPattern.push(...allLogos);
    }
  }

  // Number of rows and logos per row
  const logosPerRow = 15;
  const numberOfRows = 8;

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div 
        className="relative overflow-hidden"
        style={{
          width: '1200px',
          height: '675px',
          background: 'radial-gradient(circle, #FFFFFF 0%, #CBE2F9 100%)'
        }}
      >
        {/* Layer 1: Logo Pattern (Bottom) */}
        <div 
          className="absolute inset-0"
          style={{
            transform: `rotate(${settings.thumbnailRotation}deg) translate(${settings.thumbnailOffsetX}px, ${settings.thumbnailOffsetY}px)`,
            transformOrigin: 'center center'
          }}
        >
          {Array.from({ length: numberOfRows }).map((_, rowIndex) => (
            <div 
              key={rowIndex}
              className="flex items-center"
              style={{
                position: 'absolute',
                top: `${(rowIndex * (settings.thumbnailLogoSize + settings.thumbnailRowPadding))}px`,
                left: `${rowIndex * settings.thumbnailRowOffset}px`,
                height: `${settings.thumbnailLogoSize}px`,
                width: '100%',
                gap: `${settings.thumbnailLogoPadding}px`
              }}
            >
              {logoPattern.slice(rowIndex * logosPerRow, (rowIndex + 1) * logosPerRow).map((logoUrl, logoIndex) => (
                <div
                  key={`${rowIndex}-${logoIndex}`}
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: `${settings.thumbnailLogoSize}px`,
                    height: `${settings.thumbnailLogoSize}px`,
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <img
                    src={logoUrl}
                    alt=""
                    className="object-contain"
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Layer 2: White Overlay (Middle) */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundColor: `rgba(255, 255, 255, ${settings.thumbnailOpacity / 100})`
          }}
        />

        {/* Layer 3: Text (Top) */}
        {settings.thumbnailShowText && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{
              padding: '80px'
            }}
          >
            <div
              className="text-center"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: `${settings.thumbnailTitleFontSize}px`,
                background: 'linear-gradient(180deg, #0C2235 0%, #4C586A 50%, #0C2235 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: '1.2',
                marginBottom: '16px',
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))'
              }}
              dangerouslySetInnerHTML={{ __html: title }}
            />
            <div
              className="text-center"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: `${settings.thumbnailDateFontSize}px`,
                background: 'linear-gradient(180deg, #FF7001 0%, #FFB601 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: '1.2',
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))'
              }}
              dangerouslySetInnerHTML={{ __html: date }}
            />
          </div>
        )}
      </div>
    </div>
  );
}