const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function testPasswordAndLogin() {
  console.log('=== TESTING PASSWORD & LOGIN ===');
  
  // Test 1: Generate fresh password
  const plainPassword = 'password123';
  const freshHash = await bcrypt.hash(plainPassword, 12);
  console.log('Fresh hash generated:', freshHash);
  
  // Test 2: Test with database hash
  const dbHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeOGebFVFdmRnRgn2';
  const isValidDB = await bcrypt.compare(plainPassword, dbHash);
  console.log('DB hash validation:', isValidDB);
  
  // Test 3: Test with fresh hash
  const isValidFresh = await bcrypt.compare(plainPassword, freshHash);
  console.log('Fresh hash validation:', isValidFresh);
  
  // Test 4: Database connection and user query
  try {
    const db = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'attendance_system'
    });
    
    const [users] = await db.execute(
      'SELECT id, email, password, role FROM users WHERE email = ?',
      ['admin@attendancehub.com']
    );
    
    console.log('Users found in DB:', users.length);
    if (users.length > 0) {
      console.log('User data:', {
        id: users[0].id,
        email: users[0].email,
        role: users[0].role,
        passwordHash: users[0].password.substring(0, 20) + '...'
      });
      
      // Test password with actual DB hash
      const isValidActual = await bcrypt.compare(plainPassword, users[0].password);
      console.log('Actual DB password validation:', isValidActual);
    }
    
  } catch (error) {
    console.error('Database test failed:', error.message);
  }
}

testPasswordAndLogin();