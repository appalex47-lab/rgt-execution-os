/**
 * Deployment configuration (loaded before the app). Keep this file free of secrets.
 * Embedded mode (iframe inside RevNavigator): list the EXACT https origin(s) of the parent.
 * Wildcards are rejected by the bridge. An empty list keeps the postMessage bridge disabled.
 *   window.RGT_REVNAVIGATOR_ORIGINS = ["https://revnavigator.example.com"];
 */
window.RGT_REVNAVIGATOR_ORIGINS = [];
