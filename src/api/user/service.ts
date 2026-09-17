import { userRepository } from "./repository";
import type { Db } from "../../database/db";
import type { NewUser } from "../../database/schema";

class UserService {
  async addUser(db: Db, data: NewUser) {
    return await userRepository.add(db, data);
  }

  async getUsers(db: Db) {
    return await userRepository.getAll(db);
  }

  async getUserById(db: Db, id: number) {
    return await userRepository.findById(db, id);
  }

  async updateUser(db: Db, id: number, data: Partial<NewUser>) {
    return await userRepository.update(db, id, data);
  }

  async removeUser(db: Db, id: number) {
    return await userRepository.remove(db, id);
  }
}

export const userService = new UserService();
