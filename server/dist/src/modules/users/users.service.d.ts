import { DrizzleService } from '../../db/drizzle/drizzle.service';
import { User } from '@/db/drizzle/schema';
import { UpdateMeDto } from './dto/update-me.dto';
export declare class UsersService {
    private readonly drizzle;
    constructor(drizzle: DrizzleService);
    getUserById(id: string): Promise<User | null>;
    updateUser(userId: string, dto: UpdateMeDto): Promise<User>;
    getAllUsers(): Promise<User[]>;
    updateUserRole(userId: string, role: string): Promise<User>;
}
