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
