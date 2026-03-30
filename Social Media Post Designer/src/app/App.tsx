import React, { useState, useRef } from 'react';
import { TabType, Theme } from './types';
import { THEMES } from './constants';
import { DualCanvasLayout } from './DualCanvasLayout';
import { Toolbar } from './components/toolbar/Toolbar';
import { CanvasContent } from './components/canvas/CanvasContent';
import { useSpreadsheets } from './hooks/useSpreadsheets';
import { useBlocks } from './hooks/useBlocks';
import { useExport } from './hooks/useExport';
import { useDesignLoader } from './hooks/useDesignLoader';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('import');
  const [projectTheme, setProjectTheme] = useState<Theme>('light');
  const [designTitle, setDesignTitle] = useState('design');
  const [loadedDesignIndex, setLoadedDesignIndex] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const linkedinCanvasRef = useRef<HTMLDivElement>(null);
  const twitterCanvasRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const spreadsheets = useSpreadsheets();
  const blocksManager = useBlocks(projectTheme);
  const exportManager = useExport(designTitle);
  
  const { loadDesign } = useDesignLoader(
    setProjectTheme,
    setDesignTitle,
    blocksManager.setBlocksDirectly,
    setLoadedDesignIndex
  );

  const renderCanvasContent = (template: 'linkedin' | 'twitter') => {
    return (
      <CanvasContent
        blocks={blocksManager.blocks}
        theme={projectTheme}
        template={template}
      />
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Toolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        blocks={blocksManager.blocks}
        selectedBlockId={blocksManager.selectedBlockId}
        addHeading={blocksManager.addHeading}
        addParagraph={blocksManager.addParagraph}
        addImage={blocksManager.addImage}
        addPartner={blocksManager.addPartner}
        deleteBlock={blocksManager.deleteBlock}
        moveBlockUp={blocksManager.moveBlockUp}
        moveBlockDown={blocksManager.moveBlockDown}
        updateBlock={blocksManager.updateBlock}
        updateHeadingLevel={blocksManager.updateHeadingLevel}
        spreadsheetUrl={spreadsheets.spreadsheetUrl}
        setSpreadsheetUrl={spreadsheets.setSpreadsheetUrl}
        isLoading={spreadsheets.isLoading}
        error={spreadsheets.error}
        savedSpreadsheets={spreadsheets.savedSpreadsheets}
        currentSpreadsheetId={spreadsheets.currentSpreadsheetId}
        handleImport={spreadsheets.handleImport}
        loadSpreadsheet={spreadsheets.loadSpreadsheet}
        openSpreadsheet={spreadsheets.openSpreadsheet}
        deleteSpreadsheet={spreadsheets.deleteSpreadsheet}
        designs={spreadsheets.designs}
        loadedDesignIndex={loadedDesignIndex}
        loadDesign={loadDesign}
      />

      <DualCanvasLayout
        linkedinCanvasRef={linkedinCanvasRef}
        twitterCanvasRef={twitterCanvasRef}
        renderCanvasContent={renderCanvasContent}
        handleExportCanvas={exportManager.handleExportCanvas}
        exportingLinkedin={exportManager.exportingLinkedin}
        exportingTwitter={exportManager.exportingTwitter}
        theme={projectTheme}
        THEMES={THEMES}
      />
    </div>
  );
}

export default App;