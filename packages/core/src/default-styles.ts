export const DEFAULT_STYLES = `
  .pro6pp-wrapper {
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    box-sizing: border-box;
    width: 100%;
    -webkit-tap-highlight-color: transparent;
  }
  .pro6pp-wrapper * {
    box-sizing: border-box;
  }
  .pro6pp-input {
    width: 100%;
    padding: 12px 14px;
    padding-right: 48px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 16px;
    line-height: 1.5;
    appearance: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .pro6pp-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .pro6pp-input-addons {
    position: absolute;
    right: 4px;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    pointer-events: none;
  }
  .pro6pp-input-addons > * {
    pointer-events: auto;
  }

  .pro6pp-clear-button {
    background: none;
    border: none;
    width: 40px;
    height: 40px;
    cursor: pointer;
    color: #a3a3a3;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: color 0.2s, background-color 0.2s;
    touch-action: manipulation;
  }

  @media (hover: hover) {
    .pro6pp-clear-button:hover {
      color: #1f2937;
      background-color: #f3f4f6;
    }
  }

  .pro6pp-clear-button:active {
    background-color: #f3f4f6;
  }

  .pro6pp-loader {
    width: 20px;
    height: 20px;
    margin: 0 8px;
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
    margin-top: 6px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    max-height: 40vh;
    min-height: 50px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    -webkit-overflow-scrolling: touch;
  }

  @media (max-height: 500px) {
    .pro6pp-dropdown {
      max-height: 140px;
    }
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
    align-items: flex-start;
    color: #111827;
    font-size: 15px;
    line-height: 1.4;
    border-bottom: 1px solid #f3f4f6;
    word-break: break-word;
    white-space: normal;
  }

  .pro6pp-item:last-child {
    border-bottom: none;
  }

  @media (hover: hover) {
    .pro6pp-item:hover, .pro6pp-item--active {
      background-color: #f9fafb;
    }
  }

  .pro6pp-item:active {
    background-color: #f3f4f6;
  }

  .pro6pp-item__label {
    font-weight: 500;
    flex-shrink: 0;
  }
  .pro6pp-item__subtitle {
    font-size: 14px;
    color: #6b7280;
    flex-grow: 1;
  }
  .pro6pp-item__chevron {
    flex-shrink: 0;
    margin-left: 8px;
    display: flex;
    align-items: center;
    align-self: center;
    color: #9ca3af;
  }

  .pro6pp-no-results {
    padding: 24px 16px;
    color: #6b7280;
    font-size: 15px;
    text-align: center;
  }

  .pro6pp-load-more {
    width: 100%;
    padding: 14px;
    background: #f9fafb;
    border: none;
    border-top: 1px solid #e0e0e0;
    color: #3b82f6;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
    touch-action: manipulation;
  }

  .pro6pp-load-more:active {
    background-color: #f3f4f6;
  }

  @keyframes pro6pp-spin {
    to { transform: rotate(360deg); }
  }
`;
