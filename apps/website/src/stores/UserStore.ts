import UserModel from '@/models/UserModel';
import { getMe, logout } from '@/services/bundlemonService';
import { makeAutoObservable, observable, runInAction } from 'mobx';

export class UserStore {
  @observable.ref user: UserModel | undefined;

  constructor() {
    makeAutoObservable(this);

    this.init();
  }

  init = async () => {
    try {
      const isSessionExists = getCookie('isSessionExists') === 'true';

      if (!isSessionExists) {
        // session not exists, no reason to try to get user details
        return;
      }

      const user = await getMe();

      if (user) {
        runInAction(() => {
          this.user = new UserModel(user);
        });
      }
    } catch (e) {
      console.error('Failed to load user', e);
    }
  };

  logout = async () => {
    await logout();

    runInAction(() => {
      this.user = undefined;
    });
  };
}

export const userStore = new UserStore();

function getCookie(cookieName: string): string | undefined {
  const cookies: Record<string, string> = {};
  document.cookie.split(';').forEach(function (el) {
    const [key, value] = el.split('=');
    cookies[key.trim()] = value;
  });
  return cookies[cookieName];
}
