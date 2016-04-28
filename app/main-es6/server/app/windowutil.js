'use strict';

const electron = require('electron');

function centerWindowOnSelectedScreen(window) {
  const screen = electron.screen;

  let selectedDisplay = screen.getPrimaryDisplay();
  const displays = screen.getAllDisplays();
  const cursorPos = screen.getCursorScreenPoint();

  for (const display of displays) {
    const bounds = display.bounds;
    const [left, right, top, bottom] = [bounds.x, bounds.x + bounds.width, bounds.y, bounds.y + bounds.height];
    if (cursorPos.x < left || cursorPos.x > right)
      continue;
    if (cursorPos.y < top || cursorPos.y > bottom)
      continue;

    selectedDisplay = display;
    break;
  }

  const windowSize = window.getSize();
  const displayBounds = selectedDisplay.bounds;

  const centerPos = [displayBounds.x + displayBounds.width * 0.5, displayBounds.y + displayBounds.height * 0.5];
  centerPos[0] -= windowSize[0] * 0.5; // x
  centerPos[1] -= windowSize[1] * 0.5; // y

  window.setPosition(Math.round(centerPos[0]), Math.round(centerPos[1]));
}

module.exports = { centerWindowOnSelectedScreen };
