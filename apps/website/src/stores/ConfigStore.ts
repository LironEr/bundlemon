import { computed, makeAutoObservable, observable, runInAction } from 'mobx';

interface Config {
  bundlemonServiceUrl: string;
  githubAppClientId?: string;
}

export class ConfigStore {
  @observable.ref _config: Config | undefined = undefined;
  @observable.ref error: string | undefined = undefined;

  constructor() {
    makeAutoObservable(this);

    this.init();
  }

  @computed get isLoaded(): boolean {
    return this._config !== undefined;
  }

  init = async () => {
    try {
      const response = await fetch('/assets/config.json');
      const config = await response.json();

      runInAction(() => {
        this._config = config;
      });
    } catch (error) {
      console.error('Failed to load config', error);

      runInAction(() => {
        this.error = `Failed to load config: ${(error as Error).message}`;
      });
    }
  };

  get = <T extends keyof Config>(key: T): Config[T] => {
    if (this._config === undefined) {
      throw new Error('Config is not loaded yet');
    }

    return this._config[key];
  };

  get bundlemonServiceUrl() {
    return import.meta.env.VITE_BUNDLEMON_SERVICE_URL || this.get('bundlemonServiceUrl');
  }

  get githubAppClientId() {
    return import.meta.env.VITE_GITHUB_APP_ID || this.get('githubAppClientId');
  }
}

export const configStore = new ConfigStore();
