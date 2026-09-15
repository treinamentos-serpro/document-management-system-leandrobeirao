class UserRepository {
  constructor() {
    this.users = new Map();
  }

  save(user) {
    this.users.set(user.id, user);
    return user;
  }

  findByUsername(username) {
    return [...this.users.values()].find((user) => user.username === username);
  }

  findById(id) {
    return this.users.get(id);
  }
}

module.exports = UserRepository;