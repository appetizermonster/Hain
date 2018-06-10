'use strict';

const electron = require('electron');

function getDisplay(openOnDisplay) {
  const screen = electron.screen;

  let selectedDisplay;

  if (openOnDisplay === 'active') {
    // determine the active display as the one with the mouse cursor inside
    const displays = screen.getAllDisplays();
    const cursorPos = screen.getCursorScreenPoint();

    for (const display of displays) {
      const bounds = display.bounds;
      const [left, right, top, bottom] = [
        bounds.x,
        bounds.x + bounds.width,
        bounds.y,
        bounds.y + bounds.height
      ];
      if (cursorPos.x < left || cursorPos.x > right) continue;
      if (cursorPos.y < top || cursorPos.y > bottom) continue;

      selectedDisplay = display;
      break;
    }
  } else if (openOnDisplay) {
    // specified screen ID, match ID against display object
    selectedDisplay = screen
      .getAllDisplays()
      .find((display) => display.id === openOnDisplay);
  }

  if (!selectedDisplay) {
    // display ID not found, set to primary display
    selectedDisplay = screen.getPrimaryDisplay();
  }

  return selectedDisplay;
}

function positionWindowOnScreen(window, openOnDisplay, position) {
  window.setPosition(Math.round(position[0]), Math.round(position[1]));
}

function centerWindowOnScreen(window, openOnDisplay) {
  const selectedDisplay = getDisplay(openOnDisplay);
  const displayBounds = selectedDisplay.bounds;

  // calculate position in center of window
  const position = [
    displayBounds.x + displayBounds.width * 0.5,
    displayBounds.y + displayBounds.height * 0.5
  ];

  // take current window size into account when determining screen position
  const windowSize = window.getSize();

  position[0] -= windowSize[0] * 0.5;
  position[1] -= windowSize[1] * 0.5;

  // initiate window move
  positionWindowOnScreen(window, openOnDisplay, position);
}

module.exports = {
  positionWindowOnScreen,
  centerWindowOnScreen
};
