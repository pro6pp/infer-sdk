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
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    max-height: 300px;
    overflow-y: auto;
    list-style: none !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: hidden;
  }
  .pro6pp-item {
    padding: 12px 12px 9px 12px;
    cursor: pointer;
    display: flex;
    flex-direction: row;
    align-items: center;
    color: #000000;
    font-size: 14px;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    border-radius: 0 !important;
    margin: 0 !important;
  }
  .pro6pp-item:hover, .pro6pp-item--active {
    background-color: #f5f5f5;
  }
  .pro6pp-item__label {
    font-weight: 500;
    flex-shrink: 0;
  }
  .pro6pp-item__subtitle {
    font-size: 14px;
    color: #404040;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
  }
  .pro6pp-item__chevron {
    margin-left: auto;
    display: flex;
    align-items: center;
    color: #a3a3a3;
    padding-left: 8px;
  }
  .pro6pp-no-results {
    padding: 12px;
    color: #555555;
    font-size: 14px;
    text-align: center;
    user-select: none;
    pointer-events: none;
  }
  .pro6pp-loader {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    border: 2px solid #e0e0e0;
    border-top-color: #404040;
    border-radius: 50%;
    animation: pro6pp-spin 0.6s linear infinite;
    pointer-events: none;
  }
  @keyframes pro6pp-spin {
    to { transform: translateY(-50%) rotate(360deg); }
  }
`;
