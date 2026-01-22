import dbConnect from './app/lib/mongodb';
import User from './app/models/User';
import { hash } from 'bcryptjs';

async function seedAdmin() {
    try {
        await dbConnect();

        const adminEmail = 'admin@hormiruta.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        const hashedPassword = await hash('admin123', 12);

        await User.create({
            name: 'Administrador Maestro',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin'
        });

        console.log('Admin user created successfully');
        console.log('Email: admin@hormiruta.com');
        console.log('Password: admin123');
    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        process.exit();
    }
}

seedAdmin();
