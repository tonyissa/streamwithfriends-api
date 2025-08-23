import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient()

export default async function seedDB() {
    const admin = await prisma.user.findFirst();

    if (admin)
        return;
    
    var hashed = await bcrypt.hash(process.env.ADMIN_PASS, 10);
    await prisma.user.create({
        data: {
            username: process.env.ADMIN_USERNAME,
            password: hashed,
            role: "admin"
        }
    });
    console.log("Admin account created");
}

seedDB();