export const DEFAULT_STYLES = `
  .pro6pp-wrapper {
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    box-sizing: border-box;
    width: 100%;
  }
  .pro6pp-wrapper * {
    box-sizing: border-box;
  }
  .pro6pp-input {
    width: 100%;
    padding: 10px 12px;
    padding-right: 48px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 16px;
    line-height: 1.5;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .pro6pp-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .pro6pp-input-addons {
    position: absolute;
    right: 6px;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    gap: 2px;
    pointer-events: none;
  }
  .pro6pp-input-addons > * {
    pointer-events: auto;
  }

  .pro6pp-clear-button {
    background: none;
    border: none;
    width: 28px;
    height: 28px;
    cursor: pointer;
    color: #a3a3a3;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: color 0.2s, background-color 0.2s, transform 0.1s;
  }
  .pro6pp-clear-button:hover {
    color: #1f2937;
    background-color: #f3f4f6;
  }
  .pro6pp-clear-button:active {
    transform: scale(0.92);
  }
  .pro6pp-clear-button svg {
    width: 18px;
    height: 18px;
  }

  .pro6pp-loader {
    width: 18px;
    height: 18px;
    margin: 0 4px;
    border: 2px solid #e0e0e0;
    border-top-color: #6b7280;
    border-radius: 50%;
    animation: pro6pp-spin 0.6s linear infinite;
    flex-shrink: 0;
  }

  .pro6pp-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 9999;
    margin-top: 4px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    max-height: 300px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  .pro6pp-list {
    list-style: none !important;
    padding: 0 !important;
    margin: 0 !important;
    flex-grow: 1;
  }
  .pro6pp-item {
    padding: 12px 16px;
    cursor: pointer;
    display: flex;
    flex-direction: row;
    align-items: center;
    color: #111827;
    font-size: 14px;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
  }
  .pro6pp-item:hover, .pro6pp-item--active {
    background-color: #f9fafb;
  }
  .pro6pp-item__label {
    font-weight: 500;
    flex-shrink: 0;
  }
  .pro6pp-item__subtitle {
    font-size: 14px;
    color: #6b7280;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
  }
  .pro6pp-item__chevron {
    margin-left: auto;
    display: flex;
    align-items: center;
    color: #9ca3af;
    padding-left: 8px;
  }
  .pro6pp-no-results {
    padding: 16px;
    color: #6b7280;
    font-size: 14px;
    text-align: center;
  }
  .pro6pp-load-more {
    width: 100%;
    padding: 10px;
    background: #f9fafb;
    border: none;
    border-top: 1px solid #e0e0e0;
    color: #3b82f6;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    flex-shrink: 0;
  }
  .pro6pp-load-more:hover {
    background-color: #f3f4f6;
  }

  @keyframes pro6pp-spin {
    to { transform: rotate(360deg); }
  }
`;
