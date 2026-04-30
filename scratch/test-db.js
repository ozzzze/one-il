import Database from 'better-sqlite3';
try {
    const db = new Database('test.db');
    console.log('Database connected successfully');
    db.close();
} catch (err) {
    console.error('Failed to connect to database:', err);
}
