import { join, basename, resolve, dirname } from 'node:path';
import { readdir as _readdir } from 'node:fs';
import { promisify } from 'node:util';

import pkg from 'import-global';
const { silent } = pkg;
const readdir = promisify(_readdir);
const __dirname = dirname(import.meta.url);

const defaultPlugins = new Set([
  'browsertime',
  'coach',
  'pagexray',
  'domains',
  'assets',
  'html',
  'metrics',
  'text',
  'harstorer',
  'budget',
  'thirdparty',
  'tracestorer',
  'lateststorer',
  'remove'
]);

const pluginsDir = join(__dirname, '..', 'plugins');

export async function parsePluginNames(options) {
  // There's a problem with Safari on iOS runninhg a big blob
  // of JavaScript
  // https://github.com/sitespeedio/browsertime/issues/1275
  if (options.safari && options.safari.ios) {
    defaultPlugins.delete('coach');
  }

  // if we don't use the cli, this will work out fine as long
  // we configure only what we need
  const possibleConfiguredPlugins = options.explicitOptions || options;
  const isDefaultOrConfigured = name =>
    defaultPlugins.has(name) ||
    typeof possibleConfiguredPlugins[name] === 'object';

  const addMessageLoggerIfDebug = pluginNames => {
    if (options.debugMessages) {
      // Need to make sure logger is first, so message logs appear
      // before messages are handled by other plugins
      pluginNames = ['messagelogger'].concat(pluginNames);
    }
    return pluginNames;
  };

  const files = await readdir(new URL(pluginsDir));

  const builtins = files.map(name => basename(name, '.js'));
  // eslint-disable-next-line unicorn/no-array-callback-reference
  const plugins = builtins.filter(isDefaultOrConfigured);
  return addMessageLoggerIfDebug(plugins);
}
export async function loadPlugins(pluginNames, options, context, queue) {
  const plugins = [];
  for (let name of pluginNames) {
    try {
      let { default: plugin } = await import(
        join(pluginsDir, name, 'index.js')
      );
      let p = new plugin(options, context, queue);
      plugins.push(p);
    } catch (error_) {
      try {
        let { default: plugin } = await import(resolve(process.cwd(), name));
        let p = new plugin(options, context, queue);
        plugins.push(p);
      } catch {
        try {
          let { default: plugin } = await import(name);
          let p = new plugin(options, context, queue);
          plugins.push(p);
        } catch (error) {
          // try global
          let plugin = silent(name);
          if (plugin) {
            let p = new plugin(options, context, queue);
            plugins.push(p);
          } else {
            console.error("Couldn't load plugin %s: %s", name, error_); // eslint-disable-line no-console
            // if it fails here, let it fail hard
            throw error;
          }
        }
      }
    }
  }
  return plugins;
}
