import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TabType, DesignBlock, HeadingLevel, SavedSpreadsheet, ImportedDesign } from '../../types';
import { ImportTab } from './ImportTab';
import { BlocksTab } from './BlocksTab';
import { DesignList } from './DesignList';

interface ToolbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Blocks props
  blocks: DesignBlock[];
  selectedBlockId: string | null;
  addHeading: () => void;
  addParagraph: () => void;
  addImage: () => void;
  addPartner: () => void;
  deleteBlock: (id: string) => void;
  moveBlockUp: (id: string) => void;
  moveBlockDown: (id: string) => void;
  updateBlock: (id: string, updates: Partial<DesignBlock>) => void;
  updateHeadingLevel: (id: string, level: HeadingLevel) => void;
  
  // Import props
  spreadsheetUrl: string;
  setSpreadsheetUrl: (url: string) => void;
  isLoading: boolean;
  error: string;
  savedSpreadsheets: SavedSpreadsheet[];
  currentSpreadsheetId: string | null;
  handleImport: () => void;
  loadSpreadsheet: (spreadsheet: SavedSpreadsheet) => void;
  openSpreadsheet: (url: string) => void;
  deleteSpreadsheet: (id: string) => void;
  
  // Design list props
  designs: ImportedDesign[];
  loadedDesignIndex: number | null;
  loadDesign: (design: ImportedDesign, index: number) => void;
}

export function Toolbar(props: ToolbarProps) {
  return (
    <div className="relative flex">
      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          props.sidebarOpen ? 'w-96' : 'w-0'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Social Media Post Designer</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(['import', 'blocks'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => props.setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium capitalize ${
                props.activeTab === tab
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {props.activeTab === 'blocks' && (
            <BlocksTab
              blocks={props.blocks}
              selectedBlockId={props.selectedBlockId}
              addHeading={props.addHeading}
              addParagraph={props.addParagraph}
              addImage={props.addImage}
              addPartner={props.addPartner}
              deleteBlock={props.deleteBlock}
              moveBlockUp={props.moveBlockUp}
              moveBlockDown={props.moveBlockDown}
              updateBlock={props.updateBlock}
              updateHeadingLevel={props.updateHeadingLevel}
            />
          )}

          {props.activeTab === 'import' && (
            <div className="space-y-6">
              <ImportTab
                spreadsheetUrl={props.spreadsheetUrl}
                setSpreadsheetUrl={props.setSpreadsheetUrl}
                isLoading={props.isLoading}
                error={props.error}
                savedSpreadsheets={props.savedSpreadsheets}
                currentSpreadsheetId={props.currentSpreadsheetId}
                handleImport={props.handleImport}
                loadSpreadsheet={props.loadSpreadsheet}
                openSpreadsheet={props.openSpreadsheet}
                deleteSpreadsheet={props.deleteSpreadsheet}
              />
              <DesignList
                designs={props.designs}
                loadedDesignIndex={props.loadedDesignIndex}
                loadDesign={props.loadDesign}
              />
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => props.setSidebarOpen(!props.sidebarOpen)}
        className="absolute top-6 left-full z-10 w-6 h-12 bg-white border border-gray-200 rounded-r-lg flex items-center justify-center hover:bg-orange-50 hover:border-orange-500 hover:text-orange-600 text-gray-600 shadow-sm transition-colors"
        title={props.sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {props.sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </div>
  );
}