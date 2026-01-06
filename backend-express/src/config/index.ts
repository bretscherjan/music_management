import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 3042,
    jwtSecret: process.env.JWT_SECRET || 'super_secret',
};
