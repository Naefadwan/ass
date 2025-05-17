const { sequelize } = require('../config/db');

(async () => {
  try {
    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    );
    console.log('Tables in database:', results.map(r => r.table_name));
    process.exit(0);
  } catch (err) {
    console.error('Error querying tables:', err);
    process.exit(1);
  }
})();
