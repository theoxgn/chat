const {sequelize, User} = require('../../models');
const {Op} = require('sequelize');
const ChatRole = require("../../src/enums/chat.role");

beforeEach(async () => {
    await User.destroy({
        where: {
            email: {
                [Op.like]: 'test%'
            }
        },
        force: true
    });
});

beforeAll(async () => {
    await sequelize.sync();
});

afterAll(async () => {
    await sequelize.close();
});

describe('User Model', () => {
    it('should create a new user', async () => {
        const userData = {
            username: 'testuser',
            companyName: 'testcompany',
            muatUserId: '999',
            email: 'testuser@example.com',
            password: 'password123',
            profilePicture: "https://example.com",
            role: ChatRole.BUYER,
            status: "active",
            nameChangesCount: 0,
            lastNameChange: new Date(),
            isVerified: false,
            referralCode: "MTX98271",
            lastSeen: new Date()
        };

        const user = await User.create(userData);
        console.log(user);

        expect(user.id).toBeDefined();
        expect(user.username).toBe(userData.username);
        expect(user.companyName).toBe(userData.companyName);
        expect(user.email).toBe(userData.email);
        expect(user.password).toBe(userData.password);
        expect(user.profilePicture).toBe(userData.profilePicture);
        expect(user.role).toBe(userData.role);
        expect(user.status).toBe(userData.status);
        expect(user.nameChangesCount).toBe(userData.nameChangesCount);
        expect(user.lastNameChange).toStrictEqual(userData.lastNameChange);
        expect(user.isVerified).toBe(userData.isVerified);
        expect(user.referralCode).toBe(userData.referralCode);
        expect(user.lastSeen).toStrictEqual(userData.lastSeen);
        expect(user.createdAt).toBeDefined();
    });
});