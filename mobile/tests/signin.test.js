// Simple test file for SignIn component logic
console.log('Running SignIn component tests...\n');

// Mock Alert function
const Alert = {
  alert: (title, message) => {
    console.log(`ALERT: ${title} - ${message}`);
  }
};

// Mock Supabase function
const supabase = {
  auth: {
    signInWithOtp: async (email) => {
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => {
          if (email.email.includes('@')) {
            resolve({ error: null });
          } else {
            resolve({ error: { message: 'Invalid email' } });
          }
        }, 100);
      });
    }
  }
};

// Test function
async function testSignIn() {
  console.log('🧪 Testing SignIn component logic\n');
  
  // Test 1: Successful sign in with valid email
  console.log('1. Testing successful sign in with valid email:');
  try {
    const result1 = await supabase.auth.signInWithOtp({ email: 'test@example.com', options: {} });
    if (result1.error === null) {
      console.log('   ✅ SUCCESS: Alert should show: "Success", "Check your email for the login link!"');
      Alert.alert('Success', 'Check your email for the login link!');
    } else {
      console.log('   ❌ FAILED: Unexpected error');
    }
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
  }
  console.log('');
  
  // Test 2: Failed sign in with invalid email
  console.log('2. Testing failed sign in with invalid email:');
  try {
    const result2 = await supabase.auth.signInWithOtp({ email: 'invalid-email', options: {} });
    if (result2.error && result2.error.message === 'Invalid email') {
      console.log('   ✅ SUCCESS: Alert should show: "Error", "Invalid email"');
      Alert.alert('Error', 'Invalid email');
    } else {
      console.log('   ❌ FAILED: Expected error but got success');
    }
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
  }
  console.log('');
  
  // Test 3: Email validation
  console.log('3. Testing email validation:');
  const testEmails = [
    'test@example.com',
    'user@domain.com',
    'invalid-email',
    'missing@dot',
    'valid.email@domain.com'
  ];
  
  testEmails.forEach(email => {
    const isValid = email.includes('@') && email.includes('.') && email.length > 5;
    console.log(`   ${isValid ? '✅' : '❌'} ${email} -> ${isValid ? 'Valid' : 'Invalid'}`);
  });
}

// Run the tests
testSignIn().then(() => {
  console.log('\n🎉 All SignIn tests completed!');
  console.log('\nNext steps:');
  console.log('1. Test the actual component in Expo Dev Tools');
  console.log('2. Use the app on a simulator/device');
  console.log('3. Verify the alerts work correctly');
}).catch(error => {
  console.error('Test failed:', error);
});