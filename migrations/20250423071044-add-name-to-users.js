'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get information about the users table
      const tableInfo = await queryInterface.sequelize.query(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_name = 'users'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );
      
      const columnExists = (name) => tableInfo.some(col => col.column_name === name);
      
      // Step 1: Fix the name column
      if (!columnExists('name')) {
        console.log('Adding name column...');
        await queryInterface.addColumn('users', 'name', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
        
        // Update existing records with a default name based on email or id
        await queryInterface.sequelize.query(
          `UPDATE "users" 
           SET "name" = COALESCE(
             SUBSTRING("email" FROM '^[^@]+'),
             'User_' || "id"
           ) 
           WHERE "name" IS NULL`,
          { transaction }
        );
        
        // Now make it NOT NULL
        await queryInterface.changeColumn('users', 'name', {
          type: Sequelize.STRING,
          allowNull: false
        }, { transaction });
        
        console.log('Name column fixed');
      }
      
      // Step 2: Fix the role column and ENUM issue
      if (columnExists('role')) {
        console.log('Fixing role column...');
        
        // Check if we need to create the ENUM type
        const enumCheck = await queryInterface.sequelize.query(
          `SELECT 1 FROM pg_type WHERE typname = 'enum_users_role'`,
          { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
        );
        
        if (enumCheck.length === 0) {
          // Create the ENUM type
          await queryInterface.sequelize.query(
            `CREATE TYPE "enum_users_role" AS ENUM('user', 'admin', 'pharmacist')`,
            { transaction }
          );
        }
        
        // Update any NULL or invalid values
        await queryInterface.sequelize.query(
          `UPDATE "users" 
           SET "role" = 'user' 
           WHERE "role" IS NULL OR "role" NOT IN ('user', 'admin', 'pharmacist')`,
          { transaction }
        );
        
        // Get the current data type of the role column
        const roleColumn = tableInfo.find(col => col.column_name === 'role');
        
        // Only convert if it's not already an enum
        if (roleColumn && !roleColumn.data_type.includes('enum')) {
          // Convert the column type safely
          await queryInterface.sequelize.query(
            `ALTER TABLE "users" 
             ALTER COLUMN "role" TYPE "enum_users_role" 
             USING "role"::text::"enum_users_role"`,
            { transaction }
          );
        }
        
        // Set NOT NULL and default
        await queryInterface.sequelize.query(
          `ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL`,
          { transaction }
        );
        
        await queryInterface.sequelize.query(
          `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'`,
          { transaction }
        );
        
        console.log('Role column fixed');
      } else {
        // Add the role column if it doesn't exist
        console.log('Adding role column...');
        
        // Check if we need to create the ENUM type
        const enumCheck = await queryInterface.sequelize.query(
          `SELECT 1 FROM pg_type WHERE typname = 'enum_users_role'`,
          { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
        );
        
        if (enumCheck.length === 0) {
          // Create the ENUM type
          await queryInterface.sequelize.query(
            `CREATE TYPE "enum_users_role" AS ENUM('user', 'admin', 'pharmacist')`,
            { transaction }
          );
        }
        
        await queryInterface.addColumn('users', 'role', {
          type: Sequelize.ENUM('user', 'admin', 'pharmacist'),
          defaultValue: 'user',
          allowNull: false
        }, { transaction });
        
        console.log('Role column added');
      }
      
      // Step 3: Check for other common columns that might be missing
      const commonColumns = [
        {
          name: 'email',
          definition: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
          }
        },
        {
          name: 'password',
          definition: {
            type: Sequelize.STRING,
            allowNull: false
          }
        },
        {
          name: 'createdAt',
          definition: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        },
        {
          name: 'updatedAt',
          definition: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        }
      ];
      
      for (const column of commonColumns) {
        if (!columnExists(column.name)) {
          console.log(`Adding ${column.name} column...`);
          await queryInterface.addColumn('users', column.name, column.definition, { transaction });
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      console.log('Migration completed successfully');
      
      return Promise.resolve();
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      console.error('Migration failed:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This is a fixing migration, so down migration is not recommended
    // But if needed, you could revert specific changes
    console.log('Down migration not implemented for safety reasons');
    return Promise.resolve();
  }
};