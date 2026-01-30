const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const connection = await mysql.createConnection({
        host: '82.180.163.31',
        user: 'admin',
        password: 'root',
        database: 'a_la_reja',
        multipleStatements: true
    });

    try {
        const sqlPath = path.join(__dirname, '001_create_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing migration...');
        await connection.query(sql);
        console.log('Migration completed successfully!');

        // Verify tables were created
        console.log('\nVerifying schema...');
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables in database:');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`  - ${tableName}`);
        });

        // Show structure of each table
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            console.log(`\nStructure of ${tableName}:`);
            const [columns] = await connection.query(`DESCRIBE ${tableName}`);
            columns.forEach(col => {
                console.log(`  ${col.Field}: ${col.Type}${col.Key === 'PRI' ? ' (PK)' : ''}${col.Key === 'MUL' ? ' (FK)' : ''}`);
            });
        }

    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runMigration();
