require('dotenv').config();
const { Sequelize } = require('sequelize');
const colors = require('colors');

const {
POSTGRES_DB,
POSTGRES_USER,
POSTGRES_PASSWORD,
POSTGRES_HOST,
POSTGRES_PORT,
SYNC_DB,
} = process.env;

const sequelize = new Sequelize(POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, {
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  dialect: 'postgres',
  logging: false,
});
console.log("Connecting as:",
  process.env.POSTGRES_USER,
  "to DB:", process.env.POSTGRES_DB,
  "on host:", process.env.POSTGRES_HOST
);
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    if (process.env.NODE_ENV !== 'test') {
      console.log('✅ Database connection established'.green.bold);
    }

    if (SYNC_DB === 'true') {
      // First ensure columns exist and then update NULL values in required fields 
      try {
        // Check if users table exists
        const tableExists = await sequelize.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')`,
          { type: Sequelize.QueryTypes.SELECT }
        );
        
        if (tableExists[0].exists) {
          console.log('Checking and creating columns if needed before sync'.cyan);
          
          // Check which columns exist in the users table
          const columns = await sequelize.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`,
            { type: Sequelize.QueryTypes.SELECT }
          );
          const existingColumns = columns.map(col => col.column_name);
          
          // Add columns that don't exist yet with NOT NULL constraints and default values
          const requiredColumns = [
            { name: 'first_name', type: 'VARCHAR(255)', default: 'DefaultFirstName' },
            { name: 'last_name', type: 'VARCHAR(255)', default: 'DefaultLastName' },
            { name: 'username', type: 'VARCHAR(255)', default: 'DefaultUsername' },
            { name: 'national_number', type: 'VARCHAR(255)', default: '000000000' },
            { name: 'phone', type: 'VARCHAR(255)', default: '0000000000' },
            { name: 'gender', type: 'VARCHAR(255)', default: 'prefer-not-to-say' },
            { name: 'security_question', type: 'VARCHAR(255)', default: 'pet' },
            { name: 'security_answer', type: 'VARCHAR(255)', default: 'none' }
          ];
          
          for (const col of requiredColumns) {
            if (!existingColumns.includes(col.name)) {
              console.log(`Adding missing column ${col.name} to users table with NOT NULL constraint`.cyan);
              await sequelize.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type} NOT NULL DEFAULT '${col.default}'`);
            }
          }
          
          // For existing columns, update any NULL values
          console.log('Ensuring no NULL values in required fields'.cyan);
          await sequelize.query(`
            UPDATE users 
            SET 
              first_name = COALESCE(first_name, 'DefaultFirstName'),
              last_name = COALESCE(last_name, 'DefaultLastName'),
              username = COALESCE(username, CONCAT('user_', id::text)),
              national_number = COALESCE(national_number, '000000000'),
              phone = COALESCE(phone, '0000000000'),
              gender = COALESCE(gender, 'prefer-not-to-say'),
              security_question = COALESCE(security_question, 'pet'),
              security_answer = COALESCE(security_answer, 'none')
          `);
        }
      } catch (prepError) {
        console.log('Error preparing database:'.yellow, prepError.message);
        // Continue despite errors to allow sync to handle it
      }

      // Now sync with schema changes
      await sequelize.sync({ alter: true });
      if (process.env.NODE_ENV !== 'test') {
        console.log('✅ Database synced successfully'.green.inverse);
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('❌ Unable to connect to the database:'.red, error);
    }
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
