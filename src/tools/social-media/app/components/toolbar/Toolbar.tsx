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

  designs: ImportedDesign[];
  loadedDesignIndex: number | null;
  loadDesign: (design: ImportedDesign, index: number) => void;
}

export function Toolbar(props: ToolbarProps) {
  return (
    <div className="relative flex">
      {/* Sidebar */}
      <div
        className={`bg-surface border-r border-border-subtle flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          props.sidebarOpen ? 'w-96' : 'w-0'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-border-subtle">
          <h1 className="text-base font-semibold text-text-primary tracking-tight">Social Media Post Designer</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle">
          {(['import', 'blocks'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => props.setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                props.activeTab === tab
                  ? 'border-b-2 border-brand text-brand-light'
                  : 'text-text-dim hover:text-text-primary'
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
        className="absolute top-6 left-full z-10 w-6 h-12 bg-surface border border-border-subtle rounded-r-lg flex items-center justify-center hover:border-brand hover:text-brand text-text-dim shadow-sm transition-colors"
        title={props.sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {props.sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </div>
  );
}
