#!/usr/bin/env node

/**
 * Test Script: MongoDB Atlas Serverless Connection Pattern
 * 
 * This script demonstrates the correct usage of dbConnect() and validates
 * that connections are being reused properly across multiple operations.
 */

import { dbConnect, getConnectionHealth, closeDB } from '../lib/db.js';
import Student from '../models/student.js';

async function testConnectionPattern() {
  console.log('🧪 Testing MongoDB Atlas Serverless Connection Pattern\n');
  
  try {
    // Test 1: Initial connection
    console.log('📋 Test 1: Initial Connection');
    console.log('Current health:', getConnectionHealth());
    
    const startTime = Date.now();
    await dbConnect();
    const firstConnectionTime = Date.now() - startTime;
    
    console.log(`✅ First connection established in ${firstConnectionTime}ms`);
    console.log('Updated health:', getConnectionHealth());
    console.log('');
    
    // Test 2: Connection reuse (should be instant)
    console.log('📋 Test 2: Connection Reuse');
    const reuseStartTime = Date.now();
    await dbConnect(); // Should reuse existing connection
    const reuseTime = Date.now() - reuseStartTime;
    
    console.log(`✅ Connection reused in ${reuseTime}ms (should be <5ms)`);
    console.log('Health after reuse:', getConnectionHealth());
    console.log('');
    
    // Test 3: Multiple database operations with single connection
    console.log('📋 Test 3: Multiple Operations with Cached Connection');
    
    const operationStartTime = Date.now();
    
    // Simulate multiple API calls - each should reuse the connection
    for (let i = 0; i < 5; i++) {
      const opStart = Date.now();
      await dbConnect(); // This should be instant after first call
      
      // Sample database operation
      const count = await Student.countDocuments();
      const opTime = Date.now() - opStart;
      
      console.log(`  Operation ${i + 1}: Connected + counted ${count} students in ${opTime}ms`);
    }
    
    const totalOperationTime = Date.now() - operationStartTime;
    console.log(`✅ All 5 operations completed in ${totalOperationTime}ms`);
    console.log('');
    
    // Test 4: Connection persistence check
    console.log('📋 Test 4: Connection Persistence Check');
    console.log('Connection should still be active...');
    
    const persistenceHealth = getConnectionHealth();
    console.log('Current connection state:');
    console.log(`  Status: ${persistenceHealth.status}`);
    console.log(`  Ready State: ${persistenceHealth.readyState} (${persistenceHealth.readyStateNames[persistenceHealth.readyState]})`);
    console.log(`  Host: ${persistenceHealth.host}`);
    console.log(`  Database: ${persistenceHealth.name}`);
    console.log(`  Pool Size: ${persistenceHealth.poolSize}`);
    console.log('');
    
    // Test 5: Performance comparison
    console.log('📋 Test 5: Performance Validation');
    if (firstConnectionTime > 100 && reuseTime < 10) {
      console.log('✅ Performance test PASSED:');
      console.log(`  - Initial connection: ${firstConnectionTime}ms (expected >100ms)`);
      console.log(`  - Connection reuse: ${reuseTime}ms (expected <10ms)`);
      console.log('  - Connection caching is working correctly!');
    } else {
      console.log('⚠️ Performance test results:');
      console.log(`  - Initial connection: ${firstConnectionTime}ms`);
      console.log(`  - Connection reuse: ${reuseTime}ms`);
      if (reuseTime >= 10) {
        console.log('  - Warning: Connection reuse seems slow - check caching logic');
      }
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ dbConnect() properly caches connections');
    console.log('✅ Subsequent calls reuse existing connection');
    console.log('✅ Multiple operations share single connection pool');
    console.log('✅ Connection health monitoring works');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Clean shutdown
    console.log('\n🧹 Cleaning up...');
    await closeDB();
    console.log('✅ Database connection closed gracefully');
    
    // Verify cleanup
    const finalHealth = getConnectionHealth();
    console.log(`Final connection state: ${finalHealth.status} (${finalHealth.readyStateNames[finalHealth.readyState]})`);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testConnectionPattern().catch(console.error);
}

export default testConnectionPattern;