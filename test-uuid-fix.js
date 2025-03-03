/**
 * Test UUID Fix
 * 
 * This script tests the UUID fix by simulating the authentication process
 * and verifying that a valid UUID is generated.
 */

// Import the auth service
import { auth } from './src/utils/authService.js';

// Function to validate UUID format
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Test the sign-in process
async function testSignIn() {
  console.log('Testing sign-in with UUID fix...');
  
  try {
    // Sign in with test credentials
    const result = await auth.signIn({
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (!result.data.session) {
      console.error('Error: No session returned from sign-in');
      return false;
    }
    
    const userId = result.data.session.user.id;
    console.log(`Generated user ID: ${userId}`);
    
    // Validate the UUID format
    if (isValidUUID(userId)) {
      console.log('✅ SUCCESS: User ID is a valid UUID');
      return true;
    } else {
      console.error('❌ ERROR: User ID is not a valid UUID');
      return false;
    }
  } catch (error) {
    console.error('Error during sign-in test:', error);
    return false;
  }
}

// Test the sign-up process
async function testSignUp() {
  console.log('\nTesting sign-up with UUID fix...');
  
  try {
    // Sign up with test credentials
    const result = await auth.signUp({
      email: 'newuser@example.com',
      password: 'password123'
    });
    
    if (!result.data.session) {
      console.error('Error: No session returned from sign-up');
      return false;
    }
    
    const userId = result.data.session.user.id;
    console.log(`Generated user ID: ${userId}`);
    
    // Validate the UUID format
    if (isValidUUID(userId)) {
      console.log('✅ SUCCESS: User ID is a valid UUID');
      return true;
    } else {
      console.error('❌ ERROR: User ID is not a valid UUID');
      return false;
    }
  } catch (error) {
    console.error('Error during sign-up test:', error);
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('=== UUID Fix Test ===\n');
  
  const signInSuccess = await testSignIn();
  const signUpSuccess = await testSignUp();
  
  console.log('\n=== Test Results ===');
  console.log(`Sign-in test: ${signInSuccess ? 'PASSED' : 'FAILED'}`);
  console.log(`Sign-up test: ${signUpSuccess ? 'PASSED' : 'FAILED'}`);
  
  if (signInSuccess && signUpSuccess) {
    console.log('\n✅ All tests passed! The UUID fix is working correctly.');
    console.log('You can now create care plans without UUID format errors.');
  } else {
    console.log('\n❌ Some tests failed. Please check the error messages above.');
  }
}

// Execute the tests
runTests().catch(error => {
  console.error('Unexpected error during tests:', error);
});
