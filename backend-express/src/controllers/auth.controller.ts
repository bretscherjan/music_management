import { Request, Response } from 'express';
import { prisma } from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';

interface AuthRequest extends Request {
    user?: any;
}

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.users.findUnique({
            where: { Email: email }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Note: If migrating from C# Identity, basic bcrypt compare might fail if the hash format differs.
        // For this migration, we assume passwords will be reset or are already compatible.
        // Ideally, we'd check if it's a C# hash and rehash, but let's stick to bcrypt for now.
        const validPassword = await bcrypt.compare(password, user.PasswordHash);

        // Fallback for development/plaintext (Remove in prod!)
        const validPlain = password === user.PasswordHash;

        if (!validPassword && !validPlain) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.Id, email: user.Email },
            config.jwtSecret,
            { expiresIn: '1h' }
        );

        res.json({
            accessToken: token,
            expiration: new Date(Date.now() + 3600000)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const me = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const user = await prisma.users.findUnique({
            where: { Id: userId },
            include: {
                UserRoles: {
                    include: {
                        Roles: true
                    }
                }
            }
        });

        if (!user) return res.sendStatus(404);

        const roles = user.UserRoles.map((ur: any) => ur.Roles.Name);

        res.json({
            id: user.Id,
            firstName: user.FirstName,
            lastName: user.LastName,
            email: user.Email,
            instrument: user.Instrument,
            roles: roles
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
