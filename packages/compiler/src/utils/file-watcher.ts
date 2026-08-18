import chokidar from "chokidar";
import { subscribable, Subscribable } from "./subscribable";

interface WatcherInstance {
  isReady: boolean;
  watcher: chokidar.FSWatcher;
}

interface WatcherOptions {
  onAdd?: (path: string) => void;
  onUnlink?: (path: string) => void;
  onChange?: (path: string) => void;
}

export class Watcher {
  private watchers: WatcherInstance[] = [];

  isReady: boolean = false;

  globalOptions: chokidar.WatchOptions = {};

  onReadySubscribable: Subscribable = subscribable();

  constructor(options: chokidar.WatchOptions = {}) {
    this.globalOptions = options;
  }

  watch(
    path: string,
    options: WatcherOptions,
    chokidarOptions: chokidar.WatchOptions = {}
  ) {
    const instance = chokidar.watch(path, {
      ...this.globalOptions,
      ...chokidarOptions,
    });

    options.onAdd && instance.on("add", options.onAdd);
    options.onUnlink && instance.on("unlink", options.onUnlink);
    options.onChange && instance.on("change", options.onChange);

    const watcherInstance: WatcherInstance = {
      isReady: false,
      watcher: instance,
    };

    this.watchers.push(watcherInstance);

    instance.on("ready", () => {
      watcherInstance.isReady = true;
      this.checkReady();
    });
  }

  public onReady(callback: () => void) {
    this.onReadySubscribable.addCallback(callback);
  }

  private checkReady() {
    if (this.watchers.every((watcher) => watcher.isReady)) {
      this.onReadySubscribable.runCallbacks();

      this.onReadySubscribable.clearCallbacks();
    }
  }
}
