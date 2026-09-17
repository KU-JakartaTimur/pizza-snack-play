import { eq } from "drizzle-orm";
import { usersTable } from "../../database/schema";
import type { User, NewUser } from "../../database/schema";
import type { Db } from "../../database/db";

class UserRepository {
  async getAll(db: Db): Promise<User[]> {
    return await db.select().from(usersTable);
  }

  async findById(db: Db, id: number): Promise<User | undefined> {
    const result = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    return result[0];
  }

  async add(db: Db, user: NewUser): Promise<User> {
    const result = await db.insert(usersTable).values(user).returning();
    return result[0];
  }

  async update(db: Db, id: number, data: Partial<NewUser>): Promise<User | null> {
    const result = await db
      .update(usersTable)
      .set(data)
      .where(eq(usersTable.id, id))
      .returning();

    return result.length > 0 ? result[0] : null;
  }

  async remove(db: Db, id: number): Promise<void> {
    await db.delete(usersTable).where(eq(usersTable.id, id));
  }
}

export const userRepository = new UserRepository();
