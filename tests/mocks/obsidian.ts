/**
 * Mock implementations of Obsidian API classes and functions
 * Used for testing plugin code without needing the full Obsidian app
 */

import { vi } from 'vitest';

// Mock Notice class - must be a proper class for constructor usage
export class Notice {
  message: string;
  timeout: number;

  constructor(message: string, timeout?: number) {
    this.message = message;
    this.timeout = timeout || 5000;
  }

  hide() {
    // Mock hide implementation
  }

  setMessage(message: string) {
    this.message = message;
  }
}

// Mock App class
export class App {
  vault = {
    getAbstractFileByPath: vi.fn(),
    getMarkdownFiles: vi.fn(() => []),
  };

  workspace = {
    openLinkText: vi.fn(),
    getLeavesOfType: vi.fn(() => []),
    revealLeaf: vi.fn(),
  };

  plugins = {
    plugins: {},
  };
}

// Mock Plugin class
export class Plugin {
  app: App;
  manifest: any;

  constructor(app: App, manifest: any) {
    this.app = app;
    this.manifest = manifest;
  }

  async loadData(): Promise<any> {
    return {};
  }

  async saveData(data: any): Promise<void> {
    // Mock save
  }

  addCommand(command: any) {
    // Mock add command
  }

  addRibbonIcon(icon: string, title: string, callback: () => void) {
    // Mock add ribbon
    return {} as any;
  }

  addSettingTab(settingTab: any) {
    // Mock add setting tab
  }

  registerView(viewType: string, viewCreator: any) {
    // Mock register view
  }

  registerEvent(event: any) {
    // Mock register event
  }
}

// Mock Platform
export const Platform = {
  isMobile: false,
  isDesktop: true,
  isPhone: false,
  isTablet: false,
  isMacOS: false,
  isWin: false,
  isLinux: false,
  isIosApp: false,
  isAndroidApp: false,
};

// Mock TFile
export class TFile {
  path: string;
  name: string;
  basename: string;
  extension: string;

  constructor(path: string) {
    this.path = path;
    this.name = path.split('/').pop() || '';
    this.basename = this.name.replace(/\.[^/.]+$/, '');
    this.extension = this.name.split('.').pop() || '';
  }
}

// Mock Modal
export class Modal {
  app: App;
  contentEl: HTMLElement;

  constructor(app: App) {
    this.app = app;
    this.contentEl = document.createElement('div');
  }

  open() {
    // Mock open
  }

  close() {
    // Mock close
  }

  onOpen() {
    // Override in subclass
  }

  onClose() {
    // Override in subclass
  }
}

// Mock ItemView
export class ItemView {
  app: App;
  containerEl: HTMLElement;
  contentEl: HTMLElement;

  constructor(app: App) {
    this.app = app;
    this.containerEl = document.createElement('div');
    this.contentEl = document.createElement('div');
  }

  getViewType(): string {
    return 'mock-view';
  }

  getDisplayText(): string {
    return 'Mock View';
  }

  getIcon(): string {
    return 'document';
  }

  async onOpen() {
    // Override in subclass
  }

  async onClose() {
    // Override in subclass
  }
}

// Mock Setting
export class Setting {
  private settingEl: HTMLElement;

  constructor(containerEl: HTMLElement) {
    this.settingEl = document.createElement('div');
    containerEl.appendChild(this.settingEl);
  }

  setName(name: string) {
    return this;
  }

  setDesc(desc: string) {
    return this;
  }

  addText(callback: (text: any) => void) {
    const text = {
      inputEl: document.createElement('input'),
      setValue: vi.fn().mockReturnThis(),
      onChange: vi.fn().mockReturnThis(),
    };
    callback(text);
    return this;
  }

  addToggle(callback: (toggle: any) => void) {
    const toggle = {
      setValue: vi.fn().mockReturnThis(),
      onChange: vi.fn().mockReturnThis(),
    };
    callback(toggle);
    return this;
  }

  addDropdown(callback: (dropdown: any) => void) {
    const dropdown = {
      addOption: vi.fn().mockReturnThis(),
      setValue: vi.fn().mockReturnThis(),
      onChange: vi.fn().mockReturnThis(),
    };
    callback(dropdown);
    return this;
  }

  addButton(callback: (button: any) => void) {
    const button = {
      setButtonText: vi.fn().mockReturnThis(),
      setTooltip: vi.fn().mockReturnThis(),
      onClick: vi.fn().mockReturnThis(),
      buttonEl: document.createElement('button'),
    };
    callback(button);
    return this;
  }
}

// Mock PluginSettingTab
export class PluginSettingTab {
  app: App;
  plugin: any;
  containerEl: HTMLElement;

  constructor(app: App, plugin: any) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = document.createElement('div');
  }

  display() {
    // Override in subclass
  }

  hide() {
    // Override in subclass
  }
}
