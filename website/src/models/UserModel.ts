class UserModel {
  provider: string;
  name: string;

  constructor(user: any) {
    this.provider = user.provider;
    this.name = user.name;
  }
}

export default UserModel;
