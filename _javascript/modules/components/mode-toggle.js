/**
 * Sets up the mode toggle button, allowing users to switch between light and dark themes.
 *
 * Dependencies:
 *  - Theme (${JS_ROOT}/theme.js)
 */

const button = document.getElementById('mode-toggle');

export function modeWatcher() {
  if (!Theme.isToggleable) {
    return;
  }

  button.addEventListener('click', () => {
    const next =
      Theme.resolvedTheme === Theme.Mode.DARK ? Theme.Mode.LIGHT : Theme.Mode.DARK;
    Theme.update(next);
  });
}
